import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/index.js';
import logger from '../utils/logger.js';
export async function authMiddleware(req, res, next) {
    const token = req.cookies?.token ?? req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId);
        if (!user || !user.is_active) {
            return res.status(401).json({ message: 'Invalid or inactive user' });
        }
        req.user = user;
        return next();
    }
    catch (err) {
        logger.warn('JWT verify failed', { error: err?.message });
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}
//# sourceMappingURL=auth.middleware.js.map