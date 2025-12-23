// /lib/types/database.ts

// Types génériques pour les timestamps
export interface Timestamps {
  created_at: string;
  updated_at?: string | null;
}

// Types pour les tables principales

// AUTH TABLES (Supabase Auth)
export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at?: string;
  last_sign_in_at?: string;
}

// REGIONS
export interface Region {
  id: string;
  name: string;
  created_at: string;
}

// CITIES
export interface City {
  id: string;
  region_id: string;
  name: string;
  created_at: string;
  regions?: Region;
}

// AGENCIES
export interface Agency {
  id: string;
  city_id: string;
  code: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  manager_id?: string | null;  // Référence à auth.users
  manager_name?: string | null; // À ajouter si nécessaire
  opening_hours?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
  cities?: City;
  _count?: {
    profiles: number;
    shipments_origin: number;
    shipments_destination: number;
  };
}

// PROFILES (Extension de Auth User)
export interface Profile {
  id: string; // Même ID que auth.users.id
  full_name?: string | null;
  agency_id?: string | null;
  phone?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
  agency?: Agency;
  user_roles?: UserRole[];
}

// ROLES
export interface Role {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
}

// USER_ROLES (Table de jonction)
export interface UserRole {
  user_id: string;
  role_id: number;
  created_at?: string;
  roles?: Role;
  profiles?: Profile;
}

// CUSTOMERS
export interface Customer {
  id: string;
  type: 'PARTICULIER' | 'ENTREPRISE' | string;
  name: string;
  email?: string | null;
  phone: string;
  address?: string | null;
  tax_id?: string | null;
  created_by?: string | null;
  created_at: string;
  created_by_user?: AuthUser;
}

// SHIPMENTS
export type ShipmentType = 'PARCEL' | 'DOCUMENT' | 'LETTER' | string;
export type ShipmentStatus = 'CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED' | 'LOST' | string;

export interface Shipment {
  id: string;
  tracking_number: string;
  sender_name: string;
  sender_phone: string;
  sender_address?: string | null;
  recipient_name: string;
  recipient_phone: string;
  recipient_address?: string | null;
  origin_agency_id?: string | null;
  destination_agency_id?: string | null;
  current_agency_id?: string | null;
  type: ShipmentType;
  weight_kg?: number | null;
  price?: number | null;
  status: ShipmentStatus;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations
  origin_agency?: Agency;
  destination_agency?: Agency;
  current_agency?: Agency;
  created_by_user?: AuthUser;
  tracking_events?: TrackingEvent[];
  transactions?: Transaction[];
}

// TRACKING_EVENTS
export interface TrackingEvent {
  id: string;
  shipment_id: string;
  status: ShipmentStatus;
  location_agency_id?: string | null;
  description?: string | null;
  scanned_by?: string | null;
  created_at: string;
  
  // Relations
  shipment?: Shipment;
  location_agency?: Agency;
  scanned_by_user?: AuthUser;
}

// TRANSACTIONS
export type PaymentMethod = 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CARD' | string;

export interface Transaction {
  id: string;
  shipment_id?: string | null;
  agency_id?: string | null;
  amount: number;
  currency: string;
  method: PaymentMethod;
  description?: string | null;
  created_by?: string | null;
  created_at: string;
  
  // Relations
  shipment?: Shipment;
  agency?: Agency;
  created_by_user?: AuthUser;
}

// AUDIT_LOGS
export interface AuditLog {
  id: number;
  event_timestamp: string;
  user_id?: string | null;
  user_profile_id?: string | null;
  event_type: string;
  target_table?: string | null;
  target_record_id?: string | null;
  details?: any; // JSONB
  ip_address?: string | null;
  user_agent?: string | null;
  
  // Relations
  user?: AuthUser;
  user_profile?: Profile;
}

// TYPES POUR LES RÉPONSES DES ACTIONS
export interface ActionResponse<T = any> {
  success: boolean;
  error?: string;
  data?: T;
}

// TYPES POUR LES FORMULAIRES
export interface AgencyFormData {
  name: string;
  code: string;
  city_id: string;
  address?: string;
  phone?: string;
  email?: string;
  manager_name?: string; // Temporaire
  opening_hours?: string;
  latitude?: number;
  longitude?: number;
}

// TYPES POUR LES UTILISATEURS AVEC RÔLES
export interface UserWithRoles {
  id: string;
  email?: string;
  phone?: string;
  profile?: Profile;
  roles: Role[];
  is_active: boolean;
}

// TYPES POUR LES STATISTIQUES
export interface AgencyStats {
  total: number;
  active: number;
  inactive: number;
  withGPS: number;
  withManager: number;
  byRegion: Array<{
    id: string;
    name: string;
    count: number;
  }>;
}

// TYPES POUR LES FILTRES
export interface AgencyFilters {
  region_id?: string;
  city_id?: string;
  is_active?: boolean;
  search?: string;
}

// TYPES POUR LES RÔLES SPÉCIFIQUES (basés sur votre roadmap)
export type SystemRole = 
  | 'superadmin'
  | 'regional'
  | 'agency'
  | 'agent'
  | 'finance'
  | 'customer';

export interface UserPermissions {
  canManageAgencies: boolean;
  canManageUsers: boolean;
  canManageShipments: boolean;
  canManageFinance: boolean;
  canViewReports: boolean;
  canManageRegions: boolean;
  canManageCities: boolean;
}

// Fonction pour mapper les rôles aux permissions
export function getPermissionsForRole(roleName: SystemRole): UserPermissions {
  const basePermissions = {
    canManageAgencies: false,
    canManageUsers: false,
    canManageShipments: false,
    canManageFinance: false,
    canViewReports: false,
    canManageRegions: false,
    canManageCities: false,
  };

  switch (roleName) {
    case 'superadmin':
      return {
        ...basePermissions,
        canManageAgencies: true,
        canManageUsers: true,
        canManageShipments: true,
        canManageFinance: true,
        canViewReports: true,
        canManageRegions: true,
        canManageCities: true,
      };
      
    case 'regional':
      return {
        ...basePermissions,
        canManageAgencies: true,
        canManageUsers: true,
        canManageShipments: true,
        canViewReports: true,
        canManageRegions: false,
        canManageCities: true,
      };
      
    case 'agency':
      return {
        ...basePermissions,
        canManageAgencies: false,
        canManageUsers: true,
        canManageShipments: true,
        canViewReports: true,
        canManageRegions: false,
        canManageCities: false,
      };
      
    case 'agent':
      return {
        ...basePermissions,
        canManageAgencies: false,
        canManageUsers: false,
        canManageShipments: true,
        canViewReports: false,
        canManageRegions: false,
        canManageCities: false,
      };
      
    case 'finance':
      return {
        ...basePermissions,
        canManageAgencies: false,
        canManageUsers: false,
        canManageShipments: false,
        canManageFinance: true,
        canViewReports: true,
        canManageRegions: false,
        canManageCities: false,
      };
      
    case 'customer':
      return {
        ...basePermissions,
        canManageAgencies: false,
        canManageUsers: false,
        canManageShipments: false,
        canViewReports: false,
        canManageRegions: false,
        canManageCities: false,
      };
      
    default:
      return basePermissions;
  }
}

// Types pour les sélections Supabase (utiles pour les queries)
export type AgencyWithRelations = Agency & {
  cities?: (City & { regions: Region }) | null;
  _count?: {
    profiles: number;
    shipments_origin: number;
    shipments_destination: number;
  };
};

export type ProfileWithRelations = Profile & {
  agency: Agency | null;
  user_roles: (UserRole & { roles: Role })[];
};

export type UserRoleWithRelations = UserRole & {
  roles: Role;
  profiles: Profile;
};