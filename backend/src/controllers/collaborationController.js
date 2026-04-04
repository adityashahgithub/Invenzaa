import { CollaborationRequest } from '../models/CollaborationRequest.js';
import { CollaborationResponse } from '../models/CollaborationResponse.js';
import { Organization } from '../models/Organization.js';
import { Medicine } from '../models/Medicine.js';
import { Batch } from '../models/Batch.js';
import { AppError } from '../middleware/errorHandler.js';

const getOrgId = (req) => req.user.organization?._id ?? req.user.organization;

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Resolve responder's catalog row for a requester's medicine (cross-org names often differ in genericName). */
async function findResponderMedicine(orgId, requestedMedicine) {
  const nameTrim = (requestedMedicine.name || '').trim();
  if (!nameTrim) {
    throw new AppError('Requested medicine has no name.', 400);
  }

  const nameRegex = new RegExp(`^${escapeRegex(nameTrim)}$`, 'i');
  const candidates = await Medicine.find({
    organization: orgId,
    name: nameRegex,
  })
    .select('_id name genericName')
    .lean();

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const reqGen = (requestedMedicine.genericName || '').trim();
  if (reqGen) {
    const genLower = reqGen.toLowerCase();
    const byGeneric = candidates.find(
      (c) => (c.genericName || '').trim().toLowerCase() === genLower
    );
    if (byGeneric) return byGeneric;
  }
  return candidates[0];
}

export const getPartners = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);

    const partners = await Organization.find({ _id: { $ne: orgId } })
      .select('name address phone')
      .lean();

    res.json({
      success: true,
      data: { partners },
    });
  } catch (error) {
    next(error);
  }
};

export const createRequest = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const userId = req.user._id;
    const { toOrganizationId, medicineId, quantity, message } = req.body;

    const [toOrg, medicine] = await Promise.all([
      Organization.findById(toOrganizationId),
      Medicine.findOne({ _id: medicineId, organization: orgId }),
    ]);

    if (!toOrg) throw new AppError('Partner organization not found', 404);
    if (!medicine) throw new AppError('Medicine not found', 404);
    if (toOrganizationId === orgId.toString()) {
      throw new AppError('Cannot request from your own organization', 400);
    }

    const request = await CollaborationRequest.create({
      fromOrganization: orgId,
      toOrganization: toOrganizationId,
      medicine: medicineId,
      quantity,
      message: message ?? '',
      createdBy: userId,
    });

    const populated = await CollaborationRequest.findById(request._id)
      .populate('medicine', 'name genericName unit')
      .populate('fromOrganization', 'name')
      .populate('toOrganization', 'name')
      .populate('createdBy', 'firstName lastName')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Collaboration request created',
      data: { request: populated },
    });
  } catch (error) {
    next(error);
  }
};

export const listRequests = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const { type = 'sent', status } = req.query;

    const filter = type === 'received' ? { toOrganization: orgId } : { fromOrganization: orgId };
    if (status) filter.status = status;

    const requests = await CollaborationRequest.find(filter)
      .populate('medicine', 'name genericName unit')
      .populate('fromOrganization', 'name')
      .populate('toOrganization', 'name')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: { requests },
    });
  } catch (error) {
    next(error);
  }
};

export const getRequestById = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);

    const request = await CollaborationRequest.findOne({
      _id: req.params.id,
      $or: [{ fromOrganization: orgId }, { toOrganization: orgId }],
    })
      .populate('medicine', 'name genericName unit')
      .populate('fromOrganization', 'name address')
      .populate('toOrganization', 'name address')
      .populate('createdBy', 'firstName lastName email')
      .lean();

    if (!request) throw new AppError('Request not found', 404);

    const response = await CollaborationResponse.findOne({ request: request._id })
      .populate('respondedBy', 'firstName lastName')
      .lean();

    res.json({
      success: true,
      data: { request, response: response || null },
    });
  } catch (error) {
    next(error);
  }
};

export const updateRequestStatus = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const userId = req.user._id;
    const { status } = req.body;

    const request = await CollaborationRequest.findOne({
      _id: req.params.id,
      fromOrganization: orgId,
    });

    if (!request) throw new AppError('Request not found', 404);
    if (request.status !== 'pending') {
      throw new AppError('Only pending requests can be updated', 400);
    }

    if (status === 'cancelled') {
      request.status = 'cancelled';
      await request.save();
    } else {
      throw new AppError('Only cancellation is allowed via this endpoint', 400);
    }

    const populated = await CollaborationRequest.findById(request._id)
      .populate('medicine', 'name')
      .populate('toOrganization', 'name')
      .lean();

    res.json({
      success: true,
      message: 'Request status updated',
      data: { request: populated },
    });
  } catch (error) {
    next(error);
  }
};

export const createResponse = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const userId = req.user._id;
    const { requestId, status, message, quantityOffered } = req.body;

    const request = await CollaborationRequest.findById(requestId);

    if (!request) throw new AppError('Request not found', 404);
    if (request.toOrganization.toString() !== orgId.toString()) {
      throw new AppError('You can only respond to requests sent to your organization', 403);
    }
    if (request.status !== 'pending') {
      throw new AppError('Request has already been responded to', 400);
    }

    const existing = await CollaborationResponse.findOne({ request: requestId });
    if (existing) throw new AppError('Response already exists for this request', 400);

    if (status === 'accepted') {
      const offeredQty = Number(quantityOffered);
      if (!Number.isFinite(offeredQty) || offeredQty <= 0) {
        throw new AppError('quantityOffered must be greater than 0 for accepted responses.', 400);
      }
      if (offeredQty > request.quantity) {
        throw new AppError('quantityOffered cannot exceed requested quantity.', 400);
      }

      const requestedMedicine = await Medicine.findById(request.medicine).select('name genericName');
      if (!requestedMedicine) {
        throw new AppError('Requested medicine reference is invalid.', 400);
      }

      const localMedicine = await findResponderMedicine(orgId, requestedMedicine);
      if (!localMedicine) {
        throw new AppError(
          'Cannot approve request: this medicine is not available in your organization inventory.',
          400
        );
      }

      const stockAgg = await Batch.aggregate([
        {
          $match: {
            organization: orgId,
            medicine: localMedicine._id,
            quantity: { $gt: 0 },
            expiryDate: { $gt: new Date() },
          },
        },
        { $group: { _id: '$medicine', total: { $sum: '$quantity' } } },
      ]);
      const availableQty = stockAgg?.[0]?.total || 0;
      if (availableQty < offeredQty) {
        throw new AppError(
          `Cannot approve request: insufficient stock. Available ${availableQty}, offered ${offeredQty}.`,
          400
        );
      }
    }

    const response = await CollaborationResponse.create({
      request: requestId,
      status,
      message: message ?? '',
      quantityOffered: status === 'accepted' ? Number(quantityOffered) : undefined,
      respondedBy: userId,
    });

    request.status = status === 'accepted' ? 'approved' : 'rejected';
    request.approvedBy = userId;
    await request.save();

    const populated = await CollaborationResponse.findById(response._id)
      .populate('request')
      .populate('respondedBy', 'firstName lastName')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Response submitted',
      data: { response: populated },
    });
  } catch (error) {
    next(error);
  }
};

export const getResponsesByRequestId = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const { requestId } = req.params;

    const request = await CollaborationRequest.findById(requestId);
    if (!request) throw new AppError('Request not found', 404);
    if (
      request.fromOrganization.toString() !== orgId.toString() &&
      request.toOrganization.toString() !== orgId.toString()
    ) {
      throw new AppError('Not authorized to view this request', 403);
    }

    const response = await CollaborationResponse.findOne({ request: requestId })
      .populate('respondedBy', 'firstName lastName')
      .lean();

    res.json({
      success: true,
      data: { response: response || null, request },
    });
  } catch (error) {
    next(error);
  }
};
