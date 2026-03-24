import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema(
  {
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
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    items: [saleItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    saleDate: {
      type: Date,
      default: Date.now,
    },
    customerName: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

saleSchema.index({ organization: 1 });
saleSchema.index({ organization: 1, saleDate: -1 });

export const Sale = mongoose.model('Sale', saleSchema);
