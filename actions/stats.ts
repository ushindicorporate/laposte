// /actions/stats.ts
'use server';

import { createClient } from '@/lib/supabase/server';

export interface GeographicStats {
  regions: {
    total: number;
    withCities: number;
  };
  cities: {
    total: number;
    withAgencies: number;
    averagePerRegion: number;
  };
  agencies: {
    total: number;
    active: number;
    averagePerCity: number;
    byRegion: Array<{
      region_id: string;
      region_name: string;
      count: number;
    }>;
  };
}

export async function getGeographicStats(): Promise<GeographicStats> {
  const supabase = await createClient();
  
  // Récupérer toutes les données en parallèle
  const [
    regionsResult,
    citiesResult,
    agenciesResult,
    agenciesByRegionResult
  ] = await Promise.all([
    supabase.from('regions').select('id, name, cities(id)'),
    supabase.from('cities').select('id, name, region_id, agencies(id)'),
    supabase.from('agencies').select('id, name, city_id, is_active'),
    supabase.rpc('get_agencies_by_region')
  ]);
  
  const regions = regionsResult.data || [];
  const cities = citiesResult.data || [];
  const agencies = agenciesResult.data || [];
  const agenciesByRegion = agenciesByRegionResult.data || [];
  
  // Calculer les statistiques
  const stats: GeographicStats = {
    regions: {
      total: regions.length,
      withCities: regions.filter(r => r.cities && r.cities.length > 0).length
    },
    cities: {
      total: cities.length,
      withAgencies: cities.filter(c => c.agencies && c.agencies.length > 0).length,
      averagePerRegion: regions.length > 0 ? Number((cities.length / regions.length).toFixed(1)) : 0
    },
    agencies: {
      total: agencies.length,
      active: agencies.filter(a => a.is_active).length,
      averagePerCity: cities.length > 0 ? Number((agencies.length / cities.length).toFixed(1)) : 0,
      byRegion: agenciesByRegion.map((item: any) => ({
        region_id: item.region_id,
        region_name: item.region_name,
        count: item.agency_count
      }))
    }
  };
  
  return stats;
}

// Fonction RPC à créer dans Supabase
/*
CREATE OR REPLACE FUNCTION get_agencies_by_region()
RETURNS TABLE (
  region_id UUID,
  region_name TEXT,
  agency_count BIGINT
) 
LANGUAGE SQL
AS $$
  SELECT 
    r.id as region_id,
    r.name as region_name,
    COUNT(a.id) as agency_count
  FROM regions r
  LEFT JOIN cities c ON c.region_id = r.id
  LEFT JOIN agencies a ON a.city_id = c.id AND a.is_active = true
  GROUP BY r.id, r.name
  ORDER BY COUNT(a.id) DESC;
$$;
*/