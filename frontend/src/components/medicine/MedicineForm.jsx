import { useState, useEffect } from 'react';
import { masterApi } from '../../api/masterApi';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const defaultValues = {
  name: '',
  genericName: '',
  description: '',
  category: '',
  brand: '',
  unit: 'pcs',
  minStockLevel: 10,
  prescriptionRequired: false,
};

export const MedicineForm = ({ medicine, onSubmit, onCancel, loading, error }) => {
  const [form, setForm] = useState(defaultValues);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    setForm(medicine ? { ...defaultValues, ...medicine } : defaultValues);
  }, [medicine]);

  // Fetch categories and brands from master data
  useEffect(() => {
    masterApi.list('categories').then(setCategories).catch(() => setCategories([]));
    masterApi.list('brands').then(setBrands).catch(() => setBrands([]));
  }, []);

  const handleChange = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      minStockLevel: parseInt(form.minStockLevel, 10) || 0,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-md">
          {error}
        </div>
      )}

      {/* Name + Generic Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            name="name"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            placeholder="Trade/brand name"
            className="bg-slate-900 border-slate-800"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="genericName">Generic name</Label>
          <Input
            id="genericName"
            name="genericName"
            value={form.genericName}
            onChange={(e) => handleChange('genericName', e.target.value)}
            placeholder="Scientific name"
            className="bg-slate-900 border-slate-800"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          placeholder="Notes and indications..."
          className="bg-slate-900 border-slate-800"
        />
      </div>

      {/* Category + Brand - both from masters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={form.category || '__none__'}
            onValueChange={(v) => handleChange('category', v === '__none__' ? '' : v)}
            disabled={categories.length === 0}
          >
            <SelectTrigger id="category" className="bg-slate-900 border-slate-800">
              <SelectValue placeholder={categories.length === 0 ? 'No categories available' : 'Select category'} />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="__none__">- None -</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c._id} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {categories.length === 0 && (
            <p className="text-xs text-slate-500">Add categories in Masters - Categories first.</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand">Brand</Label>
          <Select
            value={form.brand || '__none__'}
            onValueChange={(v) => handleChange('brand', v === '__none__' ? '' : v)}
            disabled={brands.length === 0}
          >
            <SelectTrigger id="brand" className="bg-slate-900 border-slate-800">
              <SelectValue placeholder={brands.length === 0 ? 'No brands available' : 'Select brand'} />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="__none__">- None -</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b._id} value={b.name}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {brands.length === 0 && (
            <p className="text-xs text-slate-500">Add brands in Masters - Brands first.</p>
          )}
        </div>
      </div>

      {/* Unit + Min Stock */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <Select
            value={form.unit}
            onValueChange={(value) => handleChange('unit', value)}
          >
            <SelectTrigger id="unit" className="bg-slate-900 border-slate-800">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="pcs">pcs</SelectItem>
              <SelectItem value="strips">strips</SelectItem>
              <SelectItem value="bottles">bottles</SelectItem>
              <SelectItem value="ml">ml</SelectItem>
              <SelectItem value="mg">mg</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="minStockLevel">Min stock level</Label>
          <Input
            id="minStockLevel"
            type="number"
            name="minStockLevel"
            value={form.minStockLevel}
            onChange={(e) => handleChange('minStockLevel', e.target.value)}
            min={0}
            className="bg-slate-900 border-slate-800"
          />
        </div>
      </div>

      {/* Prescription */}
      <div className="flex items-center space-x-2 pt-2">
        <input
          type="checkbox"
          id="prescriptionRequired"
          name="prescriptionRequired"
          checked={form.prescriptionRequired}
          onChange={(e) => handleChange('prescriptionRequired', e.target.checked)}
          className="h-4 w-4 rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-blue-600 focus:ring-offset-slate-900"
        />
        <Label
          htmlFor="prescriptionRequired"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Prescription required
        </Label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-slate-800 text-slate-300 hover:bg-slate-800"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          {loading ? 'Saving...' : medicine ? 'Update Medicine' : 'Add Medicine'}
        </Button>
      </div>
    </form>
  );
};
