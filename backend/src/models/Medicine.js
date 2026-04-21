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
    categoryRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
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
    brand: {
      type: String,
      default: '',
      trim: true,
    },
    brandRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
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
medicineSchema.index({ organization: 1, categoryRef: 1 });
medicineSchema.index({ organization: 1, brand: 1 });
medicineSchema.index({ organization: 1, brandRef: 1 });

export const Medicine = mongoose.model('Medicine', medicineSchema);
