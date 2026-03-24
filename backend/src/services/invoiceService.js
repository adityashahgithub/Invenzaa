import { Invoice } from '../models/Invoice.js';

export const getNextInvoiceNumber = async (orgId, session) => {
  let query = Invoice.findOne({ organization: orgId })
    .sort({ invoiceNumber: -1 })
    .select('invoiceNumber');
  if (session) query = query.session(session);
  const last = await query.lean();

  const prefix = 'INV';
  const year = new Date().getFullYear();
  // `invoiceNumber` is globally `unique`, so include `orgId` to avoid collisions across orgs.
  const base = `${prefix}-${year}-${orgId}-`;

  if (!last?.invoiceNumber?.startsWith(base)) {
    return `${base}0001`;
  }

  const num = parseInt(last.invoiceNumber.replace(base, ''), 10) || 0;
  return `${base}${String(num + 1).padStart(4, '0')}`;
};

export const createInvoiceFromSale = async (sale, orgId, session) => {
  const invoiceNumber = await getNextInvoiceNumber(orgId, session);

  const items = sale.items.map((item) => ({
    medicine: item.medicine?._id ?? item.medicine,
    medicineName: item.medicine?.name ?? 'Unknown',
    batchNo: item.batch?.batchNo ?? 'N/A',
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: item.total,
  }));

  const opts = session ? { session } : {};
  const created = await Invoice.create(
    [
      {
        invoiceNumber,
        sale: sale._id,
        organization: orgId,
        customerName: sale.customerName ?? '',
        items,
        totalAmount: sale.totalAmount,
        invoiceDate: sale.saleDate ?? new Date(),
      },
    ],
    opts
  );

  return created[0] || created;
};
