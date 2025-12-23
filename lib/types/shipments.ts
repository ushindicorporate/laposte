// lib/types/shipments.ts

import { Agency } from "./agency";
import { Customer } from "./customers";
import { Transaction } from "./database";

// Types de base
export type ShipmentType = 'PARCEL' | 'DOCUMENT' | 'EXPRESS' | 'ECONOMY' | 'INTERNATIONAL';
export type ShipmentStatus = 
  | 'CREATED'
  | 'RECEIVED'
  | 'IN_TRANSIT'
  | 'ARRIVED_AT_DESTINATION'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED_DELIVERY'
  | 'RETURNED'
  | 'CANCELLED'
  | 'ON_HOLD';

export type PaymentMethod = 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CHECK' | 'CREDIT';
export type PackageType = 'ENVELOPE' | 'PACKAGE' | 'BOX' | 'PALLET' | 'TUBE';

// Interfaces principales
export interface Shipment {
  id: string;
  tracking_number: string;
  customer_id: string | null;
  service_id: string | null;
  
  // Informations expéditeur
  sender_name: string;
  sender_phone: string;
  sender_address: string | null;
  
  // Informations destinataire
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string | null;
  
  // Logistique
  origin_agency_id: string | null;
  destination_agency_id: string | null;
  current_agency_id: string | null;
  reference: string | null;
  
  // Caractéristiques
  type: ShipmentType;
  weight_kg: number | null;
  dimensions: string | null;
  volume_cm3: number | null;
  package_count: number;
  declared_value: number;
  
  // Assurance
  insurance_amount: number;
  insurance_rate: number;
  
  // Instructions spéciales
  requires_signature: boolean;
  is_fragile: boolean;
  is_perishable: boolean;
  is_dangerous: boolean;
  special_instructions: string | null;
  
  // Douane
  customs_declaration: Record<string, any> | null;
  
  // Prix et paiement
  price: number;
  payment_method: PaymentMethod | null;
  is_paid: boolean;
  
  // Statut et dates
  status: ShipmentStatus;
  estimated_delivery_date: string | null;
  actual_delivery_date: string | null;
  
  // Preuves de livraison
  delivery_proof_url: string | null;
  signature_url: string | null;
  delivery_notes: string | null;
  
  // Métadonnées
  created_by: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations
  customer?: Customer;
  service?: ShipmentService;
  origin_agency?: Agency;
  destination_agency?: Agency;
  current_agency?: Agency;
  items?: ShipmentItem[];
  status_history?: ShipmentStatusHistory[];
  tracking_events?: TrackingEvent[];
  transactions?: Transaction[];
  delivery_attempts?: DeliveryAttempt[];
}

export interface ShipmentItem {
  id: string;
  shipment_id: string;
  description: string;
  package_type: PackageType;
  quantity: number;
  weight_kg: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  declared_value: number | null;
  customs_description: string | null;
  hs_code: string | null;
  is_fragile: boolean;
  is_perishable: boolean;
  is_dangerous: boolean;
  special_instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShipmentService {
  id: string;
  code: string;
  name: string;
  description: string | null;
  service_type: ShipmentType;
  base_price: number;
  price_per_kg: number | null;
  min_weight_kg: number;
  max_weight_kg: number | null;
  transit_time_days: number | null;
  is_active: boolean;
  requires_signature: boolean;
  has_insurance: boolean;
  insurance_rate: number;
  created_at: string;
  updated_at: string;
}

export interface ShipmentStatusHistory {
  id: string;
  shipment_id: string;
  status: ShipmentStatus;
  previous_status: ShipmentStatus | null;
  location_agency_id: string | null;
  scanned_by: string | null;
  notes: string | null;
  event_timestamp: string;
  created_at: string;
  
  // Relations
  location_agency?: Agency;
  scanned_by_user?: {
    id: string;
    email: string;
    profiles?: {
      full_name: string;
    };
  };
}

export interface TrackingEvent {
  id: string;
  shipment_id: string;
  status: ShipmentStatus;
  location_agency_id: string | null;
  description: string | null;
  scanned_by: string | null;
  created_at: string;
  
  // Relations
  location_agency?: Agency;
  scanned_by_user?: {
    id: string;
    email: string;
    profiles?: {
      full_name: string;
    };
  };
}

export interface DeliveryAttempt {
  id: string;
  shipment_id: string;
  attempt_number: number;
  attempted_at: string;
  attempted_by: string | null;
  status: ShipmentStatus;
  failure_reason: string | null;
  recipient_name: string | null;
  recipient_relationship: string | null;
  recipient_id_type: string | null;
  recipient_id_number: string | null;
  proof_urls: string[];
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  
  // Relations
  attempted_by_user?: {
    id: string;
    email: string;
    profiles?: {
      full_name: string;
    };
  };
}

// Types pour la création/mise à jour
export interface CreateShipmentInput {
  customer_id?: string;
  service_id: string;
  
  sender_name: string;
  sender_phone: string;
  sender_address?: string;
  
  recipient_name: string;
  recipient_phone: string;
  recipient_address?: string;
  
  origin_agency_id: string;
  destination_agency_id: string;
  reference?: string;
  
  type: ShipmentType;
  weight_kg?: number;
  dimensions?: string;
  package_count?: number;
  declared_value?: number;
  
  requires_signature?: boolean;
  is_fragile?: boolean;
  is_perishable?: boolean;
  is_dangerous?: boolean;
  special_instructions?: string;
  
  items?: Array<{
    description: string;
    package_type?: PackageType;
    quantity?: number;
    weight_kg?: number;
    length_cm?: number;
    width_cm?: number;
    height_cm?: number;
    declared_value?: number;
    is_fragile?: boolean;
    is_perishable?: boolean;
    is_dangerous?: boolean;
    special_instructions?: string;
  }>;
}

export interface UpdateShipmentStatusInput {
  status: ShipmentStatus;
  location_agency_id?: string;
  notes?: string;
}

// Types pour les filtres de recherche
export interface ShipmentSearchFilters {
  tracking_number?: string;
  customer_id?: string;
  customer_name?: string;
  sender_phone?: string;
  recipient_phone?: string;
  status?: ShipmentStatus | ShipmentStatus[];
  type?: ShipmentType | ShipmentType[];
  origin_agency_id?: string;
  destination_agency_id?: string;
  current_agency_id?: string;
  created_start?: string;
  created_end?: string;
  estimated_delivery_start?: string;
  estimated_delivery_end?: string;
  has_payment?: boolean;
  sort_by?: 'created_at' | 'estimated_delivery_date' | 'price' | 'weight_kg';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}