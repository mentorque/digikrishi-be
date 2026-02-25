/** List: only fields used by list table (code, name, village/district, kyc, status). */
export declare function getPaginated(tenantId: string, page?: number, limit?: number): Promise<{
    farmers: import("sequelize").Model<any, any>[];
    total: number;
}>;
/** Detail: only fields used by detail form (no FarmerDoc – use GET /:id/documents for docs). */
export declare function getById(id: string, tenantId: string): Promise<import("sequelize").Model<any, any>>;
/** Fetch only documents for a farmer (for Documents tab). */
export declare function getDocumentsById(id: string, tenantId: string): Promise<any>;
/** Fetch by ids for search results: id, code, name, village (for assign modal). */
export declare function getByIds(ids: string[], tenantId: string): Promise<import("sequelize").Model<any, any>[]>;
export declare function create(data: any, tenantId: string, agentId: string | null): Promise<import("sequelize").Model<any, any>>;
export declare function update(id: string, tenantId: string, data: any): Promise<import("sequelize").Model<any, any>>;
export declare function softDelete(id: string, tenantId: string): Promise<import("sequelize").Model<any, any>>;
export declare function assignAgent(farmerId: string, tenantId: string, agentId: string | null): Promise<import("sequelize").Model<any, any>>;
/** Allowed doc_type values for upload (maps to FarmerDoc column). */
export declare const DOC_TYPE_TO_COLUMN: Record<string, string>;
/** Set profile picture S3 key (upload only if not already set, unless overwrite). */
export declare function setProfilePicKey(farmerId: string, tenantId: string, s3Key: string, options?: {
    overwrite?: boolean;
    uploadedBy?: string;
}): Promise<import("sequelize").Model<any, any>>;
/** Set a specific document S3 key (append/update in FarmerDoc). */
export declare function setDocKey(farmerId: string, tenantId: string, docType: string, s3Key: string, options?: {
    uploadedBy?: string;
}): Promise<import("sequelize").Model<any, any>>;
//# sourceMappingURL=farmer.service.d.ts.map