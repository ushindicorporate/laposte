import { Agency, AuthUser } from "./database";

// ROUTES
export type TransportType = 'ROAD' | 'RAIL' | 'AIR' | 'MARITIME' | string;
export type RouteFrequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'ON_DEMAND' | string;

export interface Route {
  id: string;
  code: string;
  name: string;
  origin_agency_id: string;
  destination_agency_id: string;
  distance_km?: number | null;
  estimated_duration_minutes?: number | null;
  transport_type: TransportType;
  frequency: RouteFrequency;
  departure_time?: string | null; // Format HH:MM:SS
  arrival_time?: string | null; // Format HH:MM:SS
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations
  origin_agency?: Agency;
  destination_agency?: Agency;
  created_by_user?: AuthUser;
  route_stops?: RouteStop[];
}

// ROUTE_STOPS
export interface RouteStop {
  id: string;
  route_id: string;
  agency_id: string;
  stop_order: number;
  estimated_arrival_minutes?: number | null;
  estimated_departure_minutes?: number | null;
  is_mandatory: boolean;
  notes?: string | null;
  created_at: string;
  
  // Relations
  route?: Route;
  agency?: Agency;
}

// Types pour les formulaires
export interface RouteFormData {
  code: string;
  name: string;
  origin_agency_id: string;
  destination_agency_id: string;
  distance_km?: number;
  estimated_duration_minutes?: number;
  transport_type: TransportType;
  frequency: RouteFrequency;
  departure_time?: string;
  arrival_time?: string;
  is_active?: boolean;
  route_stops?: Omit<RouteStop, 'id' | 'route_id' | 'created_at'>[];
}

// Types pour les réponses avec relations
export type RouteWithRelations = Route & {
  origin_agency: Agency;
  destination_agency: Agency;
  route_stops: (RouteStop & { agency: Agency })[];
};

export type RouteStopWithAgency = RouteStop & {
  agency: Agency;
};