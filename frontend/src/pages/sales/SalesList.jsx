import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { salesApi } from '../../api/salesApi';
import { useUI } from '../../contexts/UIContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Eye, Plus, ShoppingCart, Search, X } from "lucide-react";

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    Number.isFinite(Number(n)) ? Number(n) : 0
  );

/** API line items use `unitPrice`; derive from line total ÷ qty if needed. */
const saleLineUnitPrice = (item) => {
  const raw = item.unitPrice ?? item.price;
  if (raw != null && raw !== '') {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  const qty = Number(item.quantity);
  const total = item.total != null ? Number(item.total) : NaN;
  if (Number.isFinite(qty) && qty > 0 && Number.isFinite(total)) return total / qty;
  return 0;
};

export const SalesList = () => {
  const { openModal, closeModal } = useUI();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sales, setSales] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(searchParams.get('q') || '');

  const page = parseInt(searchParams.get('page') || '1', 10);
  const q = searchParams.get('q') || '';

  const handleView = (sale) => {
    openModal({
      title: `Sale Details`,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Customer</label>
              <p className="text-slate-200">{sale.customerName || 'Walk-in Customer'}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Date</label>
              <p className="text-slate-200">{formatDate(sale.saleDate)}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Total Amount</label>
              <p className="text-xl font-bold text-emerald-500">{formatCurrency(sale.totalAmount)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-500 uppercase">Medicines Sold</label>
            <div className="rounded-md border border-slate-800 bg-slate-900">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="h-9">Medicine</TableHead>
                    <TableHead className="h-9 text-right">Qty</TableHead>
                    <TableHead className="h-9 text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items?.map((item, idx) => (
                    <TableRow key={idx} className="border-slate-800">
                      <TableCell className="py-2 text-slate-300">
                        {item.medicineName || item.medicine?.name || 'Unknown'}
                      </TableCell>
                      <TableCell className="py-2 text-right">{item.quantity}</TableCell>
                      <TableCell className="py-2 text-right">{formatCurrency(saleLineUnitPrice(item))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )
    });
  };

  const fetchSales = (targetPage = 1, query = '') => {
    setLoading(true);
    salesApi
      .list({ page: targetPage, limit: 20, q: query || undefined })
      .then(({ data }) => {
        setSales(data.data.sales);
        setPagination(data.data.pagination);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load sales'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (search.trim()) params.set('q', search.trim());
      else params.delete('q');
      params.set('page', '1');
      navigate({ pathname: '/sales', search: params.toString() }, { replace: true });
    }, 350);
    return () => clearTimeout(timeout);
  }, [search, navigate, searchParams]);

  useEffect(() => {
    if (search !== q) setSearch(q);
  }, [q]);

  useEffect(() => {
    fetchSales(page, q);
  }, [page, q]);

  return (
    <div className="page-container">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales History</h1>
          <p className="text-slate-400">Manage and track your medicine sales history.</p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link to="/sales/new">
            <Plus className="mr-2 h-4 w-4" /> New Sale
          </Link>
        </Button>
      </header>

      {error && <div className="p-4 mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-md">{error}</div>}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name..."
            className="pl-10 bg-slate-900 border-slate-800 focus:ring-emerald-500"
          />
        </div>
        {q && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setSearch('')}
            className="justify-start sm:justify-center"
          >
            <X className="mr-2 h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      {loading && sales.length === 0 ? (
        <div className="flex justify-center py-12 text-slate-500">Loading sales history...</div>
      ) : (
        <div className="rounded-md border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-900">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Date</TableHead>
                <TableHead className="text-slate-400">Customer</TableHead>
                <TableHead className="text-slate-400">Items</TableHead>
                <TableHead className="text-slate-400">Total</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                    No sales found. <Link to="/sales/new" className="text-blue-500 hover:underline">Create a sale</Link>
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                  <TableRow key={sale._id} className="border-slate-800 hover:bg-slate-800/30">
                    <TableCell className="text-slate-300 font-medium">{formatDate(sale.saleDate)}</TableCell>
                    <TableCell className="text-slate-400">{sale.customerName || 'Walk-in'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                        {sale.items?.length ?? 0} items
                      </Badge>
                    </TableCell>
                    <TableCell className="text-emerald-500 font-bold">{formatCurrency(sale.totalAmount)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleView(sale)} className="text-slate-400 hover:text-white">
                        <Eye className="mr-2 h-4 w-4" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set('page', String(pagination.page - 1));
                navigate({ pathname: '/sales', search: params.toString() });
              }}
              className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set('page', String(pagination.page + 1));
                navigate({ pathname: '/sales', search: params.toString() });
              }}
              className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
