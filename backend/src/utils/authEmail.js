import validator from 'validator';

/**
 * Canonical email for auth lookups — matches express-validator's normalizeEmail defaults
 * and Mongoose's lowercase/trim behavior so login/register/forgot stay consistent.
 */
export function normalizeAuthEmail(email) {
  if (email == null) return '';
  const trimmed = String(email).trim();
  if (!trimmed) return '';
  const normalized = validator.normalizeEmail(trimmed);
  return normalized || trimmed.toLowerCase();
}
