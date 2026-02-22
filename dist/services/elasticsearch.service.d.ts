export declare function ensureFarmersIndex(): Promise<void>;
export declare function toFarmerDoc(farmer: any, address: any, profile: any): {
    farmer_id: any;
    tenant_id: any;
    name: any;
    email: any;
    mobile: any;
    district: any;
    state: any;
    fpc: any;
    farmer_code: any;
};
export declare function indexFarmer(farmer: any, address?: any, profile?: any): Promise<void>;
export declare function bulkIndexFarmers(farmers: any[]): Promise<void>;
export declare function searchFarmers(query: string, tenantId: string, page?: number, limit?: number): Promise<{
    hits: any[];
    total: any;
}>;
//# sourceMappingURL=elasticsearch.service.d.ts.map