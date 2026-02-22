export declare function getSummary(tenantId: string | null): Promise<{
    total_farmers: any;
    activated_percent: number;
    kyc_completion_percent: number;
}>;
export declare function getByDistrict(tenantId: string | null): Promise<any[]>;
export declare function getByState(tenantId: string | null): Promise<any[]>;
export declare function getByAgent(tenantId: string | null): Promise<any[]>;
export declare function getBySocialCategory(tenantId: string | null): Promise<any[]>;
//# sourceMappingURL=analytics.service.d.ts.map