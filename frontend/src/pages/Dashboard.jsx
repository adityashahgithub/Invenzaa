import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, AlertTriangle, CalendarClock, IndianRupee } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardApi } from '../api/dashboardApi';
import styles from './Dashboard.module.css';

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

export const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const { data: res } = await dashboardApi.getSummary();
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className={styles.loading}>
        <span>Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <span>{error}</span>
      </div>
    );
  }

  const { totalMedicines, lowStockCount, lowStockList, expiryAlertsCount, expiryAlertsList, salesSummary } = data;

  return (
    <div className="page-container">
      <header className={styles.header}>
        <h1>Dashboard</h1>
        <p>Welcome, {user?.firstName} {user?.lastName}</p>
        {user?.organization?.name && (
          <p className={styles.orgLine}>Organization: {user.organization.name}</p>
        )}
      </header>

      <section className={styles.cards}>
        <div className={styles.card}>
          <span className={styles.cardIcon}><Boxes size={22} /></span>
          <div>
            <span className={styles.cardValue}>{totalMedicines}</span>
            <span className={styles.cardLabel}>Total Medicines</span>
          </div>
        </div>
        <div className={`${styles.card} ${lowStockCount > 0 ? styles.cardWarning : ''}`}>
          <span className={styles.cardIcon}><AlertTriangle size={22} /></span>
          <div>
            <span className={styles.cardValue}>{lowStockCount}</span>
            <span className={styles.cardLabel}>Low Stock</span>
          </div>
        </div>
        <div className={`${styles.card} ${expiryAlertsCount > 0 ? styles.cardDanger : ''}`}>
          <span className={styles.cardIcon}><CalendarClock size={22} /></span>
          <div>
            <span className={styles.cardValue}>{expiryAlertsCount}</span>
            <span className={styles.cardLabel}>Expiry Alerts (30 days)</span>
          </div>
        </div>
        <div className={styles.card}>
          <span className={styles.cardIcon}><IndianRupee size={22} /></span>
          <div>
            <span className={styles.cardValue}>{formatCurrency(salesSummary?.totalAmount ?? 0)}</span>
            <span className={styles.cardLabel}>Total Sales</span>
          </div>
        </div>
      </section>

      <div className={styles.grid}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Low Stock Alerts</h2>
            <Link to="/medicines" className={styles.viewAll}>View All</Link>
          </div>
          {lowStockList?.length > 0 ? (
            <ul className={styles.list}>
              {lowStockList.map((m) => (
                <li key={m._id} className={styles.listItem}>
                  <span className={styles.itemName}>{m.name}</span>
                  <span className={styles.itemBadge}>
                    {m.currentStock ?? 0} / {m.minStockLevel}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>No low stock items</p>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Expiring Soon</h2>
            <Link to="/inventory" className={styles.viewAll}>View All</Link>
          </div>
          {expiryAlertsList?.length > 0 ? (
            <ul className={styles.list}>
              {expiryAlertsList.map((b) => (
                <li key={b._id} className={styles.listItem}>
                  <span className={styles.itemName}>
                    {b.medicine?.name ?? 'Unknown'} <small style={{ color: 'var(--color-text-dim)', fontWeight: 400 }}>· {b.batchNo}</small>
                  </span>
                  <span className={styles.itemBadge}>
                    {formatDate(b.expiryDate)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>No expiry alerts</p>
          )}
        </section>
      </div>

      <section className={styles.salesSection}>
        <h2>Sales Summary</h2>
        <div className={styles.salesCard}>
          <div>
            <span className={styles.salesLabel}>Total Revenue</span>
            <span className={styles.salesValue}>{formatCurrency(salesSummary?.totalAmount ?? 0)}</span>
          </div>
          <div>
            <span className={styles.salesLabel}>Transaction Count</span>
            <span className={styles.salesValue}>{salesSummary?.totalSales ?? 0}</span>
          </div>
        </div>
      </section>
    </div>
  );
};
