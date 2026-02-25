import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { allowRoles } from '../middleware/role.middleware.js';
import * as farmerController from '../controllers/farmer.controller.js';
import * as uploadController from '../controllers/upload.controller.js';
import { auditMiddleware } from '../middleware/audit.middleware.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

router.use(authMiddleware);
router.use(auditMiddleware);
router.use(allowRoles('TENANT', 'FIELD_OFFICER'));

router.get('/', asyncHandler(farmerController.list));
router.get('/:id/documents', asyncHandler(farmerController.getDocuments));
// Profile & documents (before /:id)
router.post('/:id/profile/upload', upload.single('file'), asyncHandler(uploadController.profileUpload));
router.post('/:id/profile/presign', asyncHandler(uploadController.profilePresign));
router.post('/:id/profile/register', asyncHandler(uploadController.profileRegister));
router.get('/:id/profile/download-url', asyncHandler(uploadController.profileDownloadUrl));
router.delete('/:id/profile', asyncHandler(uploadController.profileDelete));
router.post('/:id/documents/upload', upload.single('file'), asyncHandler(uploadController.documentUpload));
router.post('/:id/documents/presign', asyncHandler(uploadController.documentPresign));
router.post('/:id/documents/register', asyncHandler(uploadController.documentRegister));
router.get('/:id/documents/download-url', asyncHandler(uploadController.documentDownloadUrl));
router.delete('/:id/documents/:docType', asyncHandler(uploadController.documentDelete));
// Farmer CRUD
router.get('/:id', asyncHandler(farmerController.getOne));
router.post('/', asyncHandler(farmerController.create));
router.put('/:id', asyncHandler(farmerController.update));
router.patch('/:id/agent', allowRoles('TENANT'), asyncHandler(farmerController.assignAgent));
router.delete('/:id', asyncHandler(farmerController.remove));

export default router;
