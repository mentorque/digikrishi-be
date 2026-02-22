import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { allowRoles } from '../middleware/role.middleware.js';
import * as analyticsController from '../controllers/analytics.controller.js';
const router = Router();
router.use(authMiddleware);
router.use(allowRoles('TENANT', 'FIELD_OFFICER'));
router.get('/summary', asyncHandler(analyticsController.summary));
router.get('/by-district', asyncHandler(analyticsController.byDistrict));
router.get('/by-state', asyncHandler(analyticsController.byState));
router.get('/by-agent', asyncHandler(analyticsController.byAgent));
router.get('/by-social-category', asyncHandler(analyticsController.bySocialCategory));
export default router;
//# sourceMappingURL=analytics.routes.js.map