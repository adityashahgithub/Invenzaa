import mongoose from 'mongoose';

const collaborationRequestSchema = new mongoose.Schema(
  {
    fromOrganization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    toOrganization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    message: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

collaborationRequestSchema.index({ fromOrganization: 1 });
collaborationRequestSchema.index({ toOrganization: 1 });
collaborationRequestSchema.index({ toOrganization: 1, status: 1 });
collaborationRequestSchema.index({ fromOrganization: 1, status: 1 });

export const CollaborationRequest = mongoose.model(
  'CollaborationRequest',
  collaborationRequestSchema
);
