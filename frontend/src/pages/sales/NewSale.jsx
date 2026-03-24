import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesApi } from '../../api/salesApi';
import { medicineApi } from '../../api/medicineApi';
import { batchApi } from '../../api/batchApi';
import styles from './NewSale.module.css';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

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

  const addLine = () => {
    setItems((prev) => [
      ...prev,
      { medicineId: '', batchId: '', quantity: 1, unitPrice: 0, batches: [], medicine: null },
    ]);
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
    setItems([]);
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
        <div className={styles.successCard}>
          <h2>Sale recorded successfully</h2>
          <p>Invoice #{invoice?.invoiceNumber}</p>
          <div className={styles.invoicePreview}>
            <div className={styles.invoiceHeader}>
              <h3>Invoice {invoice?.invoiceNumber}</h3>
              <span>{formatDate(invoice?.invoiceDate)}</span>
            </div>
            {invoice?.customerName && (
              <p className={styles.customer}>Customer: {invoice.customerName}</p>
            )}
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
                    <td>₹{item.total ?? item.quantity * item.unitPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.invoiceTotal}>
              <strong>Total: ₹{invoice?.totalAmount ?? sale?.totalAmount}</strong>
            </div>
          </div>
          <div className={styles.successActions}>
            <button onClick={handleNewSale} className={styles.btnSecondary}>
              New Sale
            </button>
            <button onClick={() => handleViewSale(sale._id)} className={styles.btnPrimary}>
              View Sale
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1>New Sale</h1>
      <p className={styles.subtitle}>
        Stock is auto-updated. Invoice is generated automatically.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>Customer name (optional)</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Customer name"
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
                onChange={(e) => setMedicine(idx, e.target.value)}
                required
              >
                <option value="">Select medicine</option>
                {medicines.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} (Stock: {m.currentStock ?? 0})
                  </option>
                ))}
              </select>
              <select
                value={item.batchId}
                onChange={(e) => setBatch(idx, e.target.value)}
                required
                disabled={!item.medicineId}
              >
                <option value="">Select batch</option>
                {item.batches?.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.batchNo} · {b.quantity} pcs · Exp: {formatDate(b.expiryDate)}
                  </option>
                ))}
              </select>
              <div className={styles.qtyCell}>
                <input
                  type="number"
                  min={1}
                  max={getMaxQty(idx)}
                  value={item.quantity}
                  onChange={(e) => setField(idx, 'quantity', e.target.value)}
                  placeholder="Qty"
                />
                {(item.quantity || 0) > getMaxQty(idx) && getMaxQty(idx) > 0 && (
                  <span className={styles.insufficientHint}>
                    Max {getMaxQty(idx)}.{' '}
                    <button
                      type="button"
                      className={styles.linkBtn}
                      onClick={() =>
                        navigate('/collaboration/request', {
                          state: { medicineId: item.medicineId, quantity: item.quantity },
                        })
                      }
                    >
                      Request from partner
                    </button>
                  </span>
                )}
              </div>
              <input
                type="number"
                min={0}
                step={0.01}
                value={item.unitPrice || ''}
                onChange={(e) => setField(idx, 'unitPrice', e.target.value)}
                placeholder="Price"
              />
              <span className={styles.lineTotal}>
                ₹{((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
              </span>
              <button type="button" onClick={() => removeLine(idx)} className={styles.removeBtn}>
                ×
              </button>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className={styles.totalRow}>
            <strong>Total: ₹{totalAmount.toFixed(2)}</strong>
          </div>
        )}

        {error && (
          <div className={styles.errorBlock}>
            <div className={styles.error}>{error}</div>
            {showCollaborationHint && (
              <p className={styles.collaborationHint}>
                Stock insufficient?{' '}
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() =>
                    navigate('/collaboration/request', {
                      state: {
                        medicineId: collaborationMedicineId,
                        quantity: collaborationQuantity,
                      },
                    })
                  }
                >
                  Request from partner
                </button>
              </p>
            )}
          </div>
        )}

        <div className={styles.actions}>
          <button type="button" onClick={() => navigate('/sales')} className={styles.btnSecondary}>
            Cancel
          </button>
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </form>
    </div>
  );
};
