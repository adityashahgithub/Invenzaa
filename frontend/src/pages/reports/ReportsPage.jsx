import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { reportsApi } from '../../api/reportsApi';
import styles from './ReportsPage.module.css';

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

const formatCompactCurrency = (value) => {
  const n = Number(value || 0);
  if (Math.abs(n) < 1000) return `₹${Math.round(n)}`;
  if (Math.abs(n) < 100000) return `₹${(n / 1000).toFixed(1)}k`;
  if (Math.abs(n) < 10000000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${(n / 10000000).toFixed(1)}Cr`;
};

const toDateStr = (d) => d.toISOString().slice(0, 10);

export const ReportsPage = () => {
  const today = new Date();
  const defaultStart = new Date(today);
  defaultStart.setMonth(defaultStart.getMonth() - 2);
  defaultStart.setDate(1);

  const [report, setReport] = useState('sales');
  const [startDate, setStartDate] = useState(toDateStr(defaultStart));
  const [endDate, setEndDate] = useState(toDateStr(today));
  const [expiryDays, setExpiryDays] = useState(90);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = { startDate, endDate };
    const fetchers = {
      inventory: () => reportsApi.getInventory(),
      sales: () => reportsApi.getSales(params),
      purchases: () => reportsApi.getPurchases(params),
      'low-stock': () => reportsApi.getLowStock(),
      expiry: () => reportsApi.getExpiry({ ...params, days: expiryDays }),
    };
    fetchers[report]()
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load report'))
      .finally(() => setLoading(false));
  }, [report, startDate, endDate, expiryDays]);

  const handleDownload = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${report}-${toDateStr(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-container">
      <header className="section-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p style={{ color: 'var(--color-text-dim)' }}>Analyze your pharmacy's performance and inventory health.</p>
        </div>
        <button onClick={handleDownload} className={styles.downloadBtn} disabled={!data}>
          Download JSON
        </button>
      </header>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Report</label>
          <select value={report} onChange={(e) => setReport(e.target.value)}>
            <option value="sales">Sales</option>
            <option value="purchases">Purchases</option>
            <option value="inventory">Inventory</option>
            <option value="low-stock">Low Stock</option>
            <option value="expiry">Expiry</option>
          </select>
        </div>
        {(report === 'sales' || report === 'purchases') && (
          <>
            <div className={styles.filterGroup}>
              <label>From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className={styles.filterGroup}>
              <label>To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </>
        )}
        {report === 'expiry' && (
          <div className={styles.filterGroup}>
            <label>Days ahead</label>
            <select value={expiryDays} onChange={(e) => setExpiryDays(Number(e.target.value))}>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : (
        data && (
          <>
            {report === 'sales' && (
              <div className={styles.section}>
                <h2>Sales Summary</h2>
                <div className={styles.cards}>
                  <div className={styles.card}>
                    <span className={styles.cardLabel}>Total Revenue</span>
                    <span className={styles.cardValue}>
                      {formatCurrency(data.summary?.totalAmount ?? 0)}
                    </span>
                  </div>
                  <div className={styles.card}>
                    <span className={styles.cardLabel}>Transactions</span>
                    <span className={styles.cardValue}>
                      {data.summary?.totalTransactions ?? 0}
                    </span>
                  </div>
                </div>
                {data.byMonth?.length > 0 && (
                  <div className={styles.chartWrap}>
                    <h3>Sales by Month</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={data.byMonth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d3a4d" />
                        <XAxis dataKey="month" stroke="#8b9cb3" />
                        <YAxis stroke="#8b9cb3" tickFormatter={formatCompactCurrency} />
                        <Tooltip
                          formatter={(v) => formatCurrency(v)}
                          contentStyle={{ background: '#1a2332', border: '1px solid #2d3a4d' }}
                        />
                        <Bar dataKey="total" fill="#3b82f6" name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {data.topSelling?.length > 0 && (
                  <div className={styles.chartWrap}>
                    <h3>Top Selling Medicines</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data.topSelling} layout="vertical" margin={{ left: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d3a4d" />
                        <XAxis type="number" stroke="#8b9cb3" />
                        <YAxis type="category" dataKey="name" stroke="#8b9cb3" width={70} />
                        <Tooltip contentStyle={{ background: '#1a2332', border: '1px solid #2d3a4d' }} />
                        <Bar dataKey="quantity" fill="#22c55e" name="Quantity sold" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {report === 'purchases' && (
              <div className={styles.section}>
                <h2>Purchases Summary</h2>
                <div className={styles.cards}>
                  <div className={styles.card}>
                    <span className={styles.cardLabel}>Total Cost</span>
                    <span className={styles.cardValue}>
                      {formatCurrency(data.summary?.totalCost ?? 0)}
                    </span>
                  </div>
                  <div className={styles.card}>
                    <span className={styles.cardLabel}>Transactions</span>
                    <span className={styles.cardValue}>
                      {data.summary?.totalTransactions ?? 0}
                    </span>
                  </div>
                </div>
                {data.byMonth?.length > 0 && (
                  <div className={styles.chartWrap}>
                    <h3>Purchases by Month</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={data.byMonth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d3a4d" />
                        <XAxis dataKey="month" stroke="#8b9cb3" />
                        <YAxis stroke="#8b9cb3" tickFormatter={formatCompactCurrency} />
                        <Tooltip
                          formatter={(v) => formatCurrency(v)}
                          contentStyle={{ background: '#1a2332', border: '1px solid #2d3a4d' }}
                        />
                        <Bar dataKey="total" fill="#f59e0b" name="Cost" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {report === 'inventory' && (
              <div className={styles.section}>
                <h2>Inventory Summary</h2>
                <div className={styles.cards}>
                  <div className={styles.card}>
                    <span className={styles.cardLabel}>Total Batches</span>
                    <span className={styles.cardValue}>{data.summary?.totalBatches ?? 0}</span>
                  </div>
                  <div className={styles.card}>
                    <span className={styles.cardLabel}>Medicines</span>
                    <span className={styles.cardValue}>{data.summary?.totalMedicines ?? 0}</span>
                  </div>
                  <div className={styles.card}>
                    <span className={styles.cardLabel}>Low Stock</span>
                    <span className={styles.cardValue}>{data.summary?.lowStockCount ?? 0}</span>
                  </div>
                </div>
              </div>
            )}

            {report === 'low-stock' && (
              <div className={styles.section}>
                <h2>Low Stock Report</h2>
                <p className={styles.summaryText}>
                  {data.summary?.count ?? 0} medicine(s) below minimum stock level
                </p>
                {data.items?.length > 0 ? (
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Medicine</th>
                          <th>Current Stock</th>
                          <th>Min Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((m, idx) => (
                          <tr key={m._id ?? `${m.medicineId ?? m.name ?? 'item'}-${idx}`}>
                            <td>{m.name}</td>
                            <td>{m.currentStock}</td>
                            <td>{m.minStockLevel}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className={styles.empty}>No low stock items</p>
                )}
              </div>
            )}

            {report === 'expiry' && (
              <div className={styles.section}>
                <h2>Expiry Report</h2>
                <div className={styles.cards}>
                  <div className={styles.card}>
                    <span className={styles.cardLabel}>Batches Expiring</span>
                    <span className={styles.cardValue}>
                      {data.summary?.totalBatches ?? 0}
                    </span>
                  </div>
                  <div className={styles.card}>
                    <span className={styles.cardLabel}>Total Quantity</span>
                    <span className={styles.cardValue}>
                      {data.summary?.totalQuantity ?? 0}
                    </span>
                  </div>
                </div>
                {data.byMonth?.length > 0 && (
                  <div className={styles.chartWrap}>
                    <h3>Expiring by Month</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={data.byMonth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d3a4d" />
                        <XAxis dataKey="month" stroke="#8b9cb3" />
                        <YAxis stroke="#8b9cb3" />
                        <Tooltip contentStyle={{ background: '#1a2332', border: '1px solid #2d3a4d' }} />
                        <Bar dataKey="quantity" fill="#ef4444" name="Quantity" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {data.items?.length > 0 && (
                  <div className={styles.tableWrap}>
                    <h3>Expiring Batches</h3>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Medicine</th>
                          <th>Batch</th>
                          <th>Quantity</th>
                          <th>Expiry</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.slice(0, 20).map((b, idx) => (
                          <tr key={b._id ?? `${b.batchNo ?? b.medicine?.name ?? 'batch'}-${idx}`}>
                            <td>{b.medicine?.name}</td>
                            <td>{b.batchNo}</td>
                            <td>{b.quantity}</td>
                            <td>{new Date(b.expiryDate).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )
      )}
    </div>
  );
};
