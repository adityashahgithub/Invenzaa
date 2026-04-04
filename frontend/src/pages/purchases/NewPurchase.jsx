import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackagePlus, Truck, ClipboardList, Trash2, CheckCircle2 } from 'lucide-react';
import { purchasesApi } from '../../api/purchasesApi';
import { medicineApi } from '../../api/medicineApi';
import { downloadInvoicePdf } from '../../utils/invoiceDownload';
import styles from './NewPurchase.module.css';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

const toInputDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toISOString().slice(0, 10);
};

const createEmptyLine = () => {
  const today = new Date();
  const expiry = new Date(today);
  expiry.setMonth(expiry.getMonth() + 6);
  return {
    medicineId: '',
    batchNo: '',
    quantity: 1,
    unitCost: 0,
    manufactureDate: toInputDate(today),
    expiryDate: toInputDate(expiry),
    allowExpiredBatchImport: false,
  };
};

export const NewPurchase = () => {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [items, setItems] = useState([]);
  const [supplierName, setSupplierName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    medicineApi
      .list({ limit: 500 })
      .then(({ data }) => setMedicines(data?.data?.medicines ?? []))
      .catch(() => setMedicines([]));
  }, []);

  /** One empty row once catalog is loaded so the medicine dropdown is visible (catalog ≠ line items). */
  useEffect(() => {
    if (medicines.length === 0) return;
    setItems((prev) => (prev.length === 0 ? [createEmptyLine()] : prev));
  }, [medicines.length]);

  const addLine = () => {
    setItems((prev) => [...prev, createEmptyLine()]);
  };

  const removeLine = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const setField = (idx, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const totalCost = items.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitCost) || 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);

    const payload = items
      .filter(
        (i) =>
          i.medicineId &&
          i.batchNo &&
          i.quantity > 0 &&
          i.manufactureDate &&
          i.expiryDate
      )
      .map((i) => ({
        medicineId: i.medicineId,
        batchNo: i.batchNo.trim(),
        quantity: Number(i.quantity),
        unitCost: Number(i.unitCost),
        manufactureDate: i.manufactureDate,
        expiryDate: i.expiryDate,
        allowExpiredBatchImport: Boolean(i.allowExpiredBatchImport),
      }));

    if (payload.length === 0) {
      setError('Add at least one item with batch, quantity, cost, and dates');
      return;
    }

    setLoading(true);
    try {
      const { data } = await purchasesApi.create({
        items: payload,
        supplierName: supplierName.trim() || undefined,
      });
      setSuccess(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const handleNewPurchase = () => {
    setItems(medicines.length > 0 ? [createEmptyLine()] : []);
    setSupplierName('');
    setSuccess(null);
    setError('');
  };

  const handleViewPurchase = (id) => {
    navigate(`/purchases/${id}`);
  };

  if (success) {
    const { purchase, invoice } = success.data;
    return (
      <div className={styles.page}>
        <div className={styles.successShell}>
          <div className={styles.successHero}>
            <span className={styles.successIconWrap} aria-hidden>
              <CheckCircle2 size={40} strokeWidth={1.75} />
            </span>
            <h1 className={styles.successTitle}>Purchase recorded</h1>
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
              <h2 className={styles.invoiceHeading}>Purchase invoice</h2>
              <span className={styles.invoiceBadge}>{invoice?.invoiceNumber}</span>
            </div>
            {invoice?.supplierName && (
              <p className={styles.supplier}>
                <Truck size={14} className={styles.supplierIcon} aria-hidden />
                {invoice.supplierName}
              </p>
            )}
            <div className={styles.invoiceTableWrap}>
              <table className={styles.invoiceTable}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Batch</th>
                    <th>Qty</th>
                    <th>Cost</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice?.items ?? purchase?.items ?? []).map((item, i) => (
                    <tr key={i}>
                      <td>{item.medicineName ?? item.medicine?.name}</td>
                      <td>{item.batchNo ?? item.batch?.batchNo}</td>
                      <td>{item.quantity}</td>
                      <td>₹{item.unitCost ?? item.unitCost}</td>
                      <td>₹{(item.total ?? item.quantity * (item.unitCost ?? 0)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.invoiceTotal}>
              <span>Grand total</span>
              <strong>₹{Number(invoice?.totalCost ?? purchase?.totalCost ?? 0).toFixed(2)}</strong>
            </div>
          </div>

          <div className={styles.successActions}>
            <button type="button" onClick={handleNewPurchase} className={styles.btnGhost}>
              New purchase
            </button>
            <button
              type="button"
              onClick={() =>
                downloadInvoicePdf({ invoice, fallbackDoc: purchase, type: 'purchase' })
              }
              className={styles.btnOutline}
            >
              Download PDF
            </button>
            <button type="button" onClick={() => handleViewPurchase(purchase._id)} className={styles.btnPrimary}>
              View purchase
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>New purchase</h1>
        <p className={styles.subtitle}>
          Receiving stock creates batches and a purchase invoice. Each <strong>line item</strong> is one medicine
          you are receiving (batch, qty, cost)—your catalog appears in the dropdown, not as a fixed list here.
          Past-expiry lines need <strong>Import expired</strong> (Owner/Admin) for historical records only.
        </p>
      </header>

      <form onSubmit={handleSubmit} className={styles.shell} noValidate>
        <section className={styles.section} aria-labelledby="supplier-heading">
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon} aria-hidden>
              <Truck size={18} strokeWidth={2} />
            </span>
            <div>
              <h2 id="supplier-heading" className={styles.sectionTitle}>
                Supplier
              </h2>
              <p className={styles.sectionHint}>Optional — appears on the generated invoice</p>
            </div>
          </div>
          <div className={styles.supplierField}>
            <label htmlFor="supplier-name" className={styles.visuallyHidden}>
              Supplier name
            </label>
            <input
              id="supplier-name"
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="Vendor or distributor name"
              className={styles.inputLg}
              autoComplete="organization"
            />
          </div>
        </section>

        <section className={`${styles.section} ${styles.itemsSection}`} aria-labelledby="items-heading">
          <div className={styles.itemsToolbar}>
            <div className={styles.itemsTitleBlock}>
              <span className={styles.sectionIcon} aria-hidden>
                <ClipboardList size={18} strokeWidth={2} />
              </span>
              <div>
                <h2 id="items-heading" className={styles.sectionTitle}>
                  Line items
                </h2>
                <p className={styles.sectionHint}>
                  {medicines.length === 0
                    ? 'Add products under Medicines first — then you can select them on each line.'
                    : items.length === 0
                      ? 'Add a line, then pick a catalog medicine, batch number, and cost for each row.'
                      : `${items.length} receiving line${items.length === 1 ? '' : 's'} · ${medicines.length} catalog medicine${medicines.length === 1 ? '' : 's'} in the dropdown`}
                </p>
              </div>
            </div>
            <button type="button" onClick={addLine} className={styles.btnAddLine}>
              <PackagePlus size={18} strokeWidth={2} aria-hidden />
              Add line item
            </button>
          </div>

          {items.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIllustration} aria-hidden>
                <PackagePlus size={36} strokeWidth={1.25} />
              </div>
              <h3 className={styles.emptyTitle}>
                {medicines.length === 0 ? 'No medicines in catalog' : 'Add a receiving line'}
              </h3>
              <p className={styles.emptyCopy}>
                {medicines.length === 0
                  ? 'Create medicines under the Medicines page first. This form does not show your catalog as rows until you add a line and choose an item from the list.'
                  : `You have ${medicines.length} medicine${medicines.length === 1 ? '' : 's'} in the catalog. They appear inside the “Medicine” dropdown on each row—not as a separate list. Click below to add a row.`}
              </p>
              <button type="button" onClick={addLine} className={styles.btnAddLineLarge}>
                <PackagePlus size={20} strokeWidth={2} aria-hidden />
                {medicines.length === 0 ? 'Add line (add catalog medicines first)' : 'Add your first line'}
              </button>
            </div>
          ) : (
            <div className={styles.linesWrap}>
              <div className={styles.linesScroll}>
                <div className={styles.gridHead} role="row">
                  <span className={styles.gridHeadSpacer} aria-hidden />
                  <span>Medicine</span>
                  <span>Batch</span>
                  <span>Qty</span>
                  <span>Unit ₹</span>
                  <span>Mfg</span>
                  <span>Expiry</span>
                  <span>Import</span>
                  <span>Line ₹</span>
                  <span className={styles.gridHeadSpacer} aria-hidden />
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className={styles.lineRow}>
                    <div className={styles.lineIndex} aria-hidden>
                      {idx + 1}
                    </div>
                    <select
                      value={item.medicineId}
                      onChange={(e) => setField(idx, 'medicineId', e.target.value)}
                      required
                      aria-label={`Line ${idx + 1} medicine`}
                    >
                      <option value="">Select medicine</option>
                      {medicines.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={item.batchNo}
                      onChange={(e) => setField(idx, 'batchNo', e.target.value)}
                      placeholder="No."
                      required
                      aria-label={`Line ${idx + 1} batch`}
                    />
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => setField(idx, 'quantity', e.target.value)}
                      aria-label={`Line ${idx + 1} quantity`}
                    />
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.unitCost || ''}
                      onChange={(e) => setField(idx, 'unitCost', e.target.value)}
                      aria-label={`Line ${idx + 1} unit cost`}
                    />
                    <input
                      type="date"
                      value={item.manufactureDate || ''}
                      onChange={(e) => setField(idx, 'manufactureDate', e.target.value)}
                      required
                      aria-label={`Line ${idx + 1} manufacture date`}
                    />
                    <input
                      type="date"
                      value={item.expiryDate || ''}
                      onChange={(e) => setField(idx, 'expiryDate', e.target.value)}
                      required
                      aria-label={`Line ${idx + 1} expiry`}
                    />
                    <label className={styles.expiredImportToggle}>
                      <input
                        type="checkbox"
                        checked={Boolean(item.allowExpiredBatchImport)}
                        onChange={(e) =>
                          setField(idx, 'allowExpiredBatchImport', e.target.checked)
                        }
                        aria-label={`Line ${idx + 1} import expired batch`}
                      />
                      <span>Expired</span>
                    </label>
                    <span className={styles.lineTotal}>
                      ₹{((item.quantity || 0) * (item.unitCost || 0)).toFixed(2)}
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
                ))}
              </div>
            </div>
          )}
        </section>

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <footer className={styles.footerBar}>
          <div className={styles.footerLeft}>
            {items.length > 0 ? (
              <div className={styles.totalPill}>
                <span className={styles.totalLabel}>Estimated total</span>
                <span className={styles.totalValue}>₹{totalCost.toFixed(2)}</span>
              </div>
            ) : (
              <span className={styles.footerPlaceholder}>Add lines to see total</span>
            )}
          </div>
          <div className={styles.footerActions}>
            <button type="button" onClick={() => navigate('/purchases')} className={styles.btnGhost}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Recording…' : 'Complete purchase'}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
};
