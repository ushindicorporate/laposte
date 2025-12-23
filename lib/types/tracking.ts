// lib/types/tracking.ts
export type TrackingEventType = 
  | 'SCANNED'          // Scanné
  | 'STATUS_CHANGED'   // Changement de statut
  | 'LOCATION_UPDATE'  // Mise à jour de localisation
  | 'DELIVERY_ATTEMPT' // Tentative de livraison
  | 'EXCEPTION'        // Exception/Problème
  | 'NOTE';           // Note ajoutée

export interface TrackingEvent {
  id: string;
  shipment_id: string;
  status: string; // Utilisez votre type ShipmentStatus existant
  event_type: TrackingEventType;
  location_agency_id: string | null;
  description: string | null;
  scanned_by: string | null;
  created_at: string;
  
  // Relations
  location_agency?: {
    id: string;
    name: string;
    code: string;
  };
  scanned_by_user?: {
    id: string;
    email: string;
    profiles?: {
      full_name: string;
    };
  };
}

export interface CreateTrackingEventInput {
  shipment_id: string;
  status: string;
  event_type: TrackingEventType;
  location_agency_id?: string;
  description?: string;
}