import logger from '../utils/logger.js';
import type { Request, Response, NextFunction } from 'express';

export function errorMiddleware(err: any, req: Request, res: Response, _next: NextFunction) {
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
