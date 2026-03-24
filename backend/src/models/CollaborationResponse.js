import mongoose from 'mongoose';

const collaborationResponseSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CollaborationRequest',
      required: true,
    },
    status: {
      type: String,
      enum: ['accepted', 'declined'],
      required: true,
    },
    message: {
      type: String,
      default: '',
    },
    quantityOffered: {
      type: Number,
      min: 0,
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

collaborationResponseSchema.index({ request: 1 }, { unique: true });

export const CollaborationResponse = mongoose.model(
  'CollaborationResponse',
  collaborationResponseSchema
);
