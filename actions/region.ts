// actions/regions.ts
'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAuditEvent } from "@/lib/logger"
import { RegionFormData, regionSchema } from "@/lib/validations/region"

// --- READ ---
export async function getRegions() {
  const supabase = await createClient()
  // On trie par nom pour l'affichage
  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .order('name')
  
  if (error) throw new Error(error.message)
  return data
}

// --- CREATE ---
export async function createRegion(formData: RegionFormData) {
  const supabase = await createClient()
  
  // 1. Validation Zod Côté Serveur (Sécurité)
  const validation = regionSchema.safeParse(formData)
  if (!validation.success) {
    return { success: false, error: validation.error.format() }
  }

  // 2. Auth Check (On récupère l'user pour le log)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Non authentifié" }

  // 3. Insertion
  const { data, error } = await supabase
    .from('regions')
    .insert({
      name: validation.data.name,
      code: validation.data.code,
      description: validation.data.description,
      is_active: validation.data.is_active
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return { success: false, error: "Ce code région existe déjà." }
    return { success: false, error: error.message }
  }

  // 4. Audit & Revalidate
  await logAuditEvent({
    userId: user.id,
    eventType: 'CREATE_REGION',
    details: { name: data.name, code: data.code },
    targetTable: 'regions',
    targetId: data.id
  })
  
  revalidatePath('/dashboard/regions')
  return { success: true, data }
}

// --- UPDATE ---
export async function updateRegion(id: string, formData: RegionFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { error } = await supabase
    .from('regions')
    .update({
      name: formData.name,
      code: formData.code,
      description: formData.description,
      is_active: formData.is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  await logAuditEvent({
    userId: user?.id,
    eventType: 'UPDATE_REGION',
    details: { changes: formData },
    targetTable: 'regions',
    targetId: id
  })

  revalidatePath('/dashboard/regions')
  return { success: true }
}