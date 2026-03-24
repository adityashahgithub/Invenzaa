import { useState, useEffect } from 'react';
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
  unit: 'pcs',
  minStockLevel: 10,
  manufacturer: '',
  prescriptionRequired: false,
};

export const MedicineForm = ({ medicine, onSubmit, onCancel, loading, error }) => {
  const [form, setForm] = useState(defaultValues);

  useEffect(() => {
    setForm(medicine ? { ...defaultValues, ...medicine } : defaultValues);
  }, [medicine]);

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
      {error && <div className="p-3 text-sm bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-md">{error}</div>}

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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            name="category"
            value={form.category}
            onChange={(e) => handleChange('category', e.target.value)}
            placeholder="e.g. Antibiotic"
            className="bg-slate-900 border-slate-800"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <Select
            value={form.unit}
            onValueChange={(value) => handleChange('unit', value)}
          >
            <SelectTrigger className="bg-slate-900 border-slate-800">
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

      <div className="space-y-2">
        <Label htmlFor="manufacturer">Manufacturer</Label>
        <Input
          id="manufacturer"
          name="manufacturer"
          value={form.manufacturer}
          onChange={(e) => handleChange('manufacturer', e.target.value)}
          placeholder="Manufacturer name"
          className="bg-slate-900 border-slate-800"
        />
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <input
          type="checkbox"
          id="prescriptionRequired"
          name="prescriptionRequired"
          checked={form.prescriptionRequired}
          onChange={(e) => handleChange('prescriptionRequired', e.target.checked)}
          className="h-4 w-4 rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-blue-600 focus:ring-offset-slate-900"
        />
        <Label htmlFor="prescriptionRequired" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Prescription required
        </Label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="border-slate-800 text-slate-300 hover:bg-slate-800">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          {loading ? 'Saving...' : medicine ? 'Update Medicine' : 'Add Medicine'}
        </Button>
      </div>
    </form>
  );
};
