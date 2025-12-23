// /actions/regions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { Region } from '@/lib/validations/region';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/actions/audit';

// CREATE
export async function createRegion(
  data: {
    name: string;
    code?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('regions')
      .insert({
        name: data.name.trim(),
        code: data.code || null,
      });

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Cette région existe déjà' };
      }
      throw error;
    }

    revalidatePath('/dashboard/regions');
    return { success: true };
  } catch (err) {
    console.error('Erreur création région:', err);
    return {
      success: false,
      error: 'Impossible de créer la région',
    };
  }
}

// READ ALL
export async function getRegions() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('regions')
    .select(`
      id,
      name,
      code,
      is_active,
      created_at,
      cities: cities ( count )
    `)
    .order('name')
    .eq('is_active', true);

  if (error) {
    console.error('Erreur récupération régions:', error);
    return [];
  }

  return data.map(region => ({
    ...region,
    _count: {
      cities: region.cities?.[0]?.count ?? 0,
    },
  }));
}


// READ ONE
export async function getRegionById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Erreur récupération région:', error);
    return null;
  }
  
  return data as Region;
}

// Update
export async function updateRegion(id: string, data: Pick<Region, 'name' | 'code'>): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('regions')
    .update(data)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erreur mise à jour région:', error);
    throw error;
  }
}

// DELETE
export async function disableRegion(id: string) {
  const supabase = await createClient();

  try {
    // Vérifier si la région a des villes actives
    const { count, error: countError } = await supabase
      .from('cities')
      .select('*', { count: 'exact', head: true })
      .eq('region_id', id)
      .eq('is_active', true);

    if (countError) throw countError;

    if (count && count > 0) {
      throw new Error(
        'Impossible de désactiver cette région : des villes actives y sont associées.'
      );
    }

    // Désactivation (soft delete)
    const { error } = await supabase
      .from('regions')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    // Audit log
    await logAuditEvent({
      eventType: 'REGION_DISABLED',
      targetTable: 'regions',
      targetRecordId: id,
    });

    revalidatePath('/dashboard/regions');

    return { success: true };
  } catch (error) {
    console.error('Erreur désactivation région:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}
