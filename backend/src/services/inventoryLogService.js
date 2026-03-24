import { InventoryLog } from '../models/InventoryLog.js';

export const createLogForSale = async (
  { medicineId, batchId, quantityChange, previousQty, newQty, saleId, orgId, userId },
  session
) => {
  const doc = await InventoryLog.create(
    [
      {
        type: 'sale',
        medicine: medicineId,
        batch: batchId,
        quantityChange: -Math.abs(quantityChange),
        previousQuantity: previousQty,
        newQuantity: newQty,
        referenceId: saleId,
        referenceModel: 'Sale',
        organization: orgId,
        createdBy: userId,
      },
    ],
    session ? { session } : {}
  );
  return doc[0] || doc;
};

export const createLogForPurchase = async (
  { medicineId, batchId, quantityChange, previousQty, newQty, purchaseId, orgId, userId },
  session
) => {
  const doc = await InventoryLog.create(
    [
      {
        type: 'purchase',
        medicine: medicineId,
        batch: batchId,
        quantityChange: Math.abs(quantityChange),
        previousQuantity: previousQty,
        newQuantity: newQty,
        referenceId: purchaseId,
        referenceModel: 'Purchase',
        organization: orgId,
        createdBy: userId,
      },
    ],
    session ? { session } : {}
  );
  return doc[0] || doc;
};
