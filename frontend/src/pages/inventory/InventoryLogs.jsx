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
import { History, ArrowLeft, ArrowRight, Filter } from "lucide-react";

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : '-';

export const InventoryLogs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 20 };
      if (typeFilter !== 'all') params.type = typeFilter;
      const { data } = await inventoryApi.getLogs(params);
      setLogs(data.data.logs);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [typeFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchLogs(newPage);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-slate-400 text-sm">Track every stock change, sale, and batch update.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
            <Filter className="h-3 w-3" /> Type
          </label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] bg-slate-900 border-slate-800">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="sale">Sale</SelectItem>
              <SelectItem value="purchase">Purchase</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-md text-sm font-medium">{error}</div>}

      <div className="rounded-md border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-950">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Timestamp</TableHead>
              <TableHead className="text-slate-400">Type</TableHead>
              <TableHead className="text-slate-400">Medicine</TableHead>
              <TableHead className="text-slate-400">Batch</TableHead>
              <TableHead className="text-slate-400 text-right">Change</TableHead>
              <TableHead className="text-slate-400 text-right">New Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500 italic">
                  Retrieving history logs...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                  No activity logs found for this filter.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log._id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                  <TableCell className="text-slate-400 text-xs py-3">{formatDate(log.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={log.type === 'sale' ? 'outline' : 'secondary'} className={
                      log.type === 'sale' ? 'border-amber-500/50 text-amber-500' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    }>
                      {log.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-slate-200">{log.medicine?.name ?? '-'}</TableCell>
                  <TableCell className="text-slate-500 font-mono text-[10px]">{log.batch?.batchNo ?? '-'}</TableCell>
                  <TableCell className={`text-right font-bold ${log.quantityChange > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                  </TableCell>
                  <TableCell className="text-right text-slate-300 font-medium">{log.newQuantity}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
          <p className="text-xs text-slate-500 italic">
            Showing {logs.length} of {pagination.total} total logs
          </p>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="border-slate-800 h-8 px-4"
            >
              <ArrowLeft className="mr-2 h-3 w-3" /> Previous
            </Button>
            <div className="text-sm font-medium text-slate-200">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="border-slate-800 h-8 px-4"
            >
              Next <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
