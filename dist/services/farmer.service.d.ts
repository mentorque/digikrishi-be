export declare function getPaginated(tenantId: string, page?: number, limit?: number): Promise<{
    farmers: import("sequelize").Model<any, any>[];
    total: number;
}>;
export declare function getById(id: string, tenantId: string): Promise<import("sequelize").Model<any, any>>;
export declare function create(data: any, tenantId: string, agentId: string | null): Promise<import("sequelize").Model<any, any>>;
export declare function update(id: string, tenantId: string, data: any): Promise<import("sequelize").Model<any, any>>;
export declare function softDelete(id: string, tenantId: string): Promise<import("sequelize").Model<any, any>>;
//# sourceMappingURL=farmer.service.d.ts.map