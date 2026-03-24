import { validationResult } from 'express-validator';
import { AppError } from './errorHandler.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const extracted = errors.array().map((err) => ({
    field: err.path || err.param || 'field',
    message: err.msg,
  }));

  const message = extracted.map((e) => `${e.field}: ${e.message}`).join('. ').trim() || 'Validation failed';
  next(new AppError(message, 400));
};
