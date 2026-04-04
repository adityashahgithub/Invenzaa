import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  ClipboardList,
  PackagePlus,
  Trash2,
  CheckCircle2,
  ShoppingCart,
  Handshake,
  AlertTriangle,
} from 'lucide-react';
import { salesApi } from '../../api/salesApi';
import { medicineApi } from '../../api/medicineApi';
import { batchApi } from '../../api/batchApi';
import { downloadInvoicePdf } from '../../utils/invoiceDownload';
import styles from './NewSale.module.css';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

const createEmptySaleLine = () => ({
  medicineId: '',
  batchId: '',
  quantity: 1,
  unitPrice: 0,
  batches: [],
  medicine: null,
});

export const NewSale = () => {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [items, setItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [showCollaborationHint, setShowCollaborationHint] = useState(false);
  const [collaborationMedicineId, setCollaborationMedicineId] = useState(null);
  const [collaborationQuantity, setCollaborationQuantity] = useState(null);

  useEffect(() => {
    medicineApi
      .list({ limit: 500 })
      .then(({ data }) => setMedicines(data?.data?.medicines ?? []))
      .catch(() => setMedicines([]));
  }, []);

  useEffect(() => {
    if (medicines.length === 0) return;
    setItems((prev) => (prev.length === 0 ? [createEmptySaleLine()] : prev));
  }, [medicines.length]);

  const addLine = () => {
    setItems((prev) => [...prev, createEmptySaleLine()]);
  };

  const removeLine = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const setMedicine = async (idx, medicineId) => {
    const medicine = medicines.find((m) => m._id === medicineId);
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], medicineId, medicine, batchId: '', batches: [], quantity: 1 };
      return next;
    });
    if (medicineId) {
      try {
        const batches = await batchApi.getByMedicine(medicineId);
        setItems((prev) => {
          const next = [...prev];
          next[idx] = { ...next[idx], batches };
          return next;
        });
      } catch {
        setItems((prev) => {
          const next = [...prev];
          next[idx] = { ...next[idx], batches: [] };
          return next;
        });
      }
    }
  };

  const setBatch = (idx, batchId) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], batchId };
      return next;
    });
  };

  const setField = (idx, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const getMaxQty = (idx) => {
    const batch = items[idx]?.batches?.find((b) => b._id === items[idx].batchId);
    return batch?.quantity ?? 0;
  };

  const totalAmount = items.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);

    const payload = items
      .filter((i) => i.medicineId && i.batchId && i.quantity > 0)
      .map((i) => ({
        medicineId: i.medicineId,
        batchId: i.batchId,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
      }));

    if (payload.length === 0) {
      setError('Add at least one item with quantity and price');
      return;
    }

    setLoading(true);
    try {
      const { data } = await salesApi.create({
        items: payload,
        customerName: customerName.trim() || undefined,
      });
      setSuccess(data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Sale failed';
      setError(msg);
      if (msg.toLowerCase().includes('insufficient')) {
        setShowCollaborationHint(true);
        setCollaborationMedicineId(payload[0]?.medicineId);
        setCollaborationQuantity(payload[0]?.quantity);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewSale = () => {
    setItems(medicines.length > 0 ? [createEmptySaleLine()] : []);
    setCustomerName('');
    setSuccess(null);
    setError('');
    setShowCollaborationHint(false);
    setCollaborationMedicineId(null);
    setCollaborationQuantity(null);
  };

  const handleViewSale = (id) => {
    navigate(`/sales/${id}`);
  };

  if (success) {
    const { sale, invoice } = success.data;
    return (
      <div className={styles.page}>
        <div className={styles.successShell}>
          <div className={styles.successHero}>
            <span className={styles.successIconWrap} aria-hidden>
              <CheckCircle2 size={40} strokeWidth={1.75} />
            </span>
            <h1 className={styles.successTitle}>Sale recorded</h1>
            <p className={styles.successMeta}>
              Invoice <strong>#{invoice?.invoiceNumber}</strong>
              {invoice?.invoiceDate && (
                <>
                  {' '}
                  · {formatDate(invoice?.invoiceDate)}
                </>
              )}
            </p>
          </div>

          <div className={styles.invoicePreview}>
            <div className={styles.invoiceHeader}>
              <h2 className={styles.invoiceHeading}>Sales invoice</h2>
              <span className={styles.invoiceBadge}>{invoice?.invoiceNumber}</span>
            </div>
            {invoice?.customerName && (
              <p className={styles.customerLine}>
                <User size={14} className={styles.customerIcon} aria-hidden />
                {invoice.customerName}
              </p>
            )}
            <div className={styles.invoiceTableWrap}>
              <table className={styles.invoiceTable}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Batch</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice?.items ?? sale?.items ?? []).map((item, i) => (
                    <tr key={i}>
                      <td>{item.medicineName ?? item.medicine?.name}</td>
                      <td>{item.batchNo ?? item.batch?.batchNo}</td>
                      <td>{item.quantity}</td>
                      <td>₹{item.unitPrice}</td>
                      <td>₹{Number(item.total ?? item.quantity * item.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.invoiceTotal}>
              <span>Grand total</span>
              <strong>₹{Number(invoice?.totalAmount ?? sale?.totalAmount ?? 0).toFixed(2)}</strong>
            </div>
          </div>

          <div className={styles.successActions}>
            <button type="button" onClick={handleNewSale} className={styles.btnGhost}>
              New sale
            </button>
            <button
              type="button"
              onClick={() => downloadInvoicePdf({ invoice, fallbackDoc: sale, type: 'sale' })}
              className={styles.btnOutline}
            >
              Download PDF
            </button>
            <button type="button" onClick={() => handleViewSale(sale._id)} className={styles.btnPrimary}>
              View sale
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>New sale</h1>
        <p className={styles.subtitle}>
          Each <strong>line</strong> is a medicine + batch + quantity sold. Stock and invoice update when you
          complete the sale. Pick a batch with available quantity; use{' '}
          <strong>Collaboration</strong> if you need stock from a partner.
        </p>
      </header>

      <form onSubmit={handleSubmit} className={styles.shell} noValidate>
        <section className={styles.section} aria-labelledby="customer-heading">
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon} aria-hidden>
              <User size={18} strokeWidth={2} />
            </span>
            <div>
              <h2 id="customer-heading" className={styles.sectionTitle}>
                Customer
              </h2>
              <p className={styles.sectionHint}>Optional — printed on the invoice</p>
            </div>
          </div>
          <div className={styles.customerField}>
            <label htmlFor="customer-name" className={styles.visuallyHidden}>
              Customer name
            </label>
            <input
              id="customer-name"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Walk-in or customer name"
              className={styles.inputLg}
              autoComplete="name"
            />
          </div>
        </section>

        <section className={`${styles.section} ${styles.itemsSection}`} aria-labelledby="sale-items-heading">
          <div className={styles.itemsToolbar}>
            <div className={styles.itemsTitleBlock}>
              <span className={styles.sectionIcon} aria-hidden>
                <ClipboardList size={18} strokeWidth={2} />
              </span>
              <div>
                <h2 id="sale-items-heading" className={styles.sectionTitle}>
                  Line items
                </h2>
                <p className={styles.sectionHint}>
                  {medicines.length === 0
                    ? 'Add medicines under Medicines first.'
                    : `${items.length} line${items.length === 1 ? '' : 's'} · choose batch per line (stock shown in dropdown)`}
                </p>
              </div>
            </div>
            <button type="button" onClick={addLine} className={styles.btnAddLine}>
              <PackagePlus size={18} strokeWidth={2} aria-hidden />
              Add line item
            </button>
          </div>

          <div className={styles.linesWrap}>
            <div className={styles.linesScroll}>
              <div className={styles.gridHead} role="row">
                <span className={styles.gridHeadSpacer} aria-hidden />
                <span>Medicine</span>
                <span>Batch</span>
                <span>Qty</span>
                <span>Unit ₹</span>
                <span>Line ₹</span>
                <span className={styles.gridHeadSpacer} aria-hidden />
              </div>
              {items.map((item, idx) => (
                <div key={idx} className={styles.lineBlock}>
                  <div className={styles.lineRow}>
                    <div className={styles.lineIndex} aria-hidden>
                      {idx + 1}
                    </div>
                    <select
                      value={item.medicineId}
                      onChange={(e) => setMedicine(idx, e.target.value)}
                      required
                      aria-label={`Line ${idx + 1} medicine`}
                    >
                      <option value="">Select medicine</option>
                      {medicines.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name} (stock {m.currentStock ?? 0})
                        </option>
                      ))}
                    </select>
                    <select
                      value={item.batchId}
                      onChange={(e) => setBatch(idx, e.target.value)}
                      required
                      disabled={!item.medicineId}
                      aria-label={`Line ${idx + 1} batch`}
                    >
                      <option value="">Select batch</option>
                      {item.batches?.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.batchNo} · {b.quantity} · exp {formatDate(b.expiryDate)}
                        </option>
                      ))}
                    </select>
                    <div className={styles.qtyCell}>
                      <input
                        type="number"
                        min={1}
                        max={getMaxQty(idx) || undefined}
                        value={item.quantity}
                        onChange={(e) => setField(idx, 'quantity', e.target.value)}
                        aria-label={`Line ${idx + 1} quantity`}
                      />
                    </div>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.unitPrice || ''}
                      onChange={(e) => setField(idx, 'unitPrice', e.target.value)}
                      aria-label={`Line ${idx + 1} unit price`}
                    />
                    <span className={styles.lineTotal}>
                      ₹{((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className={styles.removeBtn}
                      aria-label={`Remove line ${idx + 1}`}
                    >
                      <Trash2 size={16} strokeWidth={2} />
                    </button>
                  </div>
                  {(item.quantity || 0) > getMaxQty(idx) && getMaxQty(idx) > 0 && (
                    <div className={styles.partnerHintRow}>
                      <div className={styles.partnerHint}>
                        <div className={styles.partnerHintMain}>
                          <span className={styles.partnerHintIcon} aria-hidden>
                            <AlertTriangle size={18} strokeWidth={2} />
                          </span>
                          <div className={styles.partnerHintCopy}>
                            <strong>
                              Only {getMaxQty(idx)} unit{getMaxQty(idx) === 1 ? '' : 's'} in this batch
                            </strong>
                            <span>
                              You entered {item.quantity}. Open a partner request to source the rest.
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className={styles.partnerHintCta}
                          onClick={() =>
                            navigate('/collaboration/request', {
                              state: {
                                medicineId: item.medicineId,
                                quantity: Number(item.quantity) || 1,
                              },
                            })
                          }
                        >
                          <Handshake size={16} strokeWidth={2} aria-hidden />
                          Partner request
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {error && (
          <div className={styles.errorWrap} role="alert">
            <p className={styles.errorText}>{error}</p>
            {showCollaborationHint && (
              <div className={styles.partnerBanner}>
                <ShoppingCart size={18} strokeWidth={2} className={styles.partnerBannerIcon} aria-hidden />
                <div className={styles.partnerBannerCopy}>
                  <strong>Insufficient stock for this sale</strong>
                  <span>Send a request to a partner organization to cover the gap.</span>
                </div>
                <button
                  type="button"
                  className={styles.partnerBannerCta}
                  onClick={() =>
                    navigate('/collaboration/request', {
                      state: {
                        medicineId: collaborationMedicineId,
                        quantity: collaborationQuantity ?? 1,
                      },
                    })
                  }
                >
                  <Handshake size={16} strokeWidth={2} aria-hidden />
                  Partner request
                </button>
              </div>
            )}
          </div>
        )}

        <footer className={styles.footerBar}>
          <div className={styles.footerLeft}>
            {items.length > 0 ? (
              <div className={styles.totalPill}>
                <span className={styles.totalLabel}>Estimated total</span>
                <span className={styles.totalValue}>₹{totalAmount.toFixed(2)}</span>
              </div>
            ) : (
              <span className={styles.footerPlaceholder}>Add lines to see total</span>
            )}
          </div>
          <div className={styles.footerActions}>
            <button type="button" onClick={() => navigate('/sales')} className={styles.btnGhost}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Recording…' : 'Complete sale'}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
};
