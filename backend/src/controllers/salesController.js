import { Sale } from '../models/Sale.js';
import { Invoice } from '../models/Invoice.js';
import { createSaleWithTransaction } from '../services/saleService.js';
import { AppError } from '../middleware/errorHandler.js';

const getOrgId = (req) => req.user.organization?._id ?? req.user.organization;

export const createSale = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const userId = req.user._id;
    const { items, customerName } = req.body;

    const result = await createSaleWithTransaction({
      items,
      customerName,
      orgId,
      userId,
    });

    res.status(201).json({
      success: true,
      message: 'Sale recorded and invoice generated',
      data: {
        sale: result.sale,
        invoice: result.invoice,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const listSales = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const q = req.query.q?.trim();
    const filter = { organization: orgId };
    if (q) {
      filter.customerName = { $regex: q, $options: 'i' };
    }

    const [sales, total] = await Promise.all([
      Sale.find(filter)
        .populate('items.medicine', 'name')
        .populate('items.batch', 'batchNo expiryDate')
        .sort({ saleDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Sale.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        sales,
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

export const getSaleById = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);

    const sale = await Sale.findOne({
      _id: req.params.id,
      organization: orgId,
    })
      .populate('items.medicine', 'name genericName unit')
      .populate('items.batch', 'batchNo expiryDate')
      .lean();

    if (!sale) {
      throw new AppError('Sale not found', 404);
    }

    const invoice = await Invoice.findOne({
      sale: sale._id,
      organization: orgId,
    }).lean();

    res.json({
      success: true,
      data: {
        sale,
        invoice: invoice || null,
      },
    });
  } catch (error) {
    next(error);
  }
};
