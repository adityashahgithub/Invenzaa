/** Keep in sync with backend/src/utils/permissions.js */

export const MODULE_PERMISSION_IDS = [
  'medicines',
  'inventory',
  'sales',
  'purchases',
  'reports',
  'collaboration',
];

const ALIASES = {
  '*': '*',
  medicine: 'medicines',
  med: 'medicines',
  medicines: 'medicines',
  inventory: 'inventory',
  purchase: 'purchases',
  purchases: 'purchases',
  sale: 'sales',
  sales: 'sales',
  report: 'reports',
  reports: 'reports',
  collaborate: 'collaboration',
  collaboration: 'collaboration',
};

export function normalizePermissionKey(raw) {
  if (raw == null) return null;
  const s = String(raw).trim().toLowerCase();
  if (!s) return null;
  if (s === '*') return '*';
  if (ALIASES[s]) return ALIASES[s];
  if (MODULE_PERMISSION_IDS.includes(s)) return s;
  return null;
}

export function normalizeRolePermissions(perms) {
  if (!Array.isArray(perms)) return [];
  const out = [];
  const seen = new Set();
  for (const p of perms) {
    const n = normalizePermissionKey(p);
    if (!n) continue;
    if (n === '*') return ['*'];
    if (!seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out.sort();
}

export function roleGrantsPermission(storedPerms, required) {
  const requiredNorm = normalizePermissionKey(required);
  if (!requiredNorm) return false;
  const normalized = normalizeRolePermissions(storedPerms);
  if (normalized.includes('*')) return true;
  return normalized.includes(requiredNorm);
}

/** Labels for Roles UI (checkboxes) */
export const MODULE_PERMISSION_OPTIONS = [
  { id: 'medicines', label: 'Medicines', hint: 'Catalog & master data' },
  { id: 'inventory', label: 'Inventory', hint: 'Stock, batches, alerts' },
  { id: 'sales', label: 'Sales', hint: 'Record sales & invoices' },
  { id: 'purchases', label: 'Purchases', hint: 'Receiving & stock in' },
  { id: 'reports', label: 'Reports', hint: 'Analytics & exports' },
  { id: 'collaboration', label: 'Collaboration', hint: 'Partner requests' },
];

export function permissionLabel(id) {
  if (id === '*') return 'Full access';
  const row = MODULE_PERMISSION_OPTIONS.find((o) => o.id === id);
  return row ? row.label : id;
}
