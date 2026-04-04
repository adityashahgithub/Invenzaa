/** Canonical module permission ids used by routes and UI */
export const MODULE_PERMISSION_IDS = [
  'medicines',
  'inventory',
  'sales',
  'purchases',
  'reports',
  'collaboration',
];

/** Map common mistakes / singular forms to canonical ids */
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

/** Split input into invalid tokens vs canonical list (for API validation). */
export function partitionRolePermissions(perms) {
  const list = Array.isArray(perms) ? perms : [];
  const invalid = [];
  for (const p of list) {
    const t = String(p).trim();
    if (!t) continue;
    if (normalizePermissionKey(t) === null) invalid.push(t);
  }
  const normalized = normalizeRolePermissions(list);
  return { normalized, invalid };
}
