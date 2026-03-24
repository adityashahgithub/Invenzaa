import mongoose from 'mongoose';

const purchaseItemSchema = new mongoose.Schema(
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
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const purchaseSchema = new mongoose.Schema(
  {
    items: [purchaseItemSchema],
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    supplierName: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

purchaseSchema.index({ organization: 1 });
purchaseSchema.index({ organization: 1, purchaseDate: -1 });

export const Purchase = mongoose.model('Purchase', purchaseSchema);
