// lib/types/delivery.ts
export interface DeliveryAttempt {
  id: string;
  shipment_id: string;
  attempt_number: number;
  attempted_at: string;
  attempted_by: string | null;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
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
  shipment?: {
    id: string;
    tracking_number: string;
    recipient_name: string;
    recipient_phone: string;
  };
}

export interface CreateDeliveryAttemptInput {
  shipment_id: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  failure_reason?: string;
  recipient_name?: string;
  recipient_relationship?: string;
  recipient_id_type?: string;
  recipient_id_number?: string;
  proof_urls?: string[];
  notes?: string;
  latitude?: number;
  longitude?: number;
}