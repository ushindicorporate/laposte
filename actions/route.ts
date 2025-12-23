'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { routeSchema, RouteFormData } from '@/lib/validations/route';
import { 
  Route, 
  RouteWithRelations, 
} from '@/lib/types/route';
import { ActionResponse, Agency } from '@/lib/types/database';

// Récupérer toutes les routes avec relations
export async function getRoutes(): Promise<ActionResponse<RouteWithRelations[]>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('routes')
      .select(`
        *,
        origin_agency:origin_agency_id (
          id,
          name,
          code,
          cities!inner (
            id,
            name,
            regions!inner (
              id,
              name
            )
          )
        ),
        destination_agency:destination_agency_id (
          id,
          name,
          code,
          cities!inner (
            id,
            name,
            regions!inner (
              id,
              name
            )
          )
        ),
        route_stops (
          *,
          agency:agency_id (
            id,
            name,
            code,
            cities!inner (
              id,
              name,
              regions!inner (
                id,
                name
              )
            )
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data as RouteWithRelations[] };
  } catch (error: any) {
    console.error('Error fetching routes:', error);
    return { success: false, error: error.message };
  }
}

// Récupérer une route par ID
export async function getRouteById(id: string): Promise<ActionResponse<RouteWithRelations>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('routes')
      .select(`
        *,
        origin_agency:origin_agency_id (
          id,
          name,
          code,
          cities!inner (
            id,
            name,
            regions!inner (
              id,
              name
            )
          )
        ),
        destination_agency:destination_agency_id (
          id,
          name,
          code,
          cities!inner (
            id,
            name,
            regions!inner (
              id,
              name
            )
          )
        ),
        route_stops (
          *,
          agency:agency_id (
            id,
            name,
            code,
            cities!inner (
              id,
              name,
              regions!inner (
                id,
                name
              )
            )
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { success: true, data: data as RouteWithRelations };
  } catch (error: any) {
    console.error('Error fetching route:', error);
    return { success: false, error: error.message };
  }
}

// Récupérer les agences pour les sélections
export async function getAgenciesForRoute(): Promise<ActionResponse<Agency[]>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('agencies')
      .select(`
        id,
        name,
        code,
        cities!inner (
          id,
          name,
          regions!inner (
            id,
            name
          )
        )
      `)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return { success: true, data: data as unknown as Agency[] };
  } catch (error: any) {
    console.error('Error fetching agencies:', error);
    return { success: false, error: error.message };
  }
}

// Créer une nouvelle route
export async function createRoute(formData: RouteFormData): Promise<ActionResponse<Route>> {
  try {
    // Valider avec Zod
    const validatedData = routeSchema.parse(formData);
    
    const supabase = await createClient();
    
    // Vérifier les permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    // Vérifier si le code existe déjà
    const { data: existingRoute } = await supabase
      .from('routes')
      .select('id')
      .eq('code', validatedData.code)
      .single();

    if (existingRoute) {
      throw new Error('Ce code de route existe déjà.');
    }

    // Préparer les données de la route
    const routeData = {
      ...validatedData,
      distance_km: validatedData.distance_km || null,
      estimated_duration_minutes: validatedData.estimated_duration_minutes || null,
      departure_time: validatedData.departure_time || null,
      arrival_time: validatedData.arrival_time || null,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Démarrer une transaction
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .insert([routeData])
      .select()
      .single();

    if (routeError) throw routeError;

    // Créer les arrêts de route si fournis
    if (validatedData.route_stops && validatedData.route_stops.length > 0) {
      const routeStopsData = validatedData.route_stops.map(stop => ({
        ...stop,
        route_id: route.id,
        created_at: new Date().toISOString(),
      }));

      const { error: stopsError } = await supabase
        .from('route_stops')
        .insert(routeStopsData);

      if (stopsError) throw stopsError;
    }

    // Audit log
    try {
      await supabase.from('audit_logs').insert([{
        user_id: user.id,
        event_type: 'ROUTE_CREATED',
        target_table: 'routes',
        target_record_id: route.id,
        details: routeData,
      }]);
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError);
    }

    revalidatePath('/dashboard/routes');
    return { success: true, data: route as Route };
  } catch (error: any) {
    console.error('Error creating route:', error);
    return { 
      success: false, 
      error: error.message || 'Erreur lors de la création de la route' 
    };
  }
}

// Mettre à jour une route
export async function updateRoute(id: string, formData: Partial<RouteFormData>): Promise<ActionResponse<Route>> {
  try {
    // Valider avec Zod (partial)
    const validatedData = routeSchema.partial().parse(formData);
    
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    // Vérifier si la route existe
    const { data: existingRoute } = await supabase
      .from('routes')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingRoute) {
      throw new Error('Route non trouvée.');
    }

    // Si le code est modifié, vérifier qu'il n'existe pas déjà
    if (validatedData.code && validatedData.code !== existingRoute.code) {
      const { data: codeCheck } = await supabase
        .from('routes')
        .select('id')
        .eq('code', validatedData.code)
        .not('id', 'eq', id)
        .single();

      if (codeCheck) {
        throw new Error('Ce code de route est déjà utilisé par une autre route.');
      }
    }

    // Préparer les données de mise à jour
    const updateData: Partial<Route> = {};
    
    Object.keys(validatedData).forEach(key => {
      if (key !== 'route_stops') {
        const value = (validatedData as any)[key];
        if (value === '' || value === null || value === undefined) {
          (updateData as any)[key] = null;
        } else {
          (updateData as any)[key] = value;
        }
      }
    });

    updateData.updated_at = new Date().toISOString();

    // Mettre à jour la route
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (routeError) throw routeError;

    // Mettre à jour les arrêts si fournis
    if (validatedData.route_stops !== undefined) {
      // Supprimer les anciens arrêts
      const { error: deleteError } = await supabase
        .from('route_stops')
        .delete()
        .eq('route_id', id);

      if (deleteError) throw deleteError;

      // Ajouter les nouveaux arrêts
      if (validatedData.route_stops && validatedData.route_stops.length > 0) {
        const routeStopsData = validatedData.route_stops.map(stop => ({
          ...stop,
          route_id: id,
          created_at: new Date().toISOString(),
        }));

        const { error: stopsError } = await supabase
          .from('route_stops')
          .insert(routeStopsData);

        if (stopsError) throw stopsError;
      }
    }

    // Audit log
    try {
      await supabase.from('audit_logs').insert([{
        user_id: user.id,
        event_type: 'ROUTE_UPDATED',
        target_table: 'routes',
        target_record_id: id,
        details: updateData,
      }]);
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError);
    }

    revalidatePath('/dashboard/routes');
    revalidatePath(`/dashboard/routes/${id}`);
    return { success: true, data: route as Route };
  } catch (error: any) {
    console.error('Error updating route:', error);
    return { 
      success: false, 
      error: error.message || 'Erreur lors de la mise à jour de la route' 
    };
  }
}

// Basculer le statut d'une route
export async function toggleRouteStatus(id: string, isActive: boolean): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { error } = await supabase
      .from('routes')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    // Audit log
    try {
      await supabase.from('audit_logs').insert([{
        user_id: user.id,
        event_type: 'ROUTE_STATUS_CHANGED',
        target_table: 'routes',
        target_record_id: id,
        details: { is_active: isActive },
      }]);
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError);
    }

    revalidatePath('/dashboard/routes');
    return { success: true };
  } catch (error: any) {
    console.error('Error toggling route status:', error);
    return { 
      success: false, 
      error: error.message || 'Erreur lors du changement de statut' 
    };
  }
}

// Supprimer une route
export async function deleteRoute(id: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    // Vérifier si la route est utilisée dans des envois
    // (À implémenter plus tard quand vous aurez la logique de suivi)

    const { error } = await supabase
      .from('routes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Audit log
    try {
      await supabase.from('audit_logs').insert([{
        user_id: user.id,
        event_type: 'ROUTE_DELETED',
        target_table: 'routes',
        target_record_id: id,
      }]);
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError);
    }

    revalidatePath('/dashboard/routes');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting route:', error);
    return { 
      success: false, 
      error: error.message || 'Erreur lors de la suppression de la route' 
    };
  }
}