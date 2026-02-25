import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { auditMiddleware } from '../middleware/audit.middleware.js';
import { allowRoles } from '../middleware/role.middleware.js';
import * as csvController from '../controllers/csv.controller.js';

const router = Router();

router.post(
  '/presign',
  authMiddleware,
  auditMiddleware,
  allowRoles('TENANT'),
  asyncHandler(csvController.getPresignUrl)
);

router.post(
  '/upload',
  authMiddleware,
  auditMiddleware,
  allowRoles('TENANT'),
  asyncHandler(csvController.upload)
);

router.get(
  '/status/:jobId',
  authMiddleware,
  auditMiddleware,
  allowRoles('TENANT', 'FIELD_OFFICER'),
  asyncHandler(csvController.status)
);

export default router;
