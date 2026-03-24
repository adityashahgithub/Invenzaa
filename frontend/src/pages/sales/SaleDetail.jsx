import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { salesApi } from '../../api/salesApi';
import styles from './SaleDetail.module.css';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0));

export const SaleDetail = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sale, setSale] = useState(null);
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await salesApi.getById(id);
        setSale(data.data.sale);
        setInvoice(data.data.invoice);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load sale');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  const items = useMemo(() => {
    // Invoice is preferred because it has explicit unitPrice + total per line item.
    const invItems = invoice?.items || [];
    if (invItems.length) return invItems;
    return sale?.items || [];
  }, [invoice, sale]);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Sale Details</h1>
        <Link to="/sales" className={styles.backLink}>
          Back to Sales
        </Link>
      </div>

      <div className={styles.card}>
        <h2>Invoice #{invoice?.invoiceNumber || '—'}</h2>
        <p className={styles.date}>Date: {formatDate(invoice?.invoiceDate || sale?.saleDate)}</p>
        {invoice?.customerName && <p className={styles.customer}>Customer: {invoice.customerName}</p>}
        {items?.length > 0 ? (
          <table className={styles.table}>
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
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.medicineName || item.medicine?.name || 'Unknown'}</td>
                  <td>{item.batchNo || item.batch?.batchNo || '—'}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unitPrice ?? item.unitPrice)}</td>
                  <td>{formatCurrency(item.total ?? (item.quantity * (item.unitPrice || 0)))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No items found.</p>
        )}
        <div className={styles.total}>
          <strong>Total: {formatCurrency(invoice?.totalAmount ?? sale?.totalAmount)}</strong>
        </div>
      </div>
    </div>
  );
};

