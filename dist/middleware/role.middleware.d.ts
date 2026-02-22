import type { Request, Response, NextFunction } from 'express';
export declare function allowRoles(...allowedRoles: string[]): (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=role.middleware.d.ts.map