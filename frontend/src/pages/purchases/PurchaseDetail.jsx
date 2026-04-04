import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileDown, Truck } from 'lucide-react';
import { purchasesApi } from '../../api/purchasesApi';
import { downloadInvoicePdf } from '../../utils/invoiceDownload';
import styles from './PurchaseDetail.module.css';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    Number(n || 0)
  );

export const PurchaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  const goToList = () => navigate('/purchases');

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.stateCard}>
          <p className={styles.stateText}>Loading purchase…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <button type="button" className={styles.backNav} onClick={goToList}>
          <ArrowLeft size={18} strokeWidth={2} aria-hidden />
          Back to purchases
        </button>
        <div className={styles.stateCard}>
          <p className={styles.errorText}>{error}</p>
          <button type="button" className={styles.btnPrimary} onClick={goToList}>
            Return to purchase list
          </button>
        </div>
      </div>
    );
  }

  const invNo = invoice?.invoiceNumber || '—';
  const invDate = formatDate(invoice?.invoiceDate || purchase?.purchaseDate);
  const supplier = invoice?.supplierName;
  const grandTotal = invoice?.totalCost ?? purchase?.totalCost ?? 0;

  return (
    <div className={styles.page}>
      <button type="button" className={styles.backNav} onClick={goToList}>
        <ArrowLeft size={18} strokeWidth={2} aria-hidden />
        Back to purchases
      </button>

      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Purchase details</h1>
          <p className={styles.subtitle}>Invoice and line items for this receiving record</p>
        </div>
        <button
          type="button"
          className={styles.btnDownload}
          onClick={() => downloadInvoicePdf({ invoice, fallbackDoc: purchase, type: 'purchase' })}
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

        {supplier && (
          <div className={styles.supplierRow}>
            <Truck size={16} strokeWidth={2} className={styles.supplierIcon} aria-hidden />
            <span className={styles.supplierLabel}>Supplier</span>
            <span className={styles.supplierName}>{supplier}</span>
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
                  <th className={styles.thNum}>Cost</th>
                  <th className={styles.thNum}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className={styles.tdStrong}>{item.medicineName || item.medicine?.name || 'Unknown'}</td>
                    <td className={styles.tdMono}>{item.batchNo || item.batch?.batchNo || '—'}</td>
                    <td className={styles.tdNum}>{item.quantity}</td>
                    <td className={styles.tdNum}>{formatCurrency(item.unitCost)}</td>
                    <td className={styles.tdNum}>{formatCurrency(item.total ?? item.quantity * (item.unitCost || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.emptyItems}>No line items on this purchase.</p>
        )}

        <footer className={styles.totalBar}>
          <span className={styles.totalLabel}>Total</span>
          <strong className={styles.totalValue}>{formatCurrency(grandTotal)}</strong>
        </footer>
      </article>
    </div>
  );
};
