export declare function createJob(tenantId: string, fileName: string, options?: {
    totalRows?: number;
    s3Key?: string;
}): Promise<import("sequelize").Model<any, any>>;
export declare function getJobStatus(jobId: string, tenantId: string): Promise<import("sequelize").Model<any, any>>;
export declare function incrementJobCounts(jobId: string, successDelta?: number, failedDelta?: number): Promise<void>;
export declare function setJobCompleted(jobId: string): Promise<void>;
export declare function setJobFailed(jobId: string): Promise<void>;
//# sourceMappingURL=csv.service.d.ts.map