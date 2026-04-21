import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { medicineApi } from '../../api/medicineApi';
import { masterApi } from '../../api/masterApi';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { MedicineForm } from '../../components/medicine/MedicineForm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Edit, Trash2, Plus, Search, X } from "lucide-react";
import styles from './MedicineList.module.css';

export const MedicineList = () => {
  const { hasRole } = useAuth();
  const { showToast, confirm, openModal, closeModal } = useUI();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [medicines, setMedicines] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const q = searchParams.get('q') || '';
  const categoryQuery = searchParams.get('category') || '';

  useEffect(() => {
    setSearch(q);
    setCategory(categoryQuery);
  }, [q, categoryQuery]);

  const fetchMedicines = async (isSearch = false) => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (categoryQuery) params.category = categoryQuery;
      const { data } = isSearch
        ? await medicineApi.search({ ...params, q })
        : await medicineApi.list(params);
      setMedicines(data.data.medicines);
      setPagination(data.data.pagination);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load medicines', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines(!!q);
  }, [page, limit, q, categoryQuery]);

  useEffect(() => {
    masterApi.list('categories').then(setCategories).catch(() => setCategories([]));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('q', search.trim());
    if (category) params.set('category', category);
    params.set('page', '1');
    params.set('limit', String(limit));
    navigate({ pathname: '/medicines', search: params.toString() });
  };

  const handleClear = () => {
    setSearch('');
    setCategory('');
    navigate('/medicines');
  };

  const handleCategoryChange = (value) => {
    const nextCategory = value === '__all__' ? '' : value;
    setCategory(nextCategory);
    const params = new URLSearchParams(searchParams);
    if (nextCategory) {
      params.set('category', nextCategory);
    } else {
      params.delete('category');
    }
    if (search.trim()) {
      params.set('q', search.trim());
    } else {
      params.delete('q');
    }
    params.set('page', '1');
    params.set('limit', String(limit));
    navigate({ pathname: '/medicines', search: params.toString() });
  };

  const handleView = async (id) => {
    try {
      const { data } = await medicineApi.getById(id);
      const m = data.data.medicine;
      openModal({
        title: m.name,
        content: (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Generic Name</label>
                <p className="text-slate-200">{m.genericName || '-'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Category</label>
                <p className="text-slate-200">{m.category || '-'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Unit</label>
                <p className="text-slate-200">{m.unit || '-'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Brand</label>
                <p className="text-slate-200">{m.brand || '-'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Min Stock Level</label>
                <p className="text-slate-200">{m.minStockLevel || '0'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Current Stock</label>
                <Badge variant={m.isLowStock ? "destructive" : "secondary"}>
                  {m.currentStock || '0'}
                </Badge>
              </div>
            </div>
            {m.description && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Description</label>
                <p className="text-slate-300 text-sm leading-relaxed">{m.description}</p>
              </div>
            )}
          </div>
        )
      });
    } catch (err) {
      showToast('Failed to load medicine details', 'error');
    }
  };

  const handleEdit = async (id) => {
    try {
      const { data } = await medicineApi.getById(id);
      const m = data.data.medicine;

      const onEditSubmit = async (formData) => {
        try {
          await medicineApi.update(id, formData);
          showToast('Medicine updated', 'success');
          closeModal();
          fetchMedicines(!!q);
        } catch (err) {
          showToast(err.response?.data?.message || 'Update failed', 'error');
        }
      };

      openModal({
        title: `Edit ${m.name}`,
        content: (
          <MedicineForm
            medicine={m}
            onSubmit={onEditSubmit}
            onCancel={closeModal}
          />
        )
      });
    } catch (err) {
      showToast('Failed to load medicine for editing', 'error');
    }
  };

  const handleAdd = () => {
    const onAddSubmit = async (formData) => {
      try {
        await medicineApi.create(formData);
        showToast('Medicine added', 'success');
        closeModal();
        fetchMedicines(!!q);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to add medicine', 'error');
      }
    };

    openModal({
      title: 'Add New Medicine',
      content: (
        <MedicineForm
          onSubmit={onAddSubmit}
          onCancel={closeModal}
        />
      )
    });
  };

  const handleDelete = (id, name) => {
    confirm({
      title: 'Delete Medicine',
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await medicineApi.delete(id);
          showToast('Medicine deleted', 'success');
          fetchMedicines();
        } catch (err) {
          showToast(err.response?.data?.message || 'Delete failed', 'error');
        }
      }
    });
  };

  const canEdit = hasRole('Owner', 'Admin', 'Pharmacist');
  const canDelete = hasRole('Owner', 'Admin');

  return (
    <div className="page-container">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Medicines</h1>
          <p className="text-slate-400">
            {pagination.total} total medicine{pagination.total === 1 ? '' : 's'}
            {categoryQuery ? ` in ${categoryQuery}` : ''}
            .
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Add Medicine
          </Button>
        )}
      </header>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search medicines..."
            className="pl-10 bg-slate-900 border-slate-800 focus:ring-blue-500"
          />
        </div>
        <Select value={category || '__all__'} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[220px] bg-slate-900 border-slate-800">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="__all__">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c._id} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" variant="secondary">Search</Button>
        {(q || categoryQuery) && (
          <Button type="button" variant="ghost" onClick={handleClear}>
            <X className="mr-2 h-4 w-4" /> Clear
          </Button>
        )}
      </form>

      {loading ? (
        <div className="flex justify-center py-12 text-slate-500">Loading medicines...</div>
      ) : (
        <div className="rounded-md border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-900">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Medicine</TableHead>
                <TableHead className="text-slate-400">Category</TableHead>
                <TableHead className="text-slate-400">Stock Status</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2 py-6">
                      <span>No medicines found.</span>
                      {canEdit && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleAdd}>
                          <Plus className="mr-2 h-4 w-4" /> Add your first medicine
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                medicines.map((m) => (
                  <TableRow key={m._id} className="border-slate-800 hover:bg-slate-800/30">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-200">{m.name}</span>
                        <span className="text-xs text-slate-500">{m.genericName || 'No generic name'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">{m.category || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Badge variant={m.isLowStock ? "destructive" : "outline"} className={!m.isLowStock ? "border-emerald-500/50 text-emerald-500" : ""}>
                          {m.isLowStock ? 'Low Stock' : 'Good'}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {m.currentStock ?? 0} {m.unit}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleView(m._id)} title="View">
                          <Eye className="h-4 w-4 text-slate-400" />
                        </Button>
                        {canEdit && (
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(m._id)} title="Edit">
                            <Edit className="h-4 w-4 text-slate-400" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(m._id, m.name)} title="Delete">
                            <Trash2 className="h-4 w-4 text-rose-500" />
                          </Button>
                        )}
                      </div>
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
                navigate({ search: params.toString() });
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
                navigate({ search: params.toString() });
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
