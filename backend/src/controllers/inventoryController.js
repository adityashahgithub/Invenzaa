import { Medicine } from '../models/Medicine.js';
import { Batch } from '../models/Batch.js';
import { InventoryLog } from '../models/InventoryLog.js';

const getOrgId = (req) => req.user.organization?._id ?? req.user.organization;
const now = () => new Date();
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const computeStatus = (batch, medicine, totalStock) => {
  const today = now();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(batch.expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const isExpired = expiry < today;
  const expiryThreshold = new Date(today.getTime() + THIRTY_DAYS_MS);
  const isExpiringSoon = !isExpired && batch.expiryDate <= expiryThreshold;
  const isLowStock = totalStock <= (medicine?.minStockLevel ?? 10);

  let status = 'ok';
  if (isExpired) status = 'expired';
  else if (isLowStock) status = 'low_stock';
  else if (isExpiringSoon) status = 'expiring_soon';

  return { status, isExpired, isLowStock, isExpiringSoon };
};

export const getStatus = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const { sort = 'name', order = 'asc', filter } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 20));
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortField =
      sort === 'expiry' ? 'expiryDate' : sort === 'stock' ? 'quantity' : 'medicine.name';
    const today = now();
    today.setHours(0, 0, 0, 0);
    const expiryThreshold = new Date(today.getTime() + THIRTY_DAYS_MS);

    const basePipeline = [
      { $match: { organization: orgId } },
      {
        $lookup: {
          from: 'medicines',
          localField: 'medicine',
          foreignField: '_id',
          as: 'medicine',
        },
      },
      { $unwind: { path: '$medicine', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'batches',
          let: { medId: '$medicine._id', orgId: '$organization' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$medicine', '$$medId'] },
                    { $eq: ['$organization', '$$orgId'] },
                    { $gt: ['$expiryDate', new Date()] },
                    { $gt: ['$quantity', 0] },
                  ],
                },
              },
            },
            { $group: { _id: null, total: { $sum: '$quantity' } } },
          ],
          as: 'stockInfo',
        },
      },
      {
        $addFields: {
          totalStockForMedicine: { $ifNull: [{ $first: '$stockInfo.total' }, 0] },
          minStockLevel: { $ifNull: ['$medicine.minStockLevel', 10] },
        },
      },
      {
        $addFields: {
          isExpired: { $lt: ['$expiryDate', today] },
          isExpiringSoon: {
            $and: [
              { $gte: ['$expiryDate', today] },
              { $lte: ['$expiryDate', expiryThreshold] },
            ],
          },
          isLowStock: { $lte: ['$totalStockForMedicine', '$minStockLevel'] },
        },
      },
      {
        $addFields: {
          status: {
            $switch: {
              branches: [
                { case: '$isExpired', then: 'expired' },
                { case: '$isLowStock', then: 'low_stock' },
                { case: '$isExpiringSoon', then: 'expiring_soon' },
              ],
              default: 'ok',
            },
          },
        },
      },
    ];

    if (filter) {
      basePipeline.push({ $match: { status: filter } });
    }

    const [medicines, stockAgg, expiredCount, expiringSoonCount] = await Promise.all([
      Medicine.find(
        { organization: orgId },
        '_id name genericName category unit minStockLevel'
      ).lean(),
      Batch.aggregate([
        { $match: { organization: orgId, expiryDate: { $gt: new Date() }, quantity: { $gt: 0 } } },
        { $group: { _id: '$medicine', total: { $sum: '$quantity' } } },
      ]),
      Batch.countDocuments({ organization: orgId, quantity: { $gt: 0 }, expiryDate: { $lt: today } }),
      Batch.countDocuments({
        organization: orgId,
        quantity: { $gt: 0 },
        expiryDate: { $gte: today, $lte: expiryThreshold },
      }),
    ]);

    const stockMap = Object.fromEntries(stockAgg.map((s) => [s._id.toString(), s.total]));

    const lowStockMedicines = medicines
      .map((m) => ({
        ...m,
        currentStock: stockMap[m._id.toString()] ?? 0,
        minStockLevel: m.minStockLevel ?? 10,
      }))
      .filter((m) => m.currentStock <= m.minStockLevel);

    const lowStockCount = lowStockMedicines.length;

    if (filter === 'low_stock') {
      let sorted = [...lowStockMedicines];

      if (sort === 'stock') {
        sorted.sort((a, b) => sortOrder * (a.currentStock - b.currentStock || a.name.localeCompare(b.name)));
      } else {
        sorted.sort((a, b) => sortOrder * a.name.localeCompare(b.name));
      }

      const total = sorted.length;
      const pageItems = sorted.slice((page - 1) * limit, page * limit).map((m) => ({
        _id: `low-${m._id}`,
        batchNo: '—',
        quantity: 0,
        expiryDate: null,
        manufactureDate: null,
        medicineId: m._id,
        medicine: {
          _id: m._id,
          name: m.name,
          genericName: m.genericName,
          category: m.category,
          unit: m.unit,
          minStockLevel: m.minStockLevel,
        },
        totalStockForMedicine: m.currentStock,
        minStockLevel: m.minStockLevel,
        status: 'low_stock',
        isExpired: false,
        isLowStock: true,
        isExpiringSoon: false,
      }));

      return res.json({
        success: true,
        data: {
          items: pageItems,
          summary: {
            expiredCount,
            expiringSoonCount,
            lowStockCount,
          },
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    }

    const [pagedResult] = await Promise.all([
      Batch.aggregate([
        ...basePipeline,
        { $sort: { [sortField]: sortOrder, _id: 1 } },
        {
          $facet: {
            items: [
              { $skip: (page - 1) * limit },
              { $limit: limit },
              {
                $project: {
                  _id: 1,
                  batchNo: 1,
                  quantity: 1,
                  expiryDate: 1,
                  manufactureDate: 1,
                  medicineId: '$medicine._id',
                  medicine: {
                    _id: '$medicine._id',
                    name: '$medicine.name',
                    genericName: '$medicine.genericName',
                    category: '$medicine.category',
                    unit: '$medicine.unit',
                    minStockLevel: '$minStockLevel',
                  },
                  totalStockForMedicine: 1,
                  minStockLevel: 1,
                  status: 1,
                  isExpired: 1,
                  isLowStock: 1,
                  isExpiringSoon: 1,
                },
              },
            ],
            meta: [{ $count: 'total' }],
          },
        },
      ]),
    ]);

    const items = pagedResult?.[0]?.items ?? [];
    const total = pagedResult?.[0]?.meta?.[0]?.total ?? 0;

    res.json({
      success: true,
      data: {
        items,
        summary: {
          expiredCount,
          expiringSoonCount,
          lowStockCount,
        },
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

export const getLowStock = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const today = now();

    const stockAgg = await Batch.aggregate([
      { $match: { organization: orgId, expiryDate: { $gt: today }, quantity: { $gt: 0 } } },
      { $group: { _id: '$medicine', total: { $sum: '$quantity' } } },
    ]);
    const stockMap = Object.fromEntries(stockAgg.map((s) => [s._id.toString(), s.total]));

    const medicines = await Medicine.find({ organization: orgId })
      .lean();

    const lowStock = medicines
      .filter((m) => (stockMap[m._id.toString()] ?? 0) <= (m.minStockLevel ?? 10))
      .map((m) => ({
        ...m,
        currentStock: stockMap[m._id.toString()] ?? 0,
        minStockLevel: m.minStockLevel ?? 10,
      }));

    res.json({
      success: true,
      data: { items: lowStock, count: lowStock.length },
    });
  } catch (error) {
    next(error);
  }
};

export const getExpiryAlerts = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const today = now();
    today.setHours(0, 0, 0, 0);
    const expiryThreshold = new Date(today.getTime() + THIRTY_DAYS_MS);

    const batches = await Batch.find({
      organization: orgId,
      expiryDate: { $gte: today, $lte: expiryThreshold },
      quantity: { $gt: 0 },
    })
      .populate('medicine', 'name genericName unit')
      .sort({ expiryDate: 1 })
      .lean();

    const items = batches.map((b) => {
      const isExpired = b.expiryDate < today;
      return {
        ...b,
        isExpired,
        daysUntilExpiry: Math.ceil((b.expiryDate - today) / (24 * 60 * 60 * 1000)),
      };
    });

    res.json({
      success: true,
      data: { items, count: items.length },
    });
  } catch (error) {
    next(error);
  }
};

export const getExpired = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const today = now();
    today.setHours(0, 0, 0, 0);

    const batches = await Batch.find({
      organization: orgId,
      expiryDate: { $lt: today },
      quantity: { $gt: 0 },
    })
      .populate('medicine', 'name genericName unit')
      .sort({ expiryDate: 1 })
      .lean();

    res.json({
      success: true,
      data: { items: batches, count: batches.length },
    });
  } catch (error) {
    next(error);
  }
};

export const getAvailableBatches = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const medicineId = req.query.medicineId;
    const today = now();

    if (!medicineId) {
      return res.status(400).json({
        success: false,
        message: 'medicineId query parameter is required',
      });
    }

    const batches = await Batch.find({
      organization: orgId,
      medicine: medicineId,
      expiryDate: { $gt: today },
      quantity: { $gt: 0 },
    })
      .populate('medicine', 'name unit')
      .sort({ expiryDate: 1 })
      .lean();

    res.json({
      success: true,
      data: { batches },
    });
  } catch (error) {
    next(error);
  }
};

export const getLogs = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const type = req.query.type;
    const medicineId = req.query.medicineId;

    const filter = { organization: orgId };
    if (type) filter.type = type;
    if (medicineId) filter.medicine = medicineId;

    const [logs, total] = await Promise.all([
      InventoryLog.find(filter)
        .populate('medicine', 'name')
        .populate('batch', 'batchNo expiryDate')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      InventoryLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        logs,
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
