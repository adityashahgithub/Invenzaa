import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { purchasesApi } from '../../api/purchasesApi';
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
import { Eye, Plus, Truck, Search, X } from "lucide-react";

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export const PurchasesList = () => {
  const { openModal, closeModal } = useUI();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [purchases, setPurchases] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(searchParams.get('q') || '');

  const page = parseInt(searchParams.get('page') || '1', 10);
  const q = searchParams.get('q') || '';

  const handleView = (purchase) => {
    openModal({
      title: `Purchase Details`,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Supplier</label>
              <p className="text-slate-200">{purchase.supplierName || 'General Supplier'}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Date</label>
              <p className="text-slate-200">{formatDate(purchase.purchaseDate)}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Total Cost</label>
              <p className="text-xl font-bold text-blue-500">{formatCurrency(purchase.totalCost)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-500 uppercase">Procured Items</label>
            <div className="rounded-md border border-slate-800 bg-slate-900">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="h-9">Medicine</TableHead>
                    <TableHead className="h-9">Batch</TableHead>
                    <TableHead className="h-9 text-right">Qty</TableHead>
                    <TableHead className="h-9 text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase.items?.map((item, idx) => (
                    <TableRow key={idx} className="border-slate-800">
                      <TableCell className="py-2 text-slate-300">{item.medicine?.name || 'Unknown'}</TableCell>
                      <TableCell className="py-2 text-slate-400 font-mono text-xs">
                        {item.batch?.batchNo || '—'}
                      </TableCell>
                      <TableCell className="py-2 text-right">{item.quantity}</TableCell>
                      <TableCell className="py-2 text-right">
                        {formatCurrency((item.unitCost || 0) * (item.quantity || 0))}
                      </TableCell>
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

  const fetchPurchases = (targetPage = 1, query = '') => {
    setLoading(true);
    purchasesApi
      .list({ page: targetPage, limit: 20, q: query || undefined })
      .then(({ data }) => {
        setPurchases(data.data.purchases);
        setPagination(data.data.pagination);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load purchases'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (search.trim()) params.set('q', search.trim());
      else params.delete('q');
      params.set('page', '1');
      navigate({ pathname: '/purchases', search: params.toString() }, { replace: true });
    }, 350);
    return () => clearTimeout(timeout);
  }, [search, navigate, searchParams]);

  useEffect(() => {
    if (search !== q) setSearch(q);
  }, [q]);

  useEffect(() => {
    fetchPurchases(page, q);
  }, [page, q]);

  return (
    <div className="page-container">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Procurement History</h1>
          <p className="text-slate-400">Record and manage procurement of medicines from suppliers.</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link to="/purchases/new">
            <Plus className="mr-2 h-4 w-4" /> New Purchase
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
            placeholder="Search supplier (try “General Supplier” for blank supplier field)..."
            className="pl-10 bg-slate-900 border-slate-800 focus:ring-blue-500"
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

      {loading && purchases.length === 0 ? (
        <div className="flex justify-center py-12 text-slate-500">Loading procurement records...</div>
      ) : (
        <div className="rounded-md border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-900">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Date</TableHead>
                <TableHead className="text-slate-400">Supplier</TableHead>
                <TableHead className="text-slate-400">Items</TableHead>
                <TableHead className="text-slate-400">Cost</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                    No purchases found. <Link to="/purchases/new" className="text-blue-500 hover:underline">Record a purchase</Link>
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map((p) => (
                  <TableRow key={p._id} className="border-slate-800 hover:bg-slate-800/30">
                    <TableCell className="text-slate-300 font-medium">{formatDate(p.purchaseDate)}</TableCell>
                    <TableCell className="text-slate-400">{p.supplierName || 'General Supplier'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                        {p.items?.length ?? 0} items
                      </Badge>
                    </TableCell>
                    <TableCell className="text-blue-500 font-bold">{formatCurrency(p.totalCost)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleView(p)} className="text-slate-400 hover:text-white">
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
                navigate({ pathname: '/purchases', search: params.toString() });
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
                navigate({ pathname: '/purchases', search: params.toString() });
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
