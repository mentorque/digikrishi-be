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
    const { email, password } = req.body;
    const user = await authService.loginUser(email, password);
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
//# sourceMappingURL=auth.controller.js.map