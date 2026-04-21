import { Medicine } from '../models/Medicine.js';
import { Batch } from '../models/Batch.js';
import { Category } from '../models/Category.js';
import { Brand } from '../models/Brand.js';
import { AppError } from '../middleware/errorHandler.js';

const getOrgId = (req) => req.user.organization?._id ?? req.user.organization;
const now = () => new Date();

const resolveMasterRefs = async (input, orgId) => {
  const payload = { ...input };

  if (Object.prototype.hasOwnProperty.call(input, 'category')) {
    const categoryName = (input.category ?? '').trim();
    payload.category = categoryName;
    if (!categoryName) {
      payload.categoryRef = null;
    } else {
      const category = await Category.findOne({ organization: orgId, name: categoryName }, '_id').lean();
      if (!category) {
        throw new AppError('Selected category does not exist in masters', 400);
      }
      payload.categoryRef = category._id;
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'brand')) {
    const brandName = (input.brand ?? '').trim();
    payload.brand = brandName;
    if (!brandName) {
      payload.brandRef = null;
    } else {
      const brand = await Brand.findOne({ organization: orgId, name: brandName }, '_id').lean();
      if (!brand) {
        throw new AppError('Selected brand does not exist in masters', 400);
      }
      payload.brandRef = brand._id;
    }
  }

  return payload;
};

const addStockInfo = async (medicines, orgId) => {
  const medIds = medicines.map((m) => m._id);
  const stockAgg = await Batch.aggregate([
    {
      $match: {
        medicine: { $in: medIds },
        organization: orgId,
        expiryDate: { $gt: now() },
        quantity: { $gt: 0 },
      },
    },
    { $group: { _id: '$medicine', total: { $sum: '$quantity' } } },
  ]);
  const stockMap = Object.fromEntries(stockAgg.map((s) => [s._id.toString(), s.total]));

  return medicines.map((m) => {
    const currentStock = stockMap[m._id.toString()] ?? 0;
    return {
      ...m.toObject ? m.toObject() : m,
      currentStock,
      isLowStock: currentStock <= (m.minStockLevel ?? 10),
    };
  });
};

export const createMedicine = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const payload = await resolveMasterRefs(req.body, orgId);
    const medicine = await Medicine.create({ ...payload, organization: orgId });
    res.status(201).json({
      success: true,
      message: 'Medicine created',
      data: { medicine },
    });
  } catch (error) {
    next(error);
  }
};

export const listMedicines = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 10));
    const category = req.query.category?.trim();

    const filter = { organization: orgId };
    if (category) filter.category = category;

    const [medicines, total] = await Promise.all([
      Medicine.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      Medicine.countDocuments(filter),
    ]);

    const withStock = await addStockInfo(medicines, orgId);

    res.json({
      success: true,
      data: {
        medicines: withStock,
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

export const getMedicineById = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const medicine = await Medicine.findOne({ _id: req.params.id, organization: orgId }).lean();

    if (!medicine) {
      throw new AppError('Medicine not found', 404);
    }

    const [withStock] = await addStockInfo([medicine], orgId);
    res.json({
      success: true,
      data: { medicine: withStock },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMedicine = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const payload = await resolveMasterRefs(req.body, orgId);
    const medicine = await Medicine.findOneAndUpdate(
      { _id: req.params.id, organization: orgId },
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!medicine) {
      throw new AppError('Medicine not found', 404);
    }

    const [withStock] = await addStockInfo([medicine], orgId);
    res.json({
      success: true,
      message: 'Medicine updated',
      data: { medicine: withStock },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMedicine = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const medicine = await Medicine.findOneAndDelete({
      _id: req.params.id,
      organization: orgId,
    });

    if (!medicine) {
      throw new AppError('Medicine not found', 404);
    }

    await Batch.deleteMany({ medicine: medicine._id, organization: orgId });

    res.json({
      success: true,
      message: 'Medicine deleted',
    });
  } catch (error) {
    next(error);
  }
};

export const searchMedicines = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const q = req.query.q?.trim() || '';
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 10));

    const filter = {
      organization: orgId,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { genericName: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
      ],
    };

    const [medicines, total] = await Promise.all([
      Medicine.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      Medicine.countDocuments(filter),
    ]);

    const withStock = await addStockInfo(medicines, orgId);

    res.json({
      success: true,
      data: {
        medicines: withStock,
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
