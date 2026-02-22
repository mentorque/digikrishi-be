import logger from '../utils/logger.js';
export function errorMiddleware(err, req, res, _next) {
    if (res.headersSent) {
        return _next(err);
    }
    const status = err.status ?? err.statusCode ?? 500;
    const message = err.message ?? 'Internal Server Error';
    logger.error('Error', {
        status,
        message: err?.message,
        stack: err?.stack,
        path: req.path,
        method: req.method,
    });
    res.status(status).json({ message });
}
//# sourceMappingURL=error.middleware.js.map