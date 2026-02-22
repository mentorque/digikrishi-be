import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Tenant, User } from '../models/index.js';
const SALT_ROUNDS = 10;
export async function registerTenant({ name, email, password, }) {
    const existing = await Tenant.findOne({ where: { email } });
    if (existing) {
        const err = new Error('Email already registered');
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
export async function loginUser(email, password, roleHint = null) {
    const user = await User.findOne({
        where: { email },
        include: [{ model: Tenant, as: 'Tenant', required: false }],
    });
    if (!user) {
        const err = new Error('Invalid email or password');
        err.status = 401;
        throw err;
    }
    if (!user.is_active) {
        const err = new Error('Account is inactive');
        err.status = 401;
        throw err;
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
        const err = new Error('Invalid email or password');
        err.status = 401;
        throw err;
    }
    if (roleHint && user.role !== roleHint) {
        const err = new Error('Invalid role for this login');
        err.status = 403;
        throw err;
    }
    return user;
}
export function createToken(user) {
    return jwt.sign({ userId: user.id, tenantId: user.tenant_id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}
export async function getMe(userId) {
    const user = await User.findByPk(userId, {
        attributes: { exclude: ['password_hash'] },
        include: [{ model: Tenant, as: 'Tenant', attributes: ['id', 'name', 'email'] }],
    });
    if (!user) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
    }
    return user;
}
//# sourceMappingURL=auth.service.js.map