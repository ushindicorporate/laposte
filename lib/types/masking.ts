// lib/types/masking.ts
export type FieldType = 'PHONE' | 'EMAIL' | 'ADDRESS' | 'TAX_ID' | 'PERSONAL_ID' | 'OTHER';
export type AccessType = 'VIEW' | 'EDIT' | 'EXPORT' | 'API';
export type MaskPattern = 'full' | 'partial' | 'hash' | 'none';

export interface SensitiveField {
  id: string;
  table_name: string;
  field_name: string;
  field_type: FieldType;
  mask_pattern: MaskPattern;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface MaskingPermission {
  id: string;
  role_id: number;
  sensitive_field_id: string;
  can_view_full: boolean;
  can_view_partial: boolean;
  can_edit: boolean;
  created_at: string;
  
  // Relations
  sensitive_field?: SensitiveField;
  role?: {
    id: number;
    name: string;
  };
}

export interface SensitiveDataAccessLog {
  id: string;
  user_id: string;
  customer_id: string | null;
  sensitive_field_id: string | null;
  access_type: AccessType;
  ip_address: string | null;
  user_agent: string | null;
  accessed_at: string;
  
  // Relations
  user?: {
    id: string;
    email: string;
    profiles?: {
      full_name: string;
    };
  };
  customer?: {
    id: string;
    name: string;
  };
  sensitive_field?: SensitiveField;
}

export interface UserMaskingPermissions {
  userId: string;
  roleIds: number[];
  permissions: {
    [fieldKey: string]: {
      canViewFull: boolean;
      canViewPartial: boolean;
      canEdit: boolean;
    };
  };
}

export interface MaskingOptions {
  maskPhone?: boolean;
  maskEmail?: boolean;
  maskAddress?: boolean;
  maskTaxId?: boolean;
  userPermissions?: UserMaskingPermissions;
  logAccess?: boolean;
}