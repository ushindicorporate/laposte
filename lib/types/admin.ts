// lib/types/admin.ts
export interface SystemSetting {
  id: string;
  category: string;
  key: string;
  value: string | null;
  description: string | null;
  data_type: 'string' | 'number' | 'boolean' | 'json';
  is_public: boolean;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'NATIONAL' | 'REGIONAL' | 'LOCAL';
  region_id: string | null;
  description: string | null;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
  
  // Relations
  region?: {
    id: string;
    name: string;
  };
}

export interface ServiceLevelAgreement {
  id: string;
  name: string;
  service_type: string;
  pickup_time_hours: number;
  processing_time_hours: number;
  transit_time_days: number;
  delivery_time_hours: number;
  delivery_success_rate: number;
  on_time_rate: number;
  late_delivery_compensation: number;
  lost_package_compensation: number;
  effective_date: string;
  expiration_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceZone {
  id: string;
  code: string;
  name: string;
  description: string | null;
  region_id: string | null;
  cities: any; // JSON
  available_services: string[];
  extra_delivery_days: number;
  has_surcharge: boolean;
  surcharge_amount: number;
  surcharge_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Relations
  region?: {
    id: string;
    name: string;
  };
}

export interface UserManagement {
  id: string;
  email: string;
  full_name: string | null;
  agency_name: string | null;
  roles: string[];
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}