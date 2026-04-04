import { Purchase } from '../models/Purchase.js';
import { PurchaseInvoice } from '../models/PurchaseInvoice.js';
import { createPurchaseWithTransaction } from '../services/purchaseService.js';
import { AppError } from '../middleware/errorHandler.js';

const getOrgId = (req) => req.user.organization?._id ?? req.user.organization;

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * List UI shows "General Supplier" when supplierName is unset/empty.
 * Searching that label must still find those purchases.
 */
function matchesBlankSupplierDisplaySearch(q) {
  const t = q.trim().toLowerCase().replace(/\s+/g, ' ');
  return ['general supplier', 'default supplier', 'default', 'n/a', 'na', '-', 'none', 'no supplier'].includes(t);
}

export const createPurchase = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const userId = req.user._id;
    const userRole = req.user.role;
    const { items, supplierName } = req.body;

    const result = await createPurchaseWithTransaction({
      items,
      supplierName,
      orgId,
      userId,
      userRole,
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
    let filter;
    if (q) {
      const escaped = escapeRegex(q);
      if (matchesBlankSupplierDisplaySearch(q)) {
        filter = {
          $and: [
            { organization: orgId },
            {
              $or: [
                { supplierName: { $regex: escaped, $options: 'i' } },
                { supplierName: '' },
                { supplierName: { $exists: false } },
              ],
            },
          ],
        };
      } else {
        filter = {
          organization: orgId,
          supplierName: { $regex: escaped, $options: 'i' },
        };
      }
    } else {
      filter = { organization: orgId };
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
