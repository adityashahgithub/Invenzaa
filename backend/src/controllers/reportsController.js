import { Medicine } from '../models/Medicine.js';
import { Batch } from '../models/Batch.js';
import { Sale } from '../models/Sale.js';
import { Purchase } from '../models/Purchase.js';
import { InventoryLog } from '../models/InventoryLog.js';

const getOrgId = (req) => req.user.organization?._id ?? req.user.organization;
const now = () => new Date();
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const parseDateRange = (req) => {
  const start = req.query.startDate
    ? new Date(req.query.startDate)
    : new Date(new Date().setMonth(now().getMonth() - 11, 1));
  const end = req.query.endDate
    ? new Date(req.query.endDate)
    : new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const getInventoryReport = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const today = now();

    const batches = await Batch.find({ organization: orgId })
      .populate('medicine', 'name category unit minStockLevel')
      .lean();

    const stockByMedicine = {};
    batches.forEach((b) => {
      const key = b.medicine?._id?.toString();
      if (key && b.expiryDate > today && b.quantity > 0) {
        stockByMedicine[key] = (stockByMedicine[key] || 0) + b.quantity;
      }
    });

    const validBatches = batches.filter((b) => b.expiryDate > today && b.quantity > 0);
    const items = validBatches.map((b) => {
      const med = b.medicine;
      const totalStock = stockByMedicine[b.medicine?._id?.toString()] ?? 0;
      return {
        medicine: med?.name,
        medicineId: b.medicine?._id,
        batchNo: b.batchNo,
        quantity: b.quantity,
        totalStockForMedicine: totalStock,
        minStockLevel: med?.minStockLevel ?? 10,
        expiryDate: b.expiryDate,
        isLowStock: totalStock <= (med?.minStockLevel ?? 10),
      };
    });

    const uniqueMedicines = new Set(items.map((i) => i.medicineId?.toString()).filter(Boolean));
    const lowStockMedicines = new Set(
      items.filter((i) => i.isLowStock).map((i) => i.medicineId?.toString())
    );

    const summary = {
      totalBatches: validBatches.length,
      totalMedicines: uniqueMedicines.size,
      lowStockCount: lowStockMedicines.size,
    };

    res.json({
      success: true,
      data: { summary, items },
    });
  } catch (error) {
    next(error);
  }
};

export const getSalesReport = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const { start, end } = parseDateRange(req);

    const sales = await Sale.find({
      organization: orgId,
      saleDate: { $gte: start, $lte: end },
    })
      .populate('items.medicine', 'name')
      .lean();

    const totalAmount = sales.reduce((s, sale) => s + (sale.totalAmount || 0), 0);
    const totalTransactions = sales.length;

    const medicineSales = {};
    sales.forEach((sale) => {
      sale.items?.forEach((item) => {
        const medId = item.medicine?._id?.toString() ?? item.medicine?.toString();
        const name = item.medicine?.name ?? 'Unknown';
        if (!medicineSales[medId]) {
          medicineSales[medId] = { name, quantity: 0, revenue: 0 };
        }
        medicineSales[medId].quantity += item.quantity || 0;
        medicineSales[medId].revenue += item.total || 0;
      });
    });

    const topSelling = Object.entries(medicineSales)
      .map(([id, data]) => ({ medicineId: id, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const byMonth = {};
    sales.forEach((s) => {
      const d = new Date(s.saleDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { total: 0, count: 0 };
      byMonth[key].total += s.totalAmount || 0;
      byMonth[key].count += 1;
    });

    const monthlyData = Object.entries(byMonth)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      success: true,
      data: {
        summary: { totalAmount, totalTransactions },
        byMonth: monthlyData,
        topSelling,
        dateRange: { start, end },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPurchasesReport = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const { start, end } = parseDateRange(req);

    const purchases = await Purchase.find({
      organization: orgId,
      purchaseDate: { $gte: start, $lte: end },
    })
      .populate('items.medicine', 'name')
      .lean();

    const totalCost = purchases.reduce((s, p) => s + (p.totalCost || 0), 0);
    const totalTransactions = purchases.length;

    const byMonth = {};
    purchases.forEach((p) => {
      const d = new Date(p.purchaseDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { total: 0, count: 0 };
      byMonth[key].total += p.totalCost || 0;
      byMonth[key].count += 1;
    });

    const monthlyData = Object.entries(byMonth)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      success: true,
      data: {
        summary: { totalCost, totalTransactions },
        byMonth: monthlyData,
        dateRange: { start, end },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getLowStockReport = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const today = now();

    const stockAgg = await Batch.aggregate([
      {
        $match: {
          organization: orgId,
          expiryDate: { $gt: today },
          quantity: { $gt: 0 },
        },
      },
      { $group: { _id: '$medicine', total: { $sum: '$quantity' } } },
    ]);
    const stockMap = Object.fromEntries(stockAgg.map((s) => [s._id.toString(), s.total]));

    const medicines = await Medicine.find({ organization: orgId }).lean();

    const lowStock = medicines
      .filter((m) => (stockMap[m._id.toString()] ?? 0) <= (m.minStockLevel ?? 10))
      .map((m) => ({
        ...m,
        currentStock: stockMap[m._id.toString()] ?? 0,
        minStockLevel: m.minStockLevel ?? 10,
      }));

    res.json({
      success: true,
      data: {
        summary: { count: lowStock.length },
        items: lowStock,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getExpiryReport = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const today = now();
    today.setHours(0, 0, 0, 0);
    const daysAhead = parseInt(req.query.days) || 90;
    const threshold = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const batches = await Batch.find({
      organization: orgId,
      expiryDate: { $gte: today, $lte: threshold },
      quantity: { $gt: 0 },
    })
      .populate('medicine', 'name unit')
      .sort({ expiryDate: 1 })
      .lean();

    const byMonth = {};
    batches.forEach((b) => {
      const d = new Date(b.expiryDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { count: 0, quantity: 0 };
      byMonth[key].count += 1;
      byMonth[key].quantity += b.quantity || 0;
    });

    const monthlyData = Object.entries(byMonth)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      success: true,
      data: {
        summary: { totalBatches: batches.length, totalQuantity: batches.reduce((s, b) => s + b.quantity, 0) },
        items: batches,
        byMonth: monthlyData,
        dateRange: { from: today, to: threshold },
      },
    });
  } catch (error) {
    next(error);
  }
};
