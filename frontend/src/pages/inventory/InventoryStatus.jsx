import { useState, useEffect } from 'react';
import { inventoryApi } from '../../api/inventoryApi';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, Clock, Ban, Filter, ArrowUpDown } from "lucide-react";

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

export const InventoryStatus = () => {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    expiredCount: 0,
    expiringSoonCount: 0,
    lowStockCount: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('name');
  const [order, setOrder] = useState('asc');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetch = async () => {
      try {
        const statusRes = await inventoryApi.getStatus({
          sort,
          order,
          page: pagination.page,
          limit: pagination.limit,
          filter: filter === 'all' ? undefined : filter,
        });
        setItems(statusRes.data.data.items);
        setSummary(statusRes.data.data.summary);
        setPagination((prev) => ({
          ...prev,
          ...statusRes.data.data.pagination,
        }));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [sort, order, filter, pagination.page, pagination.limit]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [sort, order, filter]);

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Status</h1>
          <p className="text-slate-400">Monitor stock levels, expiry dates, and batch information.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-rose-500/10 border-rose-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-rose-500">Expired Items</CardTitle>
            <Ban className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">{summary.expiredCount}</div>
            <p className="text-xs text-rose-500/70 mt-1">Require immediate removal</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-500">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{summary.expiringSoonCount}</div>
            <p className="text-xs text-amber-500/70 mt-1">Within next 30 days</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/10 border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-500">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{summary.lowStockCount}</div>
            <p className="text-xs text-orange-500/70 mt-1">Below minimum levels</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-4 items-end bg-slate-900/50 p-4 rounded-lg border border-slate-800">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3" /> Sort By
          </label>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[180px] bg-slate-950 border-slate-800">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="name">Medicine Name</SelectItem>
              <SelectItem value="expiry">Expiry Date</SelectItem>
              <SelectItem value="stock">Stock Level</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
            Order
          </label>
          <Select value={order} onValueChange={setOrder}>
            <SelectTrigger className="w-[140px] bg-slate-950 border-slate-800">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <Filter className="h-3 w-3" /> Filter Status
          </label>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] bg-slate-950 border-slate-800">
              <SelectValue placeholder="All Items" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="low_stock">Low Stock</SelectItem>
              <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
              <SelectItem value="ok">Stock OK</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>


      <div className="rounded-md border border-slate-800 bg-slate-900/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-950">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Medicine</TableHead>
              <TableHead className="text-slate-400">Batch Info</TableHead>
              <TableHead className="text-slate-400 text-right">Qty</TableHead>
              <TableHead className="text-slate-400 text-right">Total Stock</TableHead>
              <TableHead className="text-slate-400">Expiry Date</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500 italic">
                  Loading inventory data...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                  No inventory items match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item._id} className={`border-slate-800 group hover:bg-slate-800/30 ${item.isExpired ? 'bg-rose-500/5' : item.isLowStock ? 'bg-amber-500/5' : ''
                  }`}>
                  <TableCell className="py-4">
                    <div className="font-semibold text-slate-200">{item.medicine?.name}</div>
                    {item.medicine?.genericName && (
                      <div className="text-[10px] text-slate-500 uppercase tracking-tighter">{item.medicine.genericName}</div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">{item.batchNo}</TableCell>
                  <TableCell className="text-right font-medium text-slate-300">{item.quantity}</TableCell>
                  <TableCell className="text-right font-medium text-slate-300">{item.totalStockForMedicine}</TableCell>
                  <TableCell className={`${item.isExpired ? 'text-rose-500' : item.isExpiringSoon ? 'text-amber-500' : 'text-slate-400'}`}>
                    {formatDate(item.expiryDate)}
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      item.isExpired ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                        item.isLowStock ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                          item.isExpiringSoon ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                            'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    }>
                      {item.isExpired ? 'Expired' : item.isLowStock ? 'Low Stock' : item.isExpiringSoon ? 'Near Expiry' : 'Available'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-md text-sm">
          {error}
        </div>
      )}
      <p className="text-xs text-slate-500 text-right">{items.length} batches tracked in current view</p>
      {!loading && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
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
