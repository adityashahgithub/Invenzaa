import mongoose from 'mongoose';

const purchaseInvoiceItemSchema = new mongoose.Schema(
  {
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    medicineName: { type: String, required: true },
    batchNo: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitCost: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const purchaseInvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    supplierName: { type: String, default: '' },
    items: [purchaseInvoiceItemSchema],
    totalCost: { type: Number, required: true, min: 0 },
    invoiceDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

purchaseInvoiceSchema.index({ organization: 1 });
purchaseInvoiceSchema.index({ organization: 1, invoiceNumber: 1 }, { unique: true });
purchaseInvoiceSchema.index({ purchase: 1 }, { unique: true });

export const PurchaseInvoice = mongoose.model('PurchaseInvoice', purchaseInvoiceSchema);
