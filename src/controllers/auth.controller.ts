import type { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body;
  const { tenant, user } = await authService.registerTenant({ name, email, password });
  const token = authService.createToken({
    id: (user as any).id,
    tenant_id: (tenant as any).id,
    role: (user as any).role,
  });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.status(201).json({
    message: 'Registered successfully',
    user: { id: user.id, email: user.email, role: user.role, tenant_id: tenant.id },
  });
}

export async function login(req: Request, res: Response) {
  const { email, password, roleHint } = req.body;
  const user = await authService.loginUser(email, password, roleHint ?? null);
  const token = authService.createToken({
    id: (user as any).id,
    tenant_id: (user as any).tenant_id,
    role: (user as any).role,
  });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({
    message: 'Logged in successfully',
    token,
    user: { id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id },
  });
}

export async function logout(req: Request, res: Response) {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
}

export async function me(req: Request, res: Response) {
  const user = await authService.getMe((req as any).user.id);
  res.json({
    user: {
      id: user.id,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      tenant_id: user.tenant_id,
      is_active: user.is_active,
      Tenant: user.Tenant,
    },
  });
}

export async function listFieldOfficers(req: Request, res: Response) {
  const tenantId = (req as any).user.tenant_id;
  if (!tenantId) {
    return res.status(403).json({ message: 'Tenant context required to list field officers' });
  }
  const users = await authService.listFieldOfficers(tenantId);
  res.json(users);
}

export async function createFieldOfficer(req: Request, res: Response) {
  const tenantId = (req as any).user.tenant_id;
  if (!tenantId) {
    return res.status(403).json({ message: 'Only tenants can create field officers' });
  }
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password required' });
  }
  const user = await authService.createFieldOfficer(tenantId, { email, password });
  res.status(201).json({
    message: 'Field officer created',
    user: { id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id },
  });
}

export async function getMyFarmer(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const farmer = await authService.getMyFarmer(userId);
  res.json(farmer);
}

export async function getMyAssignedFarmers(req: Request, res: Response) {
  const agentId = (req as any).user.id;
  const farmers = await authService.getMyAssignedFarmers(agentId);
  res.json(farmers);
}
