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
  employeeId?: string;
  fullName?: string;
  department?: string;
  designation?: string;
  specialization?: string;
  branch?: string;
  year?: number;
  hostelBlock?: string;
  roomNumber?: string;
  phone?: string;
  parentPhone?: string;
  bio?: string;
  profilePhotoUrl?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
