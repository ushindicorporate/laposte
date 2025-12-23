// /actions/cities.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { citySchema, CityFormData } from '@/lib/validations/city';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/actions/audit';

// CREATE
export async function createCity(formData: FormData) {
  const supabase = await createClient();
  
  try {
    const validatedData = citySchema.parse({
      name: formData.get('name'),
      region_id: formData.get('region_id'),
      postal_code: formData.get('postal_code'),
      population: formData.get('population') ? Number(formData.get('population')) : undefined,
    });
    
    const { data, error } = await supabase
      .from('cities')
      .insert({
        name: validatedData.name,
        region_id: validatedData.region_id,
        postal_code: validatedData.postal_code || null,
        population: validatedData.population || null,
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
    
    revalidatePath('/dashboard/cities');
    revalidatePath('/dashboard/regions');
    return { success: true, data };
  } catch (error) {
    console.error('Erreur création ville:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

// READ ALL avec relations
export async function getCities() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('cities')
    .select(`
      *,
      regions (
        id,
        name
      )
    `)
    .order('name');
  
  if (error) {
    console.error('Erreur récupération villes:', error);
    return [];
  }
  
  return data;
}

// READ ALL par région
export async function getCitiesByRegion(regionId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('cities')
    .select(`
      *,
      regions (
        id,
        name
      )
    `)
    .eq('region_id', regionId)
    .order('name');
  
  if (error) {
    console.error('Erreur récupération villes par région:', error);
    return [];
  }
  
  return data;
}

// READ ONE
export async function getCityById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('cities')
    .select(`
      *,
      regions (
        id,
        name
      )
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Erreur récupération ville:', error);
    return null;
  }
  
  return data;
}

// UPDATE
export async function updateCity(id: string, formData: FormData) {
  const supabase = await createClient();
  
  try {
    const validatedData = citySchema.parse({
      name: formData.get('name'),
      region_id: formData.get('region_id'),
      postal_code: formData.get('postal_code'),
      population: formData.get('population') ? Number(formData.get('population')) : undefined,
    });
    
    const { data, error } = await supabase
      .from('cities')
      .update({
        name: validatedData.name,
        region_id: validatedData.region_id,
        postal_code: validatedData.postal_code || null,
        population: validatedData.population || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
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
      eventType: 'CITY_UPDATED',
      targetTable: 'cities',
      targetRecordId: id,
      details: validatedData,
    });
    
    revalidatePath('/dashboard/cities');
    revalidatePath('/dashboard/regions');
    return { success: true, data };
  } catch (error) {
    console.error('Erreur mise à jour ville:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

// DELETE
export async function deleteCity(id: string) {
  const supabase = await createClient();
  
  try {
    // Vérifier s'il y a des agences associées
    const { count } = await supabase
      .from('agencies')
      .select('*', { count: 'exact', head: true })
      .eq('city_id', id);
    
    if (count && count > 0) {
      throw new Error('Impossible de supprimer : des agences sont associées à cette ville');
    }
    
    const { error } = await supabase
      .from('cities')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Audit log
    await logAuditEvent({
      eventType: 'CITY_DELETED',
      targetTable: 'cities',
      targetRecordId: id,
    });
    
    revalidatePath('/dashboard/cities');
    revalidatePath('/dashboard/regions');
    return { success: true };
  } catch (error) {
    console.error('Erreur suppression ville:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

// GET REGIONS pour les formulaires
export async function getRegionsForSelect() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('regions')
    .select('id, name')
    .order('name');
  
  if (error) {
    console.error('Erreur récupération régions:', error);
    return [];
  }
  
  return data;
}