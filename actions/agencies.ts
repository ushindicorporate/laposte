'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { agencySchema, AgencyFormData } from '@/lib/validations/agency';
import { 
  Agency, 
  AgencyWithRelations, 
  ActionResponse, 
  Region, 
  City, 
  Profile,
  AuditLog,
  Shipment,
  SystemRole,
  getPermissionsForRole
} from '@/lib/types/database';

// Récupérer toutes les agences avec statistiques
export async function getAgencies(): Promise<ActionResponse<AgencyWithRelations[]>> {
  try {
    const supabase = await createClient();
    
    // 1. Récupérer les agences avec les villes et régions
    const { data: agencies, error: agenciesError } = await supabase
      .from('agencies')
      .select(`
        *,
        cities (
          id,
          name,
          regions (
            id,
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (agenciesError) throw agenciesError;

    // 2. Récupérer les comptes d'utilisateurs par agence
    const { data: profilesByAgency, error: profilesError } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('is_active', true);

    if (profilesError) console.warn('Error fetching profiles:', profilesError);

    // 3. Récupérer les comptes d'envois par agence (origine)
    const { data: shipmentsOrigin, error: shipmentsOriginError } = await supabase
      .from('shipments')
      .select('origin_agency_id');

    if (shipmentsOriginError) console.warn('Error fetching origin shipments:', shipmentsOriginError);

    // 4. Récupérer les comptes d'envois par agence (destination)
    const { data: shipmentsDestination, error: shipmentsDestinationError } = await supabase
      .from('shipments')
      .select('destination_agency_id');

    if (shipmentsDestinationError) console.warn('Error fetching destination shipments:', shipmentsDestinationError);

    // Compter les associations
    const countByAgency = (data: any[], key: string): Record<string, number> => {
      const counts: Record<string, number> = {};
      data?.forEach(item => {
        const agencyId = item[key];
        if (agencyId) {
          counts[agencyId] = (counts[agencyId] || 0) + 1;
        }
      });
      return counts;
    };

    const profileCounts: Record<string, number> = countByAgency(profilesByAgency || [], 'agency_id');
    const originShipmentCounts: Record<string, number> = countByAgency(shipmentsOrigin || [], 'origin_agency_id');
    const destinationShipmentCounts: Record<string, number> = countByAgency(shipmentsDestination || [], 'destination_agency_id');

    // Transformer les données pour inclure les comptes
    const transformedData: AgencyWithRelations[] = agencies.map(agency => ({
      ...agency as Agency,
      _count: {
        profiles: profileCounts[agency.id] || 0,
        shipments_origin: originShipmentCounts[agency.id] || 0,
        shipments_destination: destinationShipmentCounts[agency.id] || 0,
      }
    }));

    return { success: true, data: transformedData };
  } catch (error: any) {
    console.error('Error fetching agencies:', error);
    return { success: false, error: error.message };
  }
}

// Interface pour la hiérarchie géographique
interface RegionWithCities extends Region {
  cities: City[];
}

// Récupérer la hiérarchie géographique (régions avec villes)
export async function getGeographicHierarchy(): Promise<ActionResponse<RegionWithCities[]>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('regions')
      .select(`
        id,
        name,
        cities (
          id,
          name
        )
      `)
      .order('name');

    if (error) throw error;
    return { success: true, data: data as RegionWithCities[] };
  } catch (error: any) {
    console.error('Error fetching geographic hierarchy:', error);
    return { success: false, error: error.message };
  }
}

// Interface pour l'agence avec détails
interface AgencyWithDetails extends Agency {
  cities: City & { regions: Region };
  _count: {
    profiles: number;
  };
}

// Récupérer une agence par ID
export async function getAgencyById(id: string): Promise<ActionResponse<AgencyWithDetails>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('agencies')
      .select(`
        *,
        cities (
          id,
          name,
          regions (
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Récupérer le nombre d'utilisateurs
    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', id);

    // Ajouter les comptes
    const agencyWithCounts: AgencyWithDetails = {
      ...data as Agency,
      _count: {
        profiles: userCount || 0
      }
    };

    return { success: true, data: agencyWithCounts };
  } catch (error: any) {
    console.error('Error fetching agency:', error);
    return { success: false, error: error.message };
  }
}

// Interface pour les données d'insertion
interface AgencyInsertData extends Omit<Agency, 'id' | 'created_at' | 'updated_at' | 'cities'> {
  created_at: string;
}

// Vérifier les permissions de l'utilisateur
async function checkUserPermission(userId: string, requiredRole: SystemRole): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: roleData } = await supabase
    .from('user_roles')
    .select(`
      roles (
        name
      )
    `)
    .eq('user_id', userId)
    .single();

  if (!roleData) return false;
  
  const roleName = roleData.roles?.name as SystemRole;
  return roleName === requiredRole;
}

// Créer une nouvelle agence
export async function createAgency(formData: AgencyFormData): Promise<ActionResponse<Agency>> {
  try {
    // Valider avec Zod
    const validatedData = agencySchema.parse(formData);
    
    const supabase = await createClient();
    
    // Vérifier les permissions (Super Admin uniquement)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const hasPermission = await checkUserPermission(user.id, 'superadmin');
    if (!hasPermission) {
      throw new Error('Permission refusée. Seuls les super administrateurs peuvent créer des agences.');
    }

    // Vérifier si le code existe déjà
    const { data: existingAgency } = await supabase
      .from('agencies')
      .select('id')
      .eq('code', validatedData.code)
      .single();

    if (existingAgency) {
      throw new Error('Ce code d\'agence existe déjà.');
    }

    // NOTE: Votre schéma utilise manager_id (UUID) mais votre validation utilise manager_name (string)
    // Pour l'instant, on ignore manager_name car votre table n'a pas cette colonne
    const { manager_name, ...validatedDataWithoutManager } = validatedData;

    // Préparer les données d'insertion
    const insertData: AgencyInsertData = {
      ...validatedDataWithoutManager,
      // Gérer les valeurs optionnelles
      address: validatedData.address || null,
      phone: validatedData.phone || null,
      email: validatedData.email || null,
      opening_hours: validatedData.opening_hours || null,
      latitude: validatedData.latitude || null,
      longitude: validatedData.longitude || null,
      is_active: true,
      created_at: new Date().toISOString(),
      manager_id: null, // À remplir si vous avez un système de gestion des managers
    };

    const { data, error } = await supabase
      .from('agencies')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;

    // Audit log
    try {
      const auditLog: Omit<AuditLog, 'id'> = {
        event_timestamp: new Date().toISOString(),
        user_id: user.id,
        event_type: 'AGENCY_CREATED',
        target_table: 'agencies',
        target_record_id: data.id,
        details: insertData,
      };
      
      await supabase.from('audit_logs').insert([auditLog]);
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError);
    }

    revalidatePath('/dashboard/agencies');
    return { success: true, data: data as Agency };
  } catch (error: any) {
    console.error('Error creating agency:', error);
    return { 
      success: false, 
      error: error.message || 'Erreur lors de la création de l\'agence' 
    };
  }
}

// Mettre à jour une agence
export async function updateAgency(id: string, formData: Partial<AgencyFormData>): Promise<ActionResponse<Agency>> {
  try {
    // Valider avec Zod (partial pour les mises à jour)
    const validatedData = agencySchema.partial().parse(formData);
    
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    // Vérifier si l'agence existe
    const { data: existingAgency } = await supabase
      .from('agencies')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingAgency) {
      throw new Error('Agence non trouvée.');
    }

    // Si le code est modifié, vérifier qu'il n'existe pas déjà
    if (validatedData.code && validatedData.code !== existingAgency.code) {
      const { data: codeCheck } = await supabase
        .from('agencies')
        .select('id')
        .eq('code', validatedData.code)
        .not('id', 'eq', id)
        .single();

      if (codeCheck) {
        throw new Error('Ce code d\'agence est déjà utilisé par une autre agence.');
      }
    }

    // NOTE: Ignorer manager_name car non présent dans la table
    const { manager_name, ...validatedDataWithoutManager } = validatedData;

    // Préparer les données de mise à jour
    const updateData: Partial<Agency> = {};
    
    Object.keys(validatedDataWithoutManager).forEach(key => {
      const value = (validatedDataWithoutManager as any)[key];
      if (value === '' || value === null || value === undefined) {
        (updateData as any)[key] = null;
      } else {
        (updateData as any)[key] = value;
      }
    });

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('agencies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Audit log
    try {
      const auditLog: Omit<AuditLog, 'id'> = {
        event_timestamp: new Date().toISOString(),
        user_id: user.id,
        event_type: 'AGENCY_UPDATED',
        target_table: 'agencies',
        target_record_id: id,
        details: updateData,
      };
      
      await supabase.from('audit_logs').insert([auditLog]);
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError);
    }

    revalidatePath('/dashboard/agencies');
    return { success: true, data: data as Agency };
  } catch (error: any) {
    console.error('Error updating agency:', error);
    return { 
      success: false, 
      error: error.message || 'Erreur lors de la mise à jour de l\'agence' 
    };
  }
}

// Basculer le statut d'une agence
export async function toggleAgencyStatus(id: string, isActive: boolean): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { error } = await supabase
      .from('agencies')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    // Audit log
    try {
      const auditLog: Omit<AuditLog, 'id'> = {
        event_timestamp: new Date().toISOString(),
        user_id: user.id,
        event_type: 'AGENCY_STATUS_CHANGED',
        target_table: 'agencies',
        target_record_id: id,
        details: { is_active: isActive },
      };
      
      await supabase.from('audit_logs').insert([auditLog]);
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError);
    }

    revalidatePath('/dashboard/agencies');
    return { success: true };
  } catch (error: any) {
    console.error('Error toggling agency status:', error);
    return { 
      success: false, 
      error: error.message || 'Erreur lors du changement de statut' 
    };
  }
}

// Supprimer une agence
export async function deleteAgency(id: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    // Vérifier s'il y a des utilisateurs associés
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', id);

    if (usersCount && usersCount > 0) {
      throw new Error('Impossible de supprimer : des utilisateurs sont associés à cette agence.');
    }

    // Vérifier s'il y a des envois associés (origine)
    const { count: originShipmentsCount } = await supabase
      .from('shipments')
      .select('*', { count: 'exact', head: true })
      .eq('origin_agency_id', id);

    // Vérifier s'il y a des envois associés (destination)
    const { count: destinationShipmentsCount } = await supabase
      .from('shipments')
      .select('*', { count: 'exact', head: true })
      .eq('destination_agency_id', id);

    // Vérifier s'il y a des envois associés (courant)
    const { count: currentShipmentsCount } = await supabase
      .from('shipments')
      .select('*', { count: 'exact', head: true })
      .eq('current_agency_id', id);

    const totalShipments = (originShipmentsCount || 0) + (destinationShipmentsCount || 0) + (currentShipmentsCount || 0);

    if (totalShipments > 0) {
      throw new Error('Impossible de supprimer : des envois sont associés à cette agence.');
    }

    const { error } = await supabase
      .from('agencies')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Audit log
    try {
      const auditLog: Omit<AuditLog, 'id'> = {
        event_timestamp: new Date().toISOString(),
        user_id: user.id,
        event_type: 'AGENCY_DELETED',
        target_table: 'agencies',
        target_record_id: id,
      };
      
      await supabase.from('audit_logs').insert([auditLog]);
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError);
    }

    revalidatePath('/dashboard/agencies');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting agency:', error);
    return { 
      success: false, 
      error: error.message || 'Erreur lors de la suppression de l\'agence' 
    };
  }
}

// Interface pour les villes avec région
interface CityWithRegion extends City {
  regions: Region;
}

// Récupérer les villes pour les formulaires
export async function getCitiesForSelect(): Promise<ActionResponse<CityWithRegion[]>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('cities')
      .select(`
        id,
        name,
        regions (
          id,
          name
        )
      `)
      .order('name');

    if (error) throw error;
    return { success: true, data: data as CityWithRegion[] };
  } catch (error: any) {
    console.error('Error fetching cities:', error);
    return { success: false, error: error.message };
  }
}

// Types utilitaires pour les statistiques
export interface AgencyStatistics {
  total: number;
  active: number;
  inactive: number;
  withGPS: number;
  withManager: number;
  byRegion: Array<{
    id: string;
    name: string;
    count: number;
  }>;
}

// Récupérer les statistiques des agences
export async function getAgencyStatistics(): Promise<ActionResponse<AgencyStatistics>> {
  try {
    const agenciesResponse = await getAgencies();
    
    if (!agenciesResponse.success || !agenciesResponse.data) {
      throw new Error(agenciesResponse.error || 'Impossible de récupérer les agences');
    }

    const agencies = agenciesResponse.data;
    
    const stats: AgencyStatistics = {
      total: agencies.length,
      active: agencies.filter(a => a.is_active).length,
      inactive: agencies.filter(a => !a.is_active).length,
      withGPS: agencies.filter(a => a.latitude && a.longitude).length,
      withManager: agencies.filter(a => a.manager_id).length,
      byRegion: []
    };

    // Calculer par région
    const regionCounts: Record<string, { name: string; count: number }> = {};
    
    agencies.forEach(agency => {
      const regionId = agency.cities?.regions?.id;
      const regionName = agency.cities?.regions?.name;
      
      if (regionId && regionName) {
        if (!regionCounts[regionId]) {
          regionCounts[regionId] = { name: regionName, count: 0 };
        }
        regionCounts[regionId].count++;
      }
    });

    stats.byRegion = Object.entries(regionCounts).map(([id, data]) => ({
      id,
      name: data.name,
      count: data.count
    }));

    return { success: true, data: stats };
  } catch (error: any) {
    console.error('Error fetching agency statistics:', error);
    return { success: false, error: error.message };
  }
}