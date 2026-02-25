import type { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/index.js';

function getClientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded) && forwarded[0]) return forwarded[0].trim();
  return req.socket?.remoteAddress ?? null;
}

export async function auditMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    await AuditLog.create({
      user_id: user?.id ?? null,
      path: req.path,
      method: req.method,
      ip_address: getClientIp(req),
    });
  } catch (_) {
  }
  next();
}
