import mongoose from 'mongoose';
import { Batch } from '../models/Batch.js';
import { Purchase } from '../models/Purchase.js';
import { Medicine } from '../models/Medicine.js';
import { createLogForPurchase } from './inventoryLogService.js';
import { createPurchaseInvoice } from './purchaseInvoiceService.js';
import { AppError } from '../middleware/errorHandler.js';

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

export const createPurchaseWithTransaction = async ({
  items,
  supplierName,
  orgId,
  userId,
  userRole,
}) => {
  return runWithTransaction(async (session) => {
    if (!items?.length) {
      throw new AppError('At least one item is required', 400);
    }

    const purchaseItems = [];
    let totalCost = 0;
    const batchUpdates = [];

    for (const item of items) {
      const {
        medicineId,
        batchNo,
        quantity,
        unitCost,
        manufactureDate,
        expiryDate,
        allowExpiredBatchImport,
      } = item;

      const medicine = await Medicine.findOne({ _id: medicineId, organization: orgId });
      if (!medicine) throw new AppError(`Medicine not found: ${medicineId}`, 404);

      const expDate = new Date(expiryDate);
      const mfgDate = new Date(manufactureDate);
      if (expDate <= mfgDate) {
        throw new AppError('Expiry date must be after manufacture date', 400);
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const isPrivileged = userRole === 'Owner' || userRole === 'Admin';
      const canImportExpired = Boolean(allowExpiredBatchImport) && isPrivileged;

      if (expDate < today) {
        if (!canImportExpired) {
          throw new AppError(
            'Cannot add expired batch. Use expired import (Owner/Admin only) for historical records.',
            400
          );
        }
      }
      if (!quantity || quantity < 1) {
        throw new AppError('Quantity must be at least 1', 400);
      }

      let batchQuery = Batch.findOne({
        organization: orgId,
        batchNo,
        medicine: medicineId,
      });
      if (session) batchQuery = batchQuery.session(session);
      let batch = await batchQuery;

      const prevQty = batch ? batch.quantity : 0;
      const newQty = prevQty + quantity;

      if (batch) {
        batch.quantity = newQty;
        batch.manufactureDate = manufactureDate;
        batch.expiryDate = expiryDate;
        await batch.save(session ? { session } : {});
      } else {
        const batchData = {
          batchNo,
          medicine: medicineId,
          quantity: newQty,
          manufactureDate,
          expiryDate,
          organization: orgId,
        };
        batch = (await Batch.create([batchData], session ? { session } : {}))[0];
      }

      const cost = quantity * unitCost;
      totalCost += cost;
      purchaseItems.push({
        medicine: medicineId,
        batch: batch._id,
        quantity,
        unitCost,
      });
      batchUpdates.push({ medicineId, batchId: batch._id, quantity, prevQty, newQty });
    }

    const purchase = (
      await Purchase.create(
        [
          {
            items: purchaseItems,
            totalCost,
            organization: orgId,
            supplierName: supplierName ?? '',
          },
        ],
        session ? { session } : {}
      )
    )[0];

    for (const { medicineId, batchId, quantity, prevQty, newQty } of batchUpdates) {
      await createLogForPurchase(
        {
          medicineId,
          batchId,
          quantityChange: quantity,
          previousQty: prevQty,
          newQty,
          purchaseId: purchase._id,
          orgId,
          userId,
        },
        session
      );
    }

    const populated = await Purchase.findById(purchase._id)
      .populate('items.medicine', 'name')
      .populate('items.batch', 'batchNo expiryDate manufactureDate')
      .lean();

    const invoice = await createPurchaseInvoice(
      { ...populated, supplierName: supplierName ?? '' },
      orgId,
      session
    );

    return {
      purchase: populated,
      invoice: invoice.toObject ? invoice.toObject() : invoice,
    };
  });
};
