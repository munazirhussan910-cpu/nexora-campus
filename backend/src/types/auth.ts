import { Request } from 'express';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
  roleId: string;
  permissions: string[];
  studentId?: string;
  staffId?: string;
  rollNumber?: string;
  fullName?: string;
  department?: string;
  branch?: string;
  year?: number;
  hostelBlock?: string;
  roomNumber?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
