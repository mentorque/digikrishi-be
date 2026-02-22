export declare function registerTenant({ name, email, password, }: {
    name: string;
    email: string;
    password: string;
}): Promise<{
    tenant: import("sequelize").Model<any, any>;
    user: import("sequelize").Model<any, any>;
}>;
export declare function loginUser(email: string, password: string, roleHint?: string | null): Promise<import("sequelize").Model<any, any>>;
export declare function createToken(user: {
    id: string;
    tenant_id: string;
    role: string;
}): string;
export declare function getMe(userId: string): Promise<import("sequelize").Model<any, any>>;
//# sourceMappingURL=auth.service.d.ts.map