import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { auditMiddleware } from '../middleware/audit.middleware.js';
import { allowRoles } from '../middleware/role.middleware.js';
import * as searchController from '../controllers/search.controller.js';
const router = Router();
router.get('/', authMiddleware, auditMiddleware, allowRoles('TENANT', 'FIELD_OFFICER'), asyncHandler(searchController.search));
export default router;
//# sourceMappingURL=search.routes.js.map