import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { allowRoles } from '../middleware/role.middleware.js';
import * as farmerController from '../controllers/farmer.controller.js';
import * as uploadController from '../controllers/upload.controller.js';
import { auditMiddleware } from '../middleware/audit.middleware.js';
const router = Router();
router.use(authMiddleware);
router.use(auditMiddleware);
router.use(allowRoles('TENANT', 'FIELD_OFFICER'));
router.get('/', asyncHandler(farmerController.list));
router.get('/:id/documents', asyncHandler(farmerController.getDocuments));
router.get('/:id', asyncHandler(farmerController.getOne));
router.post('/', asyncHandler(farmerController.create));
router.put('/:id', asyncHandler(farmerController.update));
router.patch('/:id/agent', allowRoles('TENANT'), asyncHandler(farmerController.assignAgent));
router.delete('/:id', asyncHandler(farmerController.remove));
// Profile & document upload (presign + register)
router.post('/:id/profile/presign', asyncHandler(uploadController.profilePresign));
router.post('/:id/profile/register', asyncHandler(uploadController.profileRegister));
router.post('/:id/documents/presign', asyncHandler(uploadController.documentPresign));
router.post('/:id/documents/register', asyncHandler(uploadController.documentRegister));
export default router;
//# sourceMappingURL=farmer.routes.js.map