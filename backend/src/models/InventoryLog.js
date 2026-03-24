import mongoose from 'mongoose';

const inventoryLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['sale', 'purchase', 'adjustment'],
    },
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
    },
    quantityChange: {
      type: Number,
      required: true,
    },
    previousQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    newQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'referenceModel',
    },
    referenceModel: {
      type: String,
      enum: ['Sale', 'Purchase'],
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

inventoryLogSchema.index({ organization: 1 });
inventoryLogSchema.index({ organization: 1, createdAt: -1 });
inventoryLogSchema.index({ medicine: 1, createdAt: -1 });

export const InventoryLog = mongoose.model('InventoryLog', inventoryLogSchema);
