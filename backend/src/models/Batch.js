import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema(
  {
    batchNo: {
      type: String,
      required: true,
      trim: true,
    },
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    manufactureDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
  },
  { timestamps: true }
);

batchSchema.index({ organization: 1 });
batchSchema.index({ medicine: 1 });
batchSchema.index({ organization: 1, expiryDate: 1 });
batchSchema.index({ organization: 1, medicine: 1, batchNo: 1 }, { unique: true });

batchSchema.pre('save', function (next) {
  if (this.expiryDate <= this.manufactureDate) {
    next(new Error('Expiry date must be after manufacture date'));
  } else {
    next();
  }
});

export const Batch = mongoose.model('Batch', batchSchema);
