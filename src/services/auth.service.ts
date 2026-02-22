import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Tenant, User, Farmer, FarmerAddress, FarmerProfileDetails, FarmerAgentMap } from '../models/index.js';

const SALT_ROUNDS = 10;

export async function registerTenant({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) {
  const existing = await Tenant.findOne({ where: { email } });
  if (existing) {
    const err = new Error('Email already registered') as Error & { status?: number };
    err.status = 400;
    throw err;
  }
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const tenant = await Tenant.create({ name, email, password_hash });
  const user = await User.create({
    tenant_id: tenant.id,
    role: 'TENANT',
    email: tenant.email,
    password_hash: tenant.password_hash,
    is_active: true,
  });
  return { tenant, user };
}

export async function loginUser(email: string, password: string, roleHint: string | null = null) {
  const user = await User.findOne({
    where: { email },
    include: [{ model: Tenant, as: 'Tenant', required: false }],
  });
  if (!user) {
    const err = new Error('Invalid email or password') as Error & { status?: number };
    err.status = 401;
    throw err;
  }
  if (!user.is_active) {
    const err = new Error('Account is inactive') as Error & { status?: number };
    err.status = 401;
    throw err;
  }
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    const err = new Error('Invalid email or password') as Error & { status?: number };
    err.status = 401;
    throw err;
  }
  if (roleHint && user.role !== roleHint) {
    const err = new Error('Invalid role for this login') as Error & { status?: number };
    err.status = 403;
    throw err;
  }
  return user;
}

export function createToken(user: { id: string; tenant_id: string; role: string }) {
  return jwt.sign(
    { userId: user.id, tenantId: user.tenant_id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );
}

export async function getMe(userId: string) {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password_hash'] },
    include: [{ model: Tenant, as: 'Tenant', attributes: ['id', 'name', 'email'] }],
  });
  if (!user) {
    const err = new Error('User not found') as Error & { status?: number };
    err.status = 404;
    throw err;
  }
  return user;
}

export async function createFieldOfficer(
  tenantId: string,
  payload: { email: string; password: string }
) {
  const existing = await User.findOne({ where: { email: payload.email } });
  if (existing) {
    const err = new Error('Email already registered') as Error & { status?: number };
    err.status = 400;
    throw err;
  }
  const password_hash = await bcrypt.hash(payload.password, SALT_ROUNDS);
  const user = await User.create({
    tenant_id: tenantId,
    role: 'FIELD_OFFICER',
    email: payload.email,
    password_hash,
    is_active: true,
  });
  return user;
}

export async function listFieldOfficers(tenantId: string) {
  const users = await User.findAll({
    where: { tenant_id: tenantId, role: 'FIELD_OFFICER' },
    attributes: ['id', 'email', 'mobile', 'is_active', 'created_at'],
    order: [['created_at', 'DESC']],
  });
  return users;
}

export async function getMyFarmer(userId: string) {
  const farmer = await Farmer.findOne({
    where: { user_id: userId },
    include: [
      { model: FarmerAddress, as: 'FarmerAddress' },
      { model: FarmerProfileDetails, as: 'FarmerProfileDetail' },
      {
        model: FarmerAgentMap,
        as: 'FarmerAgentMaps',
        include: [{ model: User, as: 'Agent', attributes: ['id', 'email', 'mobile'] }],
      },
    ],
  });
  if (!farmer) {
    const err = new Error('Farmer profile not found') as Error & { status?: number };
    err.status = 404;
    throw err;
  }
  return farmer;
}

export async function getMyAssignedFarmers(agentId: string) {
  const maps = await FarmerAgentMap.findAll({
    where: { agent_id: agentId },
    include: [
      {
        model: Farmer,
        as: 'Farmer',
        include: [
          { model: FarmerAddress, as: 'FarmerAddress' },
          { model: FarmerProfileDetails, as: 'FarmerProfileDetail' },
        ],
      },
    ],
  });
  return maps.map((m) => (m as any).Farmer).filter(Boolean);
}
