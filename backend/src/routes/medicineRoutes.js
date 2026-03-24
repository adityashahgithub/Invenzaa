import express from 'express';
import {
  createMedicine,
  listMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
  searchMedicines,
} from '../controllers/medicineController.js';
import {
  createMedicineValidation,
  updateMedicineValidation,
  idParamValidation,
  listValidation,
  searchValidation,
} from '../utils/medicineValidators.js';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);

router.post(
  '/',
  requireRole('Owner', 'Admin', 'Pharmacist'),
  createMedicineValidation,
  validate,
  createMedicine
);

router.get('/', listValidation, validate, listMedicines);
router.get('/search', searchValidation, validate, searchMedicines);
router.get('/:id', idParamValidation, validate, getMedicineById);

router.put(
  '/:id',
  requireRole('Owner', 'Admin', 'Pharmacist'),
  updateMedicineValidation,
  validate,
  updateMedicine
);

router.delete(
  '/:id',
  requireRole('Owner', 'Admin'),
  idParamValidation,
  validate,
  deleteMedicine
);

export default router;
