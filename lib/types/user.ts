// /lib/types/user.ts
import { Profile, Role, UserRole } from './database';

export interface User {
  id: string;
  email?: string | null;
  phone?: string | null;
  created_at: string;
  last_sign_in_at?: string | null;
  profile?: Profile | null;
  roles: Role[];
  user_roles?: UserRole[];
}

export interface UserSession {
  user: User;
  access_token: string;
  expires_at: number;
}

export interface LoginCredentials {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterData {
  email?: string;
  phone?: string;
  password: string;
  full_name: string;
  agency_id?: string;
  role_id: number;
}

export interface UpdateProfileData {
  full_name?: string;
  phone?: string;
  agency_id?: string;
  is_active?: boolean;
}