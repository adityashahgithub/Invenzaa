import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      default: '',
    },
    licenseNumber: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

organizationSchema.index({ name: 1 });

export const Organization = mongoose.model('Organization', organizationSchema);
