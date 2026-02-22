import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { allowRoles } from '../middleware/role.middleware.js';
import * as csvController from '../controllers/csv.controller.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, path.resolve(__dirname, '..', '..', env.CSV_UPLOAD_PATH));
    },
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        cb(null, `${unique}-${file.originalname}`);
    },
});
const upload = multer({ storage });
const router = Router();
router.post('/upload', authMiddleware, allowRoles('TENANT'), upload.single('file'), asyncHandler(csvController.upload));
router.get('/status/:jobId', authMiddleware, allowRoles('TENANT', 'FIELD_OFFICER'), asyncHandler(csvController.status));
export default router;
//# sourceMappingURL=csv.routes.js.map