// /actions/regions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { regionSchema, RegionFormData } from '@/lib/validations/region';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/actions/audit';

// CREATE
export async function createRegion(formData: FormData) {
  const supabase = await createClient();
  
  try {
    const validatedData = regionSchema.parse({
      name: formData.get('name'),
      code: formData.get('code'),
    });
    
    const { data, error } = await supabase
      .from('regions')
      .insert({
        name: validatedData.name,
        code: validatedData.code || null,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Audit log
    await logAuditEvent({
      eventType: 'REGION_CREATED',
      targetTable: 'regions',
      targetRecordId: data.id,
      details: validatedData,
    });
    
    revalidatePath('/dashboard/regions');
    return { success: true, data };
  } catch (error) {
    console.error('Erreur création région:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

// READ ALL
export async function getRegions() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Erreur récupération régions:', error);
    return [];
  }
  
  return data;
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
  
  return data;
}

// UPDATE
export async function updateRegion(id: string, formData: FormData) {
  const supabase = await createClient();
  
  try {
    const validatedData = regionSchema.parse({
      name: formData.get('name'),
      code: formData.get('code'),
    });
    
    const { data, error } = await supabase
      .from('regions')
      .update({
        name: validatedData.name,
        code: validatedData.code || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Audit log
    await logAuditEvent({
      eventType: 'REGION_UPDATED',
      targetTable: 'regions',
      targetRecordId: id,
      details: validatedData,
    });
    
    revalidatePath('/dashboard/regions');
    return { success: true, data };
  } catch (error) {
    console.error('Erreur mise à jour région:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

// DELETE
export async function deleteRegion(id: string) {
  const supabase = await createClient();
  
  try {
    // Vérifier s'il y a des villes associées
    const { count } = await supabase
      .from('cities')
      .select('*', { count: 'exact', head: true })
      .eq('region_id', id);
    
    if (count && count > 0) {
      throw new Error('Impossible de supprimer : des villes sont associées à cette région');
    }
    
    const { error } = await supabase
      .from('regions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Audit log
    await logAuditEvent({
      eventType: 'REGION_DELETED',
      targetTable: 'regions',
      targetRecordId: id,
    });
    
    revalidatePath('/dashboard/regions');
    return { success: true };
  } catch (error) {
    console.error('Erreur suppression région:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}