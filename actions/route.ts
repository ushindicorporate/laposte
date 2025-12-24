// actions/routes.ts
'use server'

import { createClient } from "@/lib/supabase/server"
import { routeSchema, RouteFormData } from "@/lib/validations/routes"
import { revalidatePath } from "next/cache"
import { logAuditEvent } from "@/lib/logger"

// --- READ ROUTES ---
export async function getRoutes() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('routes')
    .select(`
      *,
      origin:agencies!origin_agency_id(name, code),
      destination:agencies!destination_agency_id(name, code)
    `)
    .order('created_at', { ascending: false })
  
  if (error) throw new Error(error.message)
  return data
}

// --- CREATE ROUTE ---
export async function createRoute(formData: RouteFormData) {
  const supabase = await createClient()
  const validation = routeSchema.safeParse(formData)
  
  if (!validation.success) return { success: false, error: validation.error.format() }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Non authentifié" }

  const { error } = await supabase.from('routes').insert({
    ...validation.data,
    created_by: user.id
  })

  if (error) return { success: false, error: error.message }

  await logAuditEvent({
    userId: user.id,
    eventType: 'CREATE_ROUTE', // Ajoute ce type dans logger.ts si manquant
    details: { name: validation.data.name, code: validation.data.code },
    targetTable: 'routes'
  })
  
  revalidatePath('/dashboard/routes')
  return { success: true }
}

// --- UPDATE ROUTE ---
export async function updateRoute(id: string, formData: RouteFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('routes')
    .update({
      ...formData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  await logAuditEvent({
    userId: user?.id,
    eventType: 'UPDATE_ROUTE',
    details: { changes: formData },
    targetTable: 'routes',
    targetId: id
  })

  revalidatePath('/dashboard/routes')
  return { success: true }
}

// --- DELETE ROUTE ---
export async function deleteRoute(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('routes').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/routes')
    return { success: true }
}