// actions/admin.ts
'use server';

import { Supabase as supabase } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * CRUD pour les paramètres système (point 126)
 */
export async function getSystemSettings(category?: string) {
  try {
    let query = supabase
      .from('system_settings')
      .select('*')
      .order('category')
      .order('key');
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erreur récupération settings:', error);
    return { success: false, error };
  }
}

export async function updateSystemSetting(
  key: string,
  value: string,
  userId: string
) {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .update({
        value,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('key', key)
      .select()
      .single();
    
    if (error) throw error;
    
    revalidatePath('/dashboard/admin/settings');
    return { success: true, data };
  } catch (error) {
    console.error('Erreur mise à jour setting:', error);
    return { success: false, error };
  }
}

/**
 * CRUD pour les jours fériés (point 125)
 */
export async function getHolidays(year?: number) {
  try {
    let query = supabase
      .from('holidays')
      .select(`
        *,
        region:regions(id, name)
      `)
      .order('date');
    
    if (year) {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      query = query.gte('date', startDate).lte('date', endDate);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erreur récupération jours fériés:', error);
    return { success: false, error };
  }
}

export async function createHoliday(holiday: any, userId: string) {
  try {
    const { data, error } = await supabase
      .from('holidays')
      .insert([{
        ...holiday,
        created_by: userId
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    revalidatePath('/dashboard/admin/holidays');
    return { success: true, data };
  } catch (error) {
    console.error('Erreur création jour férié:', error);
    return { success: false, error };
  }
}

/**
 * CRUD pour les SLA (point 124)
 */
export async function getServiceLevelAgreements() {
  try {
    const { data, error } = await supabase
      .from('service_level_agreements')
      .select('*')
      .order('service_type')
      .order('transit_time_days');
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erreur récupération SLA:', error);
    return { success: false, error };
  }
}

/**
 * CRUD pour les zones de service (point 123)
 */
export async function getServiceZones() {
  try {
    const { data, error } = await supabase
      .from('service_zones')
      .select(`
        *,
        region:regions(id, name)
      `)
      .order('code');
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erreur récupération zones:', error);
    return { success: false, error };
  }
}

/**
 * Gestion des utilisateurs (point 127)
 */
export async function getUsersForManagement() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        agency:agencies(name),
        is_active,
        created_at,
        users!inner (
          id,
          email,
          last_sign_in_at
        ),
        user_roles!inner (
          roles!inner (
            name
          )
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Transformer les données
    const users = data?.map(profile => ({
      id: profile.users.id,
      email: profile.users.email,
      full_name: profile.full_name,
      agency_name: profile.agency?.name || null,
      roles: profile.user_roles.map((ur: any) => ur.roles.name),
      is_active: profile.is_active,
      last_login: profile.users.last_sign_in_at,
      created_at: profile.created_at
    })) || [];
    
    return { success: true, data: users };
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    return { success: false, error };
  }
}

/**
 * Désactivation de compte (point 128)
 */
export async function toggleUserStatus(userId: string, isActive: boolean) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    revalidatePath('/dashboard/admin/users');
    return { success: true, data };
  } catch (error) {
    console.error('Erreur changement statut utilisateur:', error);
    return { success: false, error };
  }
}

/**
 * Réinitialisation d'accès (point 129)
 */
export async function resetUserPassword(userId: string) {
  try {
    // Note: Dans Supabase, la réinitialisation se fait via l'auth
    // On peut seulement déclencher le processus
    const { error } = await supabase.auth.admin.updateUserById(
      userId,
      { password: 'temporary123' } // Mot de passe temporaire
    );
    
    if (error) throw error;
    
    return { 
      success: true, 
      message: 'Mot de passe réinitialisé. L\'utilisateur doit se reconnecter.' 
    };
  } catch (error) {
    console.error('Erreur réinitialisation mot de passe:', error);
    return { success: false, error };
  }
}