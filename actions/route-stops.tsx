// actions/route-stops.ts
'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAuditEvent } from "@/lib/logger"

// --- LISTER LES ARRÊTS ---
export async function getRouteStops(routeId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('route_stops')
    .select(`
      id,
      stop_order,
      estimated_arrival_minutes,
      is_mandatory,
      agency:agencies (id, name, code)
    `)
    .eq('route_id', routeId)
    .order('stop_order', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

// --- AJOUTER UN ARRÊT ---
export async function addRouteStop(routeId: string, agencyId: string, order: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Non authentifié" }

  // 1. Vérifier si l'arrêt existe déjà pour cette route
  const { data: existing } = await supabase
    .from('route_stops')
    .select('id')
    .eq('route_id', routeId)
    .eq('agency_id', agencyId)
    .single()
  
  if (existing) return { success: false, error: "Cette agence est déjà un arrêt de cette route." }

  // 2. Insertion
  const { error } = await supabase.from('route_stops').insert({
    route_id: routeId,
    agency_id: agencyId,
    stop_order: order,
    is_mandatory: true
  })

  if (error) {
    if (error.code === '23505') return { success: false, error: "Conflit d'ordre (position déjà prise)." }
    return { success: false, error: error.message }
  }

  await logAuditEvent({
    userId: user.id,
    eventType: 'UPDATE_ROUTE', // On considère ça comme une maj de route
    details: { action: 'ADD_STOP', routeId, agencyId },
    targetTable: 'route_stops'
  })

  revalidatePath('/dashboard/routes')
  return { success: true }
}

// --- SUPPRIMER UN ARRÊT ---
export async function deleteRouteStop(stopId: string, routeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('route_stops')
    .delete()
    .eq('id', stopId)

  if (error) return { success: false, error: error.message }

  await logAuditEvent({
    userId: user?.id,
    eventType: 'UPDATE_ROUTE',
    details: { action: 'REMOVE_STOP', stopId },
    targetTable: 'route_stops'
  })

  revalidatePath('/dashboard/routes')
  return { success: true }
}