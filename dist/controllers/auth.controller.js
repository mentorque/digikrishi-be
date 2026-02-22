import * as authService from '../services/auth.service.js';
export async function register(req, res) {
    const { name, email, password } = req.body;
    const { tenant, user } = await authService.registerTenant({ name, email, password });
    const token = authService.createToken({
        id: user.id,
        tenant_id: tenant.id,
        role: user.role,
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
export async function login(req, res) {
    const { email, password, roleHint } = req.body;
    const user = await authService.loginUser(email, password, roleHint ?? null);
    const token = authService.createToken({
        id: user.id,
        tenant_id: user.tenant_id,
        role: user.role,
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
export async function logout(req, res) {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
}
export async function me(req, res) {
    const user = await authService.getMe(req.user.id);
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
export async function listFieldOfficers(req, res) {
    const tenantId = req.user.tenant_id;
    if (!tenantId) {
        return res.status(403).json({ message: 'Tenant context required to list field officers' });
    }
    const users = await authService.listFieldOfficers(tenantId);
    return res.json(users);
}
export async function createFieldOfficer(req, res) {
    const tenantId = req.user.tenant_id;
    if (!tenantId) {
        return res.status(403).json({ message: 'Only tenants can create field officers' });
    }
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'email and password required' });
    }
    const user = await authService.createFieldOfficer(tenantId, { email, password });
    return res.status(201).json({
        message: 'Field officer created',
        user: { id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id },
    });
}
export async function getMyFarmer(req, res) {
    const userId = req.user.id;
    const farmer = await authService.getMyFarmer(userId);
    res.json(farmer);
}
export async function getMyAssignedFarmers(req, res) {
    const agentId = req.user.id;
    const farmers = await authService.getMyAssignedFarmers(agentId);
    res.json(farmers);
}
//# sourceMappingURL=auth.controller.js.map