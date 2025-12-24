// /lib/types/user.ts
import { User } from '@supabase/supabase-js';
import { Agency } from './agency';
import { Profile, Role, UserRole } from './database';

export interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
  avatar_url?: string;
  agency_id?: string;
  agency?: Agency; // Jointure
  roles: string[]; // Tableau de strings (ex: ['SUPER_ADMIN', 'AGENT'])
  is_active: boolean;
  created_at: string;
}

export interface UserData {
  user: User | null;
  userProfile: UserProfile | null;
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
