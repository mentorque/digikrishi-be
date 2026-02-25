import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { auditMiddleware } from '../middleware/audit.middleware.js';
import { allowRoles } from '../middleware/role.middleware.js';
import * as analyticsController from '../controllers/analytics.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(auditMiddleware);
router.use(allowRoles('TENANT', 'FIELD_OFFICER'));

router.get('/summary', asyncHandler(analyticsController.summary));
router.get('/by-district', asyncHandler(analyticsController.byDistrict));
router.get('/by-state', asyncHandler(analyticsController.byState));
router.get('/by-agent', asyncHandler(analyticsController.byAgent));
router.get('/by-social-category', asyncHandler(analyticsController.bySocialCategory));
router.get('/by-gender', asyncHandler(analyticsController.byGender));
router.get('/by-education', asyncHandler(analyticsController.byEducation));
router.get('/by-kyc-status', asyncHandler(analyticsController.byKycStatus));
router.get('/by-caste', asyncHandler(analyticsController.byCaste));
router.get('/by-fpc', asyncHandler(analyticsController.byFpc));
router.get('/ration-card-stats', asyncHandler(analyticsController.rationCardStats));
router.get('/by-village', asyncHandler(analyticsController.byVillage));
router.get('/by-taluka', asyncHandler(analyticsController.byTaluka));
router.get('/by-month', asyncHandler(analyticsController.byMonth));

export default router;
