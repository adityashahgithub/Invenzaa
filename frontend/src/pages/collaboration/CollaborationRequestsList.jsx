import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collaborationApi } from '../../api/collaborationApi';
import { useAuth } from '../../contexts/AuthContext';
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Send, Inbox, Plus } from "lucide-react";

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

export const CollaborationRequestsList = () => {
  const { isAdmin } = useAuth();
  const { openModal, closeModal } = useUI();
  const [requests, setRequests] = useState([]);
  const [type, setType] = useState('sent');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleView = (r) => {
    openModal({
      title: 'Collaboration Request Details',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Status</label>
              <div>
                <Badge className={
                  r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    r.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-rose-500/10 text-rose-500 border-rose-500/20'
                }>
                  {r.status}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">{type === 'sent' ? 'To' : 'From'}</label>
              <p className="text-slate-200">{type === 'sent' ? r.toOrganization?.name : r.fromOrganization?.name}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Medicine</label>
              <p className="text-slate-200 font-medium">{r.medicine?.name}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Quantity</label>
              <p className="text-slate-200">{r.quantity}</p>
            </div>
          </div>
          {r.message && (
            <div className="space-y-1 p-3 bg-slate-900 rounded-md border border-slate-800">
              <label className="text-xs font-semibold text-slate-500 uppercase">Message</label>
              <p className="text-slate-400 italic text-sm">"{r.message}"</p>
            </div>
          )}
        </div>
      )
    });
  };

  const fetchRequests = () => {
    setLoading(true);
    collaborationApi
      .listRequests({ type })
      .then(({ data }) => setRequests(data.data.requests))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, [type]);

  return (
    <div className="page-container">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Collaboration</h1>
          <p className="text-slate-400">Request and respond to stock sharing with partner pharmacies.</p>
        </div>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
          <Link to="/collaboration/request">
            <Plus className="mr-2 h-4 w-4" /> New Request
          </Link>
        </Button>
      </header>

      <Tabs value={type} onValueChange={setType} className="mb-8">
        <TabsList className="bg-slate-900 border border-slate-800 p-1">
          <TabsTrigger value="sent" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
            <Send className="mr-2 h-4 w-4" /> Sent
          </TabsTrigger>
          <TabsTrigger value="received" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
            <Inbox className="mr-2 h-4 w-4" /> Received
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {error && <div className="p-4 mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-md">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12 text-slate-500">Loading requests...</div>
      ) : (
        <div className="rounded-md border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-900">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Date</TableHead>
                <TableHead className="text-slate-400">{type === 'sent' ? 'To' : 'From'}</TableHead>
                <TableHead className="text-slate-400">Medicine</TableHead>
                <TableHead className="text-slate-400">Qty</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                    No {type} requests found.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((r) => (
                  <tr key={r._id} className="border-slate-800 hover:bg-slate-800/30">
                    <TableCell className="text-slate-300 py-3">{formatDate(r.createdAt)}</TableCell>
                    <TableCell className="text-slate-400">
                      {type === 'sent'
                        ? r.toOrganization?.name
                        : r.fromOrganization?.name}
                    </TableCell>
                    <TableCell className="text-slate-200 font-medium">{r.medicine?.name}</TableCell>
                    <TableCell className="text-slate-400">{r.quantity}</TableCell>
                    <TableCell>
                      <Badge className={
                        r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          r.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                            r.status === 'rejected' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                              'bg-slate-800 text-slate-400'
                      }>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleView(r)} className="text-slate-400 hover:text-white">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {type === 'received' &&
                          r.status === 'pending' &&
                          isAdmin() && (
                            <Button asChild variant="outline" size="sm" className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10">
                              <Link to={`/collaboration/respond/${r._id}`}>
                                Respond
                              </Link>
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
