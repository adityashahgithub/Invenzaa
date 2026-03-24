import { query } from 'express-validator';

const optionalDate = (field) =>
  query(field)
    .optional()
    .isISO8601()
    .withMessage(`${field} must be a valid ISO date`);

export const reportQueryValidation = [
  optionalDate('startDate'),
  optionalDate('endDate'),
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('days must be between 1 and 365')
    .toInt(),
];
