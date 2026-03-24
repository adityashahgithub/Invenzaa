import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

roleSchema.index({ organization: 1, name: 1 }, { unique: true });

export const Role = mongoose.model('Role', roleSchema);
