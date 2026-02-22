import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { allowRoles } from '../middleware/role.middleware.js';
import * as authController from '../controllers/auth.controller.js';
const router = Router();
router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.post('/logout', asyncHandler(authController.logout));
router.get('/me', authMiddleware, asyncHandler(authController.me));
router.get('/field-officers', authMiddleware, allowRoles('TENANT', 'FIELD_OFFICER'), asyncHandler(authController.listFieldOfficers));
router.post('/field-officers', authMiddleware, allowRoles('TENANT'), asyncHandler(authController.createFieldOfficer));
router.get('/me/farmer', authMiddleware, allowRoles('FARMER'), asyncHandler(authController.getMyFarmer));
router.get('/me/assigned-farmers', authMiddleware, allowRoles('FIELD_OFFICER'), asyncHandler(authController.getMyAssignedFarmers));
export default router;
//# sourceMappingURL=auth.routes.js.map