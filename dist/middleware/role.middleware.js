export function allowRoles(...allowedRoles) {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }
        return next();
    };
}
//# sourceMappingURL=role.middleware.js.map