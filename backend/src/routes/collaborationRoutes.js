import express from 'express';
import {
  getPartners,
  createRequest,
  listRequests,
  getRequestById,
  updateRequestStatus,
  createResponse,
  getResponsesByRequestId,
} from '../controllers/collaborationController.js';
import { param } from 'express-validator';
import {
  createRequestValidation,
  updateStatusValidation,
  createResponseValidation,
  idParamValidation,
} from '../utils/collaborationValidators.js';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { requirePermission, requireRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);
router.use(requirePermission('collaboration'));

router.get('/partners', getPartners);

router.post(
  '/requests',
  requireRole('Owner', 'Admin', 'Pharmacist', 'Staff'),
  createRequestValidation,
  validate,
  createRequest
);

router.get('/requests', listRequests);
router.get('/requests/:id', idParamValidation, validate, getRequestById);
router.patch(
  '/requests/:id/status',
  requireRole('Owner', 'Admin'),
  updateStatusValidation,
  validate,
  updateRequestStatus
);

router.post(
  '/responses',
  requireRole('Owner', 'Admin'),
  createResponseValidation,
  validate,
  createResponse
);

router.get(
  '/responses/:requestId',
  param('requestId').isMongoId().withMessage('Invalid request ID'),
  validate,
  getResponsesByRequestId
);

export default router;
