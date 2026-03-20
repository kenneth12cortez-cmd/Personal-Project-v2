export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  college?: string;
  isEmployee?: boolean;
  createdAt: string;
}

export interface VisitorLog {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  reason: 'Research' | 'Study' | 'Relax' | 'Other';
  college: string;
  isEmployee: boolean;
  timestamp: string;
}
