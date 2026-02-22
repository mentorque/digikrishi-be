import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { allowRoles } from '../middleware/role.middleware.js';
import * as farmerController from '../controllers/farmer.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(allowRoles('TENANT', 'FIELD_OFFICER'));

router.get('/', asyncHandler(farmerController.list));
router.get('/:id', asyncHandler(farmerController.getOne));
router.post('/', asyncHandler(farmerController.create));
router.put('/:id', asyncHandler(farmerController.update));
router.patch('/:id/agent', allowRoles('TENANT'), asyncHandler(farmerController.assignAgent));
router.delete('/:id', asyncHandler(farmerController.remove));

export default router;
