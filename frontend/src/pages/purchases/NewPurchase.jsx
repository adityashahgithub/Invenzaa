import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { purchasesApi } from '../../api/purchasesApi';
import { medicineApi } from '../../api/medicineApi';
import styles from './NewPurchase.module.css';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

const toInputDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toISOString().slice(0, 10);
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

  const addLine = () => {
    const today = new Date();
    const expiry = new Date(today);
    expiry.setMonth(expiry.getMonth() + 6);
    setItems((prev) => [
      ...prev,
      {
        medicineId: '',
        batchNo: '',
        quantity: 1,
        unitCost: 0,
        manufactureDate: toInputDate(today),
        expiryDate: toInputDate(expiry),
      },
    ]);
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
    setItems([]);
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
        <div className={styles.successCard}>
          <h2>Purchase recorded successfully</h2>
          <p>Invoice #{invoice?.invoiceNumber}</p>
          <div className={styles.invoicePreview}>
            <div className={styles.invoiceHeader}>
              <h3>Purchase Invoice {invoice?.invoiceNumber}</h3>
              <span>{formatDate(invoice?.invoiceDate)}</span>
            </div>
            {invoice?.supplierName && (
              <p className={styles.supplier}>Supplier: {invoice.supplierName}</p>
            )}
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
            <div className={styles.invoiceTotal}>
              <strong>Total: ₹{invoice?.totalCost ?? purchase?.totalCost}</strong>
            </div>
          </div>
          <div className={styles.successActions}>
            <button onClick={handleNewPurchase} className={styles.btnSecondary}>
              New Purchase
            </button>
            <button onClick={() => handleViewPurchase(purchase._id)} className={styles.btnPrimary}>
              View Purchase
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1>New Purchase</h1>
      <p className={styles.subtitle}>
        Stock increases automatically. Purchase invoice is generated.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>Supplier name (optional)</label>
          <input
            type="text"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            placeholder="Supplier / vendor name"
          />
        </div>

        <div className={styles.lineItems}>
          <div className={styles.lineHeader}>
            <span>Items</span>
            <button type="button" onClick={addLine} className={styles.addBtn}>
              + Add item
            </button>
          </div>

          {items.map((item, idx) => (
            <div key={idx} className={styles.lineRow}>
              <select
                value={item.medicineId}
                onChange={(e) => setField(idx, 'medicineId', e.target.value)}
                required
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
                placeholder="Batch no"
                required
              />
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => setField(idx, 'quantity', e.target.value)}
                placeholder="Qty"
              />
              <input
                type="number"
                min={0}
                step={0.01}
                value={item.unitCost || ''}
                onChange={(e) => setField(idx, 'unitCost', e.target.value)}
                placeholder="Unit cost"
              />
              <input
                type="date"
                value={item.manufactureDate || ''}
                onChange={(e) => setField(idx, 'manufactureDate', e.target.value)}
                required
              />
              <input
                type="date"
                value={item.expiryDate || ''}
                onChange={(e) => setField(idx, 'expiryDate', e.target.value)}
                required
              />
              <span className={styles.lineTotal}>
                ₹{((item.quantity || 0) * (item.unitCost || 0)).toFixed(2)}
              </span>
              <button type="button" onClick={() => removeLine(idx)} className={styles.removeBtn}>
                ×
              </button>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className={styles.totalRow}>
            <strong>Total: ₹{totalCost.toFixed(2)}</strong>
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <button type="button" onClick={() => navigate('/purchases')} className={styles.btnSecondary}>
            Cancel
          </button>
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? 'Processing...' : 'Complete Purchase'}
          </button>
        </div>
      </form>
    </div>
  );
};
