import { AuthUser } from "@supabase/supabase-js";
import { City } from "./database";

// CLIENTS
export type CustomerType = 'PARTICULIER' | 'ENTREPRISE';
export type IDType = 'PASSPORT' | 'NATIONAL_ID' | 'DRIVER_LICENSE' | 'OTHER' | string;

export interface Customer {
  id: string;
  customer_type: CustomerType;
  customer_code: string;
  full_name: string;
  company_name?: string | null;
  email?: string | null;
  phone: string;
  address?: string | null; // Champ simple pour compatibilité
  tax_id?: string | null;
  id_type?: IDType | null;
  id_number?: string | null;
  is_active: boolean;
  notes?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at?: string | null;
  
  // Relations
  created_by_user?: AuthUser;
  updated_by_user?: AuthUser;
  addresses?: CustomerAddress[]; // Nouvelles adresses structurées
}

// ADRESSES CLIENTS
export type AddressType = 'PRINCIPALE' | 'LIVRAISON' | 'FACTURATION' | 'AUTRE';

export interface CustomerAddress {
  id: string;
  customer_id: string;
  address_type: AddressType;
  address_line1: string;
  address_line2?: string | null;
  city_id?: string | null;
  postal_code?: string | null;
  country: string;
  is_default: boolean;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations
  customer?: Customer;
  city?: City;
}

// Types pour les formulaires
export interface CustomerFormData {
  customer_type: CustomerType;
  full_name: string;
  company_name?: string;
  email?: string;
  phone: string;
  address?: string; // Pour compatibilité avec ancien formulaire
  tax_id?: string;
  id_type?: IDType;
  id_number?: string;
  is_active?: boolean;
  notes?: string;
  addresses?: CustomerAddressFormData[];
}

export interface CustomerAddressFormData {
  address_type: AddressType;
  address_line1: string;
  address_line2?: string;
  city_id?: string;
  postal_code?: string;
  country?: string;
  is_default?: boolean;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

// Types pour les réponses avec relations
export type CustomerWithRelations = Customer & {
  addresses: (CustomerAddress & { city?: City })[];
  created_by_user?: AuthUser;
};

export interface CustomerAddressWithCity {
  id: string;
  customer_id: string;
  address_type: 'PRINCIPALE' | 'LIVRAISON' | 'FACTURATION' | 'AUTRE';
  address_line1: string;
  address_line2: string | null;
  city_id: string | null;
  postal_code: string | null;
  country: string;
  is_default: boolean;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  city?: {
    id: string;
    name: string;
    region?: {
      id: string;
      name: string;
    };
  };
}

// Ajoutez ces types à votre fichier types

export type CustomerEventType = 
  | 'CREATED'          // Client créé
  | 'UPDATED'          // Information mise à jour
  | 'ADDRESS_ADDED'    // Nouvelle adresse ajoutée
  | 'ADDRESS_UPDATED'  // Adresse modifiée
  | 'ADDRESS_DELETED'  // Adresse supprimée
  | 'SHIPMENT_CREATED' // Nouvel envoi
  | 'SHIPMENT_PAID'    // Paiement effectué
  | 'SHIPMENT_DELIVERED' // Colis livré
  | 'SHIPMENT_FAILED'  // Livraison échouée
  | 'NOTE_ADDED'       // Note ajoutée
  | 'DOCUMENT_ADDED'   // Document ajouté
  | 'STATUS_CHANGED'   // Statut du client changé
  | 'CONTACTED'        // Contacté par téléphone/email
  | 'COMPLAINT'        // Plainte reçue
  | 'LOYALTY_UPDATE'   // Mise à jour programme fidélité
  | 'SYSTEM_EVENT';    // Événement système

export interface CustomerHistory {
  id: string;
  customer_id: string;
  event_type: CustomerEventType;
  event_description: string;
  user_id: string | null;
  user_name: string | null;
  ip_address: string | null;
  metadata: Record<string, any>;
  created_at: string;
  
  // Relations (optionnel)
  user?: {
    id: string;
    email: string;
    profiles?: {
      full_name: string;
    };
  };
}

// Interface pour créer un événement d'historique
export interface CreateCustomerHistoryInput {
  customer_id: string;
  event_type: CustomerEventType;
  event_description: string;
  metadata?: Record<string, any>;
  user_id?: string;
  user_name?: string;
  ip_address?: string;
}

// lib/types/customers.ts

// Types de recherche
export interface CustomerSearchFilters {
  query?: string;
  type?: CustomerType | 'all';
  agency_id?: string;
  city_id?: string;
  region_id?: string;
  created_start?: string;
  created_end?: string;
  has_shipments?: boolean;
  is_active?: boolean;
  sort_by?: 'name' | 'created_at' | 'shipment_count' | 'total_spent';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CustomerSearchResult {
  customers: Customer[];
  total_count: number;
  page: number;
  total_pages: number;
  filters: CustomerSearchFilters;
}

// Statistiques de recherche
export interface CustomerSearchStats {
  total_customers: number;
  total_particuliers: number;
  total_entreprises: number;
  avg_shipments_per_customer: number;
  top_city: string | null;
  top_region: string | null;
  last_30_days_new: number;
}

// Type pour les suggestions de recherche
export interface CustomerSuggestion {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  type: CustomerType;
  last_shipment_date: string | null;
  shipment_count: number;
}