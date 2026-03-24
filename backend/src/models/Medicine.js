import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    genericName: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      default: '',
      trim: true,
    },
    unit: {
      type: String,
      default: 'pcs',
      trim: true,
    },
    minStockLevel: {
      type: Number,
      default: 10,
      min: 0,
    },
    manufacturer: {
      type: String,
      default: '',
      trim: true,
    },
    prescriptionRequired: {
      type: Boolean,
      default: false,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
  },
  { timestamps: true }
);

medicineSchema.index({ organization: 1 });
medicineSchema.index({ organization: 1, name: 1 });
medicineSchema.index({ organization: 1, category: 1 });

export const Medicine = mongoose.model('Medicine', medicineSchema);
