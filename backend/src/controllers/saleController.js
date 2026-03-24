import { Batch } from '../models/Batch.js';
import { Sale } from '../models/Sale.js';
import { createLogForSale } from '../services/inventoryLogService.js';
import { AppError } from '../middleware/errorHandler.js';

const getOrgId = (req) => req.user.organization?._id ?? req.user.organization;

export const createSale = async (req, res, next) => {
  try {
    const orgId = getOrgId(req);
    const userId = req.user._id;
    const { items } = req.body;

    if (!items?.length) {
      throw new AppError('At least one item is required', 400);
    }

    const saleItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const { medicineId, batchId, quantity, unitPrice } = item;

      const batch = await Batch.findOne({
        _id: batchId,
        organization: orgId,
        medicine: medicineId,
      });
      if (!batch) throw new AppError(`Batch not found: ${batchId}`, 404);
      if (batch.quantity < quantity) {
        throw new AppError(`Insufficient stock for batch ${batch.batchNo}. Available: ${batch.quantity}`, 400);
      }

      const total = quantity * unitPrice;
      totalAmount += total;
      saleItems.push({
        medicine: medicineId,
        batch: batchId,
        quantity,
        unitPrice,
        total,
      });
    }

    const sale = await Sale.create({
      items: saleItems,
      totalAmount,
      organization: orgId,
    });

    for (const item of items) {
      const { medicineId, batchId, quantity } = item;
      const batch = await Batch.findOne({ _id: batchId, organization: orgId });
      const prevQty = batch.quantity;
      const newQty = prevQty - quantity;
      batch.quantity = newQty;
      await batch.save();

      await createLogForSale({
        medicineId,
        batchId,
        quantityChange: quantity,
        previousQty: prevQty,
        newQty,
        saleId: sale._id,
        orgId,
        userId,
      });
    }

    const populated = await Sale.findById(sale._id)
      .populate('items.medicine', 'name')
      .populate('items.batch', 'batchNo expiryDate')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Sale recorded',
      data: { sale: populated },
    });
  } catch (error) {
    next(error);
  }
};
