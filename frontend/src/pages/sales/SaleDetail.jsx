import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileDown, User } from 'lucide-react';
import { salesApi } from '../../api/salesApi';
import { downloadInvoicePdf } from '../../utils/invoiceDownload';
import styles from './SaleDetail.module.css';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    Number(n || 0)
  );

export const SaleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
    const invItems = invoice?.items || [];
    if (invItems.length) return invItems;
    return sale?.items || [];
  }, [invoice, sale]);

  const goToList = () => navigate('/sales');

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.stateCard}>
          <p className={styles.stateText}>Loading sale…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <button type="button" className={styles.backNav} onClick={goToList}>
          <ArrowLeft size={18} strokeWidth={2} aria-hidden />
          Back to sales
        </button>
        <div className={styles.stateCard}>
          <p className={styles.errorText}>{error}</p>
          <button type="button" className={styles.btnPrimary} onClick={goToList}>
            Return to sales list
          </button>
        </div>
      </div>
    );
  }

  const invNo = invoice?.invoiceNumber || '—';
  const invDate = formatDate(invoice?.invoiceDate || sale?.saleDate);
  const customer = invoice?.customerName;
  const grandTotal = invoice?.totalAmount ?? sale?.totalAmount ?? 0;

  return (
    <div className={styles.page}>
      <button type="button" className={styles.backNav} onClick={goToList}>
        <ArrowLeft size={18} strokeWidth={2} aria-hidden />
        Back to sales
      </button>

      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Sale details</h1>
          <p className={styles.subtitle}>Invoice and line items for this sale</p>
        </div>
        <button
          type="button"
          className={styles.btnDownload}
          onClick={() => downloadInvoicePdf({ invoice, fallbackDoc: sale, type: 'sale' })}
        >
          <FileDown size={18} strokeWidth={2} aria-hidden />
          Download PDF
        </button>
      </header>

      <article className={styles.shell}>
        <div className={styles.shellHeader}>
          <div>
            <span className={styles.invoiceLabel}>Invoice</span>
            <h2 className={styles.invoiceNumber}>#{invNo}</h2>
          </div>
          <div className={styles.metaPills}>
            <span className={styles.pill}>{invDate}</span>
          </div>
        </div>

        {customer && (
          <div className={styles.customerRow}>
            <User size={16} strokeWidth={2} className={styles.customerIcon} aria-hidden />
            <span className={styles.customerLabel}>Customer</span>
            <span className={styles.customerName}>{customer}</span>
          </div>
        )}

        {items?.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Batch</th>
                  <th className={styles.thNum}>Qty</th>
                  <th className={styles.thNum}>Price</th>
                  <th className={styles.thNum}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className={styles.tdStrong}>{item.medicineName || item.medicine?.name || 'Unknown'}</td>
                    <td className={styles.tdMono}>{item.batchNo || item.batch?.batchNo || '—'}</td>
                    <td className={styles.tdNum}>{item.quantity}</td>
                    <td className={styles.tdNum}>{formatCurrency(item.unitPrice)}</td>
                    <td className={styles.tdNum}>{formatCurrency(item.total ?? item.quantity * (item.unitPrice || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.emptyItems}>No line items on this sale.</p>
        )}

        <footer className={styles.totalBar}>
          <span className={styles.totalLabel}>Total</span>
          <strong className={styles.totalValue}>{formatCurrency(grandTotal)}</strong>
        </footer>
      </article>
    </div>
  );
};
