import mongoose from 'mongoose';
import { Sale } from '../models/Sale.js';
import { Batch } from '../models/Batch.js';
import { createLogForSale } from './inventoryLogService.js';
import { createInvoiceFromSale } from './invoiceService.js';
import { AppError } from '../middleware/errorHandler.js';

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const runWithTransaction = async (fn) => {
  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (txError) {
    if (
      txError.message?.includes('replica set') ||
      txError.message?.includes('Transaction')
    ) {
      return fn(null);
    }
    throw txError;
  }
};

export const createSaleWithTransaction = async ({ items, customerName, orgId, userId }) => {
  return runWithTransaction(async (session) => {
    if (!items?.length) {
      throw new AppError('At least one item is required', 400);
    }

    const saleItems = [];
    let totalAmount = 0;
    const batchUpdates = [];

    for (const item of items) {
      const { medicineId, batchId, quantity, unitPrice } = item;

      let batchQuery = Batch.findOne({
        _id: batchId,
        organization: orgId,
        medicine: medicineId,
      });
      if (session) batchQuery = batchQuery.session(session);
      const batch = await batchQuery;

      if (!batch) {
        throw new AppError(`Batch not found: ${batchId}`, 404);
      }

      const expiryDate = new Date(batch.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      if (expiryDate < today()) {
        throw new AppError(
          `Batch ${batch.batchNo} has expired. Cannot sell expired stock.`,
          400
        );
      }

      if (batch.quantity < quantity) {
        throw new AppError(
          `Insufficient stock for batch ${batch.batchNo}. Available: ${batch.quantity}`,
          400
        );
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
      batchUpdates.push({ batch, quantity });
    }

    const sale = await Sale.create(
      [
        {
          items: saleItems,
          totalAmount,
          organization: orgId,
          customerName: customerName ?? '',
        },
      ],
      session ? { session } : {}
    );

    const createdSale = sale[0];

    for (const { batch, quantity } of batchUpdates) {
      const prevQty = batch.quantity;
      const newQty = prevQty - quantity;
      batch.quantity = newQty;
      await batch.save(session ? { session } : {});

      await createLogForSale(
        {
          medicineId: batch.medicine,
          batchId: batch._id,
          quantityChange: quantity,
          previousQty: prevQty,
          newQty,
          saleId: createdSale._id,
          orgId,
          userId,
        },
        session
      );
    }

    let query = Sale.findById(createdSale._id)
      .populate('items.medicine', 'name')
      .populate('items.batch', 'batchNo expiryDate');
    if (session) query = query.session(session);
    const populatedSale = await query.lean();

    const invoice = await createInvoiceFromSale(populatedSale, orgId, session);

    return {
      sale: populatedSale,
      invoice: invoice.toObject ? invoice.toObject() : invoice,
    };
  });
};
