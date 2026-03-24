import { Medicine } from '../models/Medicine.js';
import { Batch } from '../models/Batch.js';
import { Sale } from '../models/Sale.js';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const getSummary = async (req, res, next) => {
  try {
    const orgId = req.user.organization?._id ?? req.user.organization;

    const now = new Date();
    const expiryThreshold = new Date(now.getTime() + THIRTY_DAYS_MS);

    const [
      totalMedicines,
      lowStockMedicines,
      expiryBatches,
      salesSummary,
    ] = await Promise.all([
      Medicine.countDocuments({ organization: orgId }),

      Medicine.aggregate([
        { $match: { organization: orgId } },
        {
          $lookup: {
            from: 'batches',
            let: { medId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$medicine', '$$medId'] },
                  expiryDate: { $gt: now },
                  quantity: { $gt: 0 },
                },
              },
              { $group: { _id: null, total: { $sum: '$quantity' } } },
            ],
            as: 'stock',
          },
        },
        {
          $addFields: {
            currentStock: { $ifNull: [{ $arrayElemAt: ['$stock.total', 0] }, 0] },
          },
        },
        { $match: { $expr: { $lte: ['$currentStock', '$minStockLevel'] } } },
        {
          $project: {
            name: 1,
            minStockLevel: 1,
            currentStock: 1,
          },
        },
      ]),

      Batch.find(
        {
          organization: orgId,
          expiryDate: { $lte: expiryThreshold, $gte: now },
          quantity: { $gt: 0 },
        },
        'batchNo quantity expiryDate medicine'
      )
        .populate('medicine', 'name')
        .sort({ expiryDate: 1 })
        .limit(20)
        .lean(),

      Sale.aggregate([
        { $match: { organization: orgId } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const sales = salesSummary[0] || { totalAmount: 0, count: 0 };

    res.json({
      success: true,
      data: {
        totalMedicines,
        lowStockCount: lowStockMedicines.length,
        lowStockList: lowStockMedicines,
        expiryAlertsCount: expiryBatches.length,
        expiryAlertsList: expiryBatches,
        salesSummary: {
          totalAmount: sales.totalAmount,
          totalSales: sales.count,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
