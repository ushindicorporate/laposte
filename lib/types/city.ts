import { Region } from "../validations/region";

export interface City {
  id: string;
  name: string;
  region_id: string;
  postal_code: string | null;
  population: number | null;
  area_km2: number | null;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
  is_capital: boolean;
  economic_zone: 'URBAIN' | 'RURAL' | 'INDUSTRIEL' | 'COMMERCIAL' | 'AUTRE' | null;
  last_census_year: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  regions?: Region;
  agencies?: Array<{
    id: string;
    name: string;
    is_active: boolean;
  }>;
}

export interface CityWithRelations extends City {
  regions: Region;
  _count?: {
    agencies?: number;
  };
}

export interface CityFormData {
  name: string;
  region_id: string;
  postal_code?: string;
  population?: number;
  area_km2?: number;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  is_capital?: boolean;
  economic_zone?: 'URBAIN' | 'RURAL' | 'INDUSTRIEL' | 'COMMERCIAL' | 'AUTRE';
  last_census_year?: number;
  notes?: string;
}

export interface CityFilters {
  regionId?: string;
  search?: string;
  hasAgencies?: boolean;
  isCapital?: boolean;
  minPopulation?: number;
  maxPopulation?: number;
  orderBy?: keyof City;
  orderDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface CitiesPaginatedResponse {
  data: CityWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  regionCounts: Record<string, number>;
}

export interface CitiesStats {
  total: number;
  withAgencies: number;
  withCoordinates: number;
  coveragePercentage: number;
  largestCities: Array<{
    name: string;
    population: number;
    regions: { name: string } | null; // Peut être null si pas de région
  }>;
  regionDistribution: Array<{
    region_id: string;
    regions: { name: string } | null;
    count: number;
  }>;
  populationStats: {
    total: number;
    average: number;
    median: number;
  } | null;
}

// Ajouter ce type pour la réponse Supabase
export interface SupabaseCityResponse {
  id: string;
  name: string;
  population: number | null;
  latitude: number | null;
  longitude: number | null;
  regions: {
    name: string;
  }[]; // ← Supabase retourne un tableau même pour une relation simple
  agencies: Array<{
    id: string;
    name: string;
    is_active: boolean;
  }>;
}