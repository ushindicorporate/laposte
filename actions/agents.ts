'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ActionResponse, Agency, UserRole } from '@/lib/types/database';

// Interface pour un agent avec ses détails
export interface AgentWithDetails {
  id: string;
  email?: string;
  phone?: string;
  full_name?: string;
  is_active: boolean;
  agency_id?: string;
  created_at: string;
  roles: Array<{
    id: number;
    name: string;
  }>;
  agency?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

// Récupérer tous les agents d'une agence
export async function getAgentsByAgency(agencyId: string): Promise<ActionResponse<AgentWithDetails[]>> {
  try {
    const supabase = await createClient();
    
    // Récupérer les profils de l'agence avec leurs rôles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles (
          roles (
            id,
            name
          )
        )
      `)
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Pour chaque profil, récupérer l'email de l'utilisateur
    const agentsWithDetails: AgentWithDetails[] = [];
    
    for (const profile of profiles) {
      // Récupérer l'utilisateur associé
      const { data: user } = await supabase.auth.admin.getUserById(profile.id);
      
      // Récupérer l'agence si elle existe
      let agency = null;
      if (profile.agency_id) {
        const { data: agencyData } = await supabase
          .from('agencies')
          .select('id, name, code')
          .eq('id', profile.agency_id)
          .single();
        agency = agencyData as Agency;
      }

      agentsWithDetails.push({
        id: profile.id,
        email: user?.user?.email,
        phone: profile.phone || user?.user?.phone,
        full_name: profile.full_name,
        is_active: profile.is_active,
        agency_id: profile.agency_id,
        created_at: profile.created_at,
        roles: profile.user_roles?.map((ur: UserRole) => ur.roles) || [],
        agency
      });
    }

    return { success: true, data: agentsWithDetails };
  } catch (error: any) {
    console.error('Error fetching agents:', error);
    return { success: false, error: error.message };
  }
}

// Assigner un agent à une agence
export async function assignAgentToAgency(
  userId: string, 
  agencyId: string
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient();
    
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) throw new Error('Non authentifié');

    // Vérifier que l'agence existe
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id')
      .eq('id', agencyId)
      .single();

    if (agencyError || !agency) {
      throw new Error('Agence non trouvée');
    }

    // Mettre à jour le profil de l'utilisateur
    const { error } = await supabase
      .from('profiles')
      .update({ 
        agency_id: agencyId,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    // Audit log
    try {
      await supabase.from('audit_logs').insert([{
        user_id: currentUser.id,
        event_type: 'AGENT_ASSIGNED',
        target_table: 'profiles',
        target_record_id: userId,
        details: { agency_id: agencyId },
      }]);
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError);
    }

    revalidatePath('/dashboard/agencies/[id]', 'page');
    return { success: true };
  } catch (error: any) {
    console.error('Error assigning agent:', error);
    return { success: false, error: error.message };
  }
}

// Retirer un agent d'une agence
export async function removeAgentFromAgency(userId: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient();
    
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) throw new Error('Non authentifié');

    const { error } = await supabase
      .from('profiles')
      .update({ 
        agency_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    // Audit log
    try {
      await supabase.from('audit_logs').insert([{
        user_id: currentUser.id,
        event_type: 'AGENT_REMOVED',
        target_table: 'profiles',
        target_record_id: userId,
        details: { agency_id: null },
      }]);
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError);
    }

    revalidatePath('/dashboard/agencies/[id]', 'page');
    return { success: true };
  } catch (error: any) {
    console.error('Error removing agent:', error);
    return { success: false, error: error.message };
  }
}

// Récupérer les agents disponibles (sans agence)
export async function getAvailableAgents(): Promise<ActionResponse<AgentWithDetails[]>> {
  try {
    const supabase = await createClient();
    
    // Récupérer les profils sans agence
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles (
          roles (
            id,
            name
          )
        )
      `)
      .is('agency_id', null)
      .eq('is_active', true)
      .order('full_name');

    if (error) throw error;

    const agentsWithDetails: AgentWithDetails[] = [];
    
    for (const profile of profiles) {
      const { data: user } = await supabase.auth.admin.getUserById(profile.id);
      
      agentsWithDetails.push({
        id: profile.id,
        email: user?.user?.email,
        phone: profile.phone || user?.user?.phone,
        full_name: profile.full_name,
        is_active: profile.is_active,
        agency_id: profile.agency_id,
        created_at: profile.created_at,
        roles: profile.user_roles?.map((ur: UserRole) => ur.roles) || [],
      });
    }

    return { success: true, data: agentsWithDetails };
  } catch (error: any) {
    console.error('Error fetching available agents:', error);
    return { success: false, error: error.message };
  }
}