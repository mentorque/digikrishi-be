import type { Model } from 'sequelize';

export type UserRole = 'TENANT' | 'FIELD_OFFICER' | 'FARMER';

export interface AuthUser extends Model {
  id: string;
  tenant_id: string | null;
  role: UserRole;
  email: string | null;
  mobile: string | null;
  is_active: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
