import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Download, CalendarRange } from 'lucide-react';
import { reportsApi } from '../../api/reportsApi';
import styles from './ReportsPage.module.css';

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const formatCompactCurrency = (value) => {
  const n = Number(value || 0);
  if (Math.abs(n) < 1000) return `₹${Math.round(n)}`;
  if (Math.abs(n) < 100000) return `₹${(n / 1000).toFixed(1)}k`;
  if (Math.abs(n) < 10000000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${(n / 10000000).toFixed(1)}Cr`;
};

const toDateStr = (d) => d.toISOString().slice(0, 10);

const REPORT_OPTIONS = [
  { value: 'sales', label: 'Sales' },
  { value: 'purchases', label: 'Purchases' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'low-stock', label: 'Low Stock' },
  { value: 'expiry', label: 'Expiry' },
];

const ReportTooltip = ({ active, payload, label, metricLabel = 'Value', currency = false }) => {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;

  return (
    <div className={styles.tooltipCard}>
      <div className={styles.tooltipTitle}>{label}</div>
      <div className={styles.tooltipValue}>
        {metricLabel}: {currency ? formatCurrency(value) : value}
      </div>
    </div>
  );
};

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

  const setQuickRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(toDateStr(start));
    setEndDate(toDateStr(end));
  };

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
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${report}-${toDateStr(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-container">
      <header className={styles.hero}>
        <div>
          <h1 className={styles.heroTitle}>Reports & Analytics</h1>
          <p className={styles.heroSub}>
            Analyze pharmacy performance, spot trends early, and make faster stock decisions.
          </p>
        </div>
        <button onClick={handleDownload} className={styles.downloadBtn} disabled={!data}>
          <Download size={16} strokeWidth={2} aria-hidden />
          Download JSON
        </button>
      </header>

      <section className={styles.controlCard}>
        <div className={styles.reportTabs}>
          {REPORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setReport(opt.value)}
              className={`${styles.reportTab} ${report === opt.value ? styles.reportTabActive : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>Report</label>
            <select value={report} onChange={(e) => setReport(e.target.value)}>
              {REPORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {(report === 'sales' || report === 'purchases') && (
            <>
              <div className={styles.filterGroup}>
                <label>From</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className={styles.filterGroup}>
                <label>To</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className={styles.quickRangeWrap}>
                <span className={styles.quickRangeLabel}>
                  <CalendarRange size={14} /> Quick Range
                </span>
                <div className={styles.quickRangeButtons}>
                  <button type="button" onClick={() => setQuickRange(30)}>30D</button>
                  <button type="button" onClick={() => setQuickRange(90)}>90D</button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const first = new Date(now.getFullYear(), 0, 1);
                      setStartDate(toDateStr(first));
                      setEndDate(toDateStr(now));
                    }}
                  >
                    YTD
                  </button>
                </div>
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
      </section>

      {error && <div className={styles.error}>{error}</div>}
      {loading && <div className={styles.loading}>Loading report data...</div>}

      {!loading && data && (
        <>
          {report === 'sales' && (
            <div className={styles.section}>
              <h2>Sales Summary</h2>
              <div className={styles.cards}>
                <div className={styles.card}>
                  <span className={styles.cardLabel}>Total Revenue</span>
                  <span className={styles.cardValue}>{formatCurrency(data.summary?.totalAmount ?? 0)}</span>
                </div>
                <div className={styles.card}>
                  <span className={styles.cardLabel}>Transactions</span>
                  <span className={styles.cardValue}>{data.summary?.totalTransactions ?? 0}</span>
                </div>
              </div>

              {data.byMonth?.length > 0 && (
                <div className={styles.chartWrap}>
                  <h3>Sales by Month</h3>
                  <div className={styles.chartSurface}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data.byMonth} barCategoryGap="42%" margin={{ top: 12, right: 12, left: 4, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.15)" vertical={false} />
                        <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={{ stroke: 'rgba(148,163,184,0.3)' }} />
                        <YAxis stroke="#94a3b8" tickFormatter={formatCompactCurrency} tickLine={false} axisLine={{ stroke: 'rgba(148,163,184,0.3)' }} />
                        <Tooltip content={<ReportTooltip metricLabel="Revenue" currency />} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
                        <Bar dataKey="total" radius={[8, 8, 0, 0]} fill="url(#salesGradient)" maxBarSize={58} name="Revenue" />
                        <defs>
                          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#60a5fa" />
                            <stop offset="100%" stopColor="#2563eb" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {data.topSelling?.length > 0 && (
                <div className={styles.chartWrap}>
                  <h3>Top Selling Medicines</h3>
                  <div className={styles.chartSurface}>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={data.topSelling} layout="vertical" margin={{ left: 80, right: 12, top: 8, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.15)" horizontal={false} />
                        <XAxis type="number" stroke="#94a3b8" tickLine={false} axisLine={{ stroke: 'rgba(148,163,184,0.3)' }} />
                        <YAxis type="category" dataKey="name" stroke="#94a3b8" width={74} tickLine={false} axisLine={{ stroke: 'rgba(148,163,184,0.3)' }} />
                        <Tooltip content={<ReportTooltip metricLabel="Units" />} cursor={{ fill: 'rgba(34,197,94,0.08)' }} />
                        <Bar dataKey="quantity" fill="url(#topSellingGradient)" radius={[0, 8, 8, 0]} maxBarSize={26} name="Quantity sold" />
                        <defs>
                          <linearGradient id="topSellingGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
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
                  <span className={styles.cardValue}>{formatCurrency(data.summary?.totalCost ?? 0)}</span>
                </div>
                <div className={styles.card}>
                  <span className={styles.cardLabel}>Transactions</span>
                  <span className={styles.cardValue}>{data.summary?.totalTransactions ?? 0}</span>
                </div>
              </div>

              {data.byMonth?.length > 0 && (
                <div className={styles.chartWrap}>
                  <h3>Purchases by Month</h3>
                  <div className={styles.chartSurface}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data.byMonth} barCategoryGap="42%" margin={{ top: 12, right: 12, left: 4, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.15)" vertical={false} />
                        <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={{ stroke: 'rgba(148,163,184,0.3)' }} />
                        <YAxis stroke="#94a3b8" tickFormatter={formatCompactCurrency} tickLine={false} axisLine={{ stroke: 'rgba(148,163,184,0.3)' }} />
                        <Tooltip content={<ReportTooltip metricLabel="Cost" currency />} cursor={{ fill: 'rgba(245,158,11,0.08)' }} />
                        <Bar dataKey="total" fill="url(#purchaseGradient)" radius={[8, 8, 0, 0]} maxBarSize={58} name="Cost" />
                        <defs>
                          <linearGradient id="purchaseGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#d97706" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
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
              <p className={styles.summaryText}>{data.summary?.count ?? 0} medicine(s) below minimum stock level</p>
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
                  <span className={styles.cardValue}>{data.summary?.totalBatches ?? 0}</span>
                </div>
                <div className={styles.card}>
                  <span className={styles.cardLabel}>Total Quantity</span>
                  <span className={styles.cardValue}>{data.summary?.totalQuantity ?? 0}</span>
                </div>
              </div>

              {data.byMonth?.length > 0 && (
                <div className={styles.chartWrap}>
                  <h3>Expiring by Month</h3>
                  <div className={styles.chartSurface}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data.byMonth} barCategoryGap="42%" margin={{ top: 12, right: 12, left: 4, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.15)" vertical={false} />
                        <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={{ stroke: 'rgba(148,163,184,0.3)' }} />
                        <YAxis stroke="#94a3b8" tickLine={false} axisLine={{ stroke: 'rgba(148,163,184,0.3)' }} />
                        <Tooltip content={<ReportTooltip metricLabel="Quantity" />} cursor={{ fill: 'rgba(239,68,68,0.08)' }} />
                        <Bar dataKey="quantity" fill="url(#expiryGradient)" radius={[8, 8, 0, 0]} maxBarSize={58} name="Quantity" />
                        <defs>
                          <linearGradient id="expiryGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#fb7185" />
                            <stop offset="100%" stopColor="#dc2626" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
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
      )}
    </div>
  );
};
