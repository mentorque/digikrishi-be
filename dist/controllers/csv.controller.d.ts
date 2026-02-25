import type { Request, Response } from 'express';
/** Pre-signed URL for direct upload to S3. Frontend PUTs file to uploadUrl then calls POST /csv/upload with { key, fileName }. */
export declare function getPresignUrl(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/** Register an upload after frontend has PUT the file to S3. Body: { key, fileName }. */
export declare function upload(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function status(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=csv.controller.d.ts.map