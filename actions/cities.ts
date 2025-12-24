'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/actions/audit';
import { CityFormData, citySchema } from '@/lib/validations/city';

export async function createCity(formData: FormData) {
  const supabase = await createClient();

  try {
    // Validation côté serveur
    const validatedData: CityFormData = citySchema.parse({
      name: formData.get('name'),
      region_id: formData.get('region_id'),
      postal_code: formData.get('postal_code') || null,
      population: formData.get('population') ? Number(formData.get('population')) : null,
      area_km2: formData.get('area_km2') ? Number(formData.get('area_km2')) : null,
      timezone: formData.get('timezone') || 'Africa/Lubumbashi',
      latitude: formData.get('latitude') ? Number(formData.get('latitude')) : null,
      longitude: formData.get('longitude') ? Number(formData.get('longitude')) : null,
      is_capital: formData.get('is_capital') === 'true',
      economic_zone: formData.get('economic_zone') || null,
      notes: formData.get('notes') || null,
    });

    const { data, error } = await supabase
      .from('cities')
      .insert({
        name: validatedData.name,
        region_id: validatedData.region_id,
        postal_code: validatedData.postal_code,
        population: validatedData.population,
        area_km2: validatedData.area_km2,
        timezone: validatedData.timezone,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        is_capital: validatedData.is_capital,
        economic_zone: validatedData.economic_zone,
        notes: validatedData.notes,
      })
      .select(`
        *,
        regions (
          id,
          name
        )
      `)
      .single();

    if (error) throw error;

    // Audit log
    await logAuditEvent({
      eventType: 'CITY_CREATED',
      targetTable: 'cities',
      targetRecordId: data.id,
      details: validatedData,
    });

    // Revalidation cache
    revalidatePath('/dashboard/cities');
    revalidatePath('/dashboard/regions');

    return { success: true, data };
  } catch (err) {
    console.error('Erreur création ville:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Erreur inconnue' };
  }
}

export async function getCitiesPaginated(page = 1, pageSize = 20, filters?: {
  regionId?: string;
  search?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from('cities')
    .select(`*, regions(id, name)`, { count: 'exact' })
    .order('name');

  if (filters?.regionId) query = query.eq('region_id', filters.regionId);
  if (filters?.search) query = query.ilike('name', `%${filters.search}%`);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query.range(from, to);

  if (error) return { data: [], total: 0, pageSize };

  return { data, total: count || 0, pageSize };
}

export async function getRegionsForSelect() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('regions')
    .select('id, name')
    .order('name');

  if (error) return [];
  return data;
}
