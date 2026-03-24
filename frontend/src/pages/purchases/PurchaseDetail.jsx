import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { purchasesApi } from '../../api/purchasesApi';
import styles from './PurchaseDetail.module.css';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0));

export const PurchaseDetail = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchase, setPurchase] = useState(null);
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await purchasesApi.getById(id);
        setPurchase(data.data.purchase);
        setInvoice(data.data.invoice);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load purchase');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  const items = useMemo(() => {
    const invItems = invoice?.items || [];
    if (invItems.length) return invItems;
    return purchase?.items || [];
  }, [invoice, purchase]);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Purchase Details</h1>
        <Link to="/purchases" className={styles.backLink}>
          Back to Purchases
        </Link>
      </div>

      <div className={styles.card}>
        <h2>Invoice #{invoice?.invoiceNumber || '—'}</h2>
        <p className={styles.date}>Date: {formatDate(invoice?.invoiceDate || purchase?.purchaseDate)}</p>
        {invoice?.supplierName && <p className={styles.supplier}>Supplier: {invoice.supplierName}</p>}
        {items?.length > 0 ? (
          <table className={styles.table}>
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
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.medicineName || item.medicine?.name || 'Unknown'}</td>
                  <td>{item.batchNo || item.batch?.batchNo || '—'}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unitCost ?? item.unitCost)}</td>
                  <td>{formatCurrency(item.total ?? (item.quantity * (item.unitCost || 0)))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No items found.</p>
        )}
        <div className={styles.total}>
          <strong>Total: {formatCurrency(invoice?.totalCost ?? purchase?.totalCost)}</strong>
        </div>
      </div>
    </div>
  );
};

