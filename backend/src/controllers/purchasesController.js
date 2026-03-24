import { Purchase } from '../models/Purchase.js';
import { PurchaseInvoice } from '../models/PurchaseInvoice.js';
import { createPurchaseWithTransaction } from '../services/purchaseService.js';
import { AppError } from '../middleware/errorHandler.js';

const getOrgId = (req) => req.user.organization?._id ?? req.user.organization;

export const createPurchase = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const userId = req.user._id;
    const { items, supplierName } = req.body;

    const result = await createPurchaseWithTransaction({
      items,
      supplierName,
      orgId,
      userId,
    });

    res.status(201).json({
      success: true,
      message: 'Purchase recorded and invoice generated',
      data: {
        purchase: result.purchase,
        invoice: result.invoice,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const listPurchases = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const q = req.query.q?.trim();
    const filter = { organization: orgId };
    if (q) {
      filter.supplierName = { $regex: q, $options: 'i' };
    }

    const [purchases, total] = await Promise.all([
      Purchase.find(filter)
        .populate('items.medicine', 'name')
        .populate('items.batch', 'batchNo expiryDate')
        .sort({ purchaseDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Purchase.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        purchases,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPurchaseById = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);

    const purchase = await Purchase.findOne({
      _id: req.params.id,
      organization: orgId,
    })
      .populate('items.medicine', 'name genericName unit')
      .populate('items.batch', 'batchNo expiryDate manufactureDate')
      .lean();

    if (!purchase) {
      throw new AppError('Purchase not found', 404);
    }

    const invoice = await PurchaseInvoice.findOne({
      purchase: purchase._id,
      organization: orgId,
    }).lean();

    res.json({
      success: true,
      data: {
        purchase,
        invoice: invoice || null,
      },
    });
  } catch (error) {
    next(error);
  }
};
