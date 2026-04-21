import { useState, useEffect, useCallback } from 'react';
import { masterApi } from '../../api/masterApi';
import { useUI } from '../../contexts/UIContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, Layers } from "lucide-react";

export const MasterManagement = ({ type, title, fields = [] }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { showToast, confirm, openModal, closeModal } = useUI();

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const data = await masterApi.list(type);
            setItems(data);
        } catch (error) {
            showToast('Failed to load items', 'error');
        } finally {
            setLoading(false);
        }
    }, [type, showToast]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleSubmit = async (formData, editingId) => {
        try {
            if (editingId) {
                await masterApi.update(type, editingId, formData);
                showToast(`${title} updated successfully`, 'success');
            } else {
                await masterApi.create(type, formData);
                showToast(`${title} added successfully`, 'success');
            }
            closeModal();
            fetchItems();
        } catch (error) {
            showToast(error.response?.data?.message || 'Operation failed', 'error');
        }
    };

    const handleOpenModal = (item = null) => {
        const initialData = item || fields.reduce((acc, f) => ({ ...acc, [f.name]: '' }), {});
        openModal({
            title: `${item ? 'Edit' : 'Add'} ${title}`,
            content: (
                <MasterForm
                    fields={fields}
                    initialData={initialData}
                    onSubmit={(data) => handleSubmit(data, item?._id)}
                    onCancel={closeModal}
                    title={title}
                />
            )
        });
    };

    const handleDelete = (id) => {
        confirm({
            title: `Delete ${title}`,
            message: `Are you sure you want to delete this ${title.toLowerCase()}? This action cannot be undone.`,
            confirmText: 'Delete',
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await masterApi.delete(type, id);
                    showToast(`${title} deleted successfully`, 'success');
                    fetchItems();
                } catch (error) {
                    showToast(error.response?.data?.message || 'Failed to delete item', 'error');
                }
            }
        });
    };

    const filteredItems = items.filter(item =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const showMedicineCount = type === 'categories' || type === 'brands';

    return (
        <div className="page-container">
            {/* Header with total count */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                        {!loading && (
                            <Badge variant="secondary" className="text-slate-400 bg-slate-800 border-slate-700">
                                {items.length} {title}
                            </Badge>
                        )}
                    </div>
                    <p className="text-slate-400 text-sm mt-1">Manage your pharmacy's {title.toLowerCase()} list.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="mr-2 h-4 w-4" /> Add {title}
                </Button>
            </header>

            {/* Search bar */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                    placeholder={`Search ${title.toLowerCase()}...`}
                    className="pl-10 bg-slate-900/50 border-slate-800"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Items grid */}
            {loading && items.length === 0 ? (
                <div className="flex justify-center py-12 text-slate-500 text-sm">
                    Loading {title.toLowerCase()}...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item) => (
                        <Card
                            key={item._id}
                            className="bg-slate-900/40 border-slate-800 hover:border-slate-700 transition-colors group"
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                    <CardTitle className="text-lg font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                                        {item.name}
                                    </CardTitle>
                                    {/* Medicine usage count badge */}
                                    {showMedicineCount && (
                                        <Badge
                                            variant="outline"
                                            className={
                                                item.medicineCount > 0
                                                    ? 'border-indigo-500/40 text-indigo-400 shrink-0'
                                                    : 'border-slate-700 text-slate-500 shrink-0'
                                            }
                                        >
                                            {item.medicineCount > 0
                                                ? `Used in ${item.medicineCount} medicine${item.medicineCount !== 1 ? 's' : ''}`
                                                : 'Not used'}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {fields.filter(f => f.name !== 'name').map(f => (
                                    <div key={f.name} className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            {f.label}
                                        </span>
                                        <span className="text-sm text-slate-300">
                                            {item[f.name] || '-'}
                                        </span>
                                    </div>
                                ))}
                            </CardContent>
                            <CardFooter className="pt-3 border-t border-slate-800/50 flex justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenModal(item)}
                                    className="text-slate-400 hover:text-white hover:bg-slate-800"
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(item._id)}
                                    disabled={showMedicineCount && item.medicineCount > 0}
                                    className="text-slate-400 hover:text-rose-500 hover:bg-rose-500/10"
                                    title={item.medicineCount > 0 ? `In use by ${item.medicineCount} medicine(s)` : `Delete ${title}`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Improved empty state with icon + CTA */}
            {!loading && filteredItems.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl">
                    <Layers className="h-12 w-12 mx-auto text-slate-700 mb-4" />
                    {searchQuery ? (
                        <>
                            <p className="text-slate-400 font-medium">No results for "{searchQuery}"</p>
                            <p className="text-slate-600 text-sm mt-1">Try a different search term.</p>
                        </>
                    ) : (
                        <>
                            <p className="text-slate-400 font-medium">No {title.toLowerCase()} yet</p>
                            <p className="text-slate-600 text-sm mt-1">
                                Add your first {title.toLowerCase()} to start organising your medicines.
                            </p>
                            <Button
                                onClick={() => handleOpenModal()}
                                className="mt-5 bg-indigo-600 hover:bg-indigo-700"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add {title}
                            </Button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

const MasterForm = ({ fields, initialData, onSubmit, onCancel, title }) => {
    const [formData, setFormData] = useState(initialData);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {fields.map(field => (
                <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    {field.type === 'textarea' ? (
                        <Textarea
                            id={field.name}
                            value={formData[field.name] || ''}
                            onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                            placeholder={field.placeholder}
                            className="bg-slate-950 border-slate-800 focus:border-indigo-500 min-h-[100px]"
                        />
                    ) : (
                        <Input
                            id={field.name}
                            type={field.type || 'text'}
                            value={formData[field.name] || ''}
                            onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                            placeholder={field.placeholder}
                            className="bg-slate-950 border-slate-800 focus:border-indigo-500"
                            required={field.required}
                        />
                    )}
                </div>
            ))}
            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel} className="text-slate-400">
                    Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                    Save Changes
                </Button>
            </div>
        </form>
    );
};
