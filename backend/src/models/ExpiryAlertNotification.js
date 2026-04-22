import mongoose from 'mongoose';

const expiryAlertNotificationSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    alertDate: {
      type: String,
      required: true,
    },
    recipientEmails: {
      type: [String],
      default: [],
    },
    batchCount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

expiryAlertNotificationSchema.index({ organization: 1, alertDate: 1 }, { unique: true });

export const ExpiryAlertNotification = mongoose.model(
  'ExpiryAlertNotification',
  expiryAlertNotificationSchema
);
