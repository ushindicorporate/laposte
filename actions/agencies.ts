// actions/agencies.ts
'use server'

import { createClient } from "@/lib/supabase/server"
import { agencySchema, AgencyFormData } from "@/lib/validations/agencies"
import { revalidatePath } from "next/cache"
import { logAuditEvent } from "@/lib/logger"

// --- READ ---
export async function getAgencies() {
  const supabase = await createClient()
  
  // On récupère l'agence avec sa ville et le code de la région
  const { data, error } = await supabase
    .from('agencies')
    .select(`
      *,
      city:cities (
        id,
        name,
        region:regions (code)
      )
    `)
    .order('created_at', { ascending: false })
  
  if (error) throw new Error(error.message)
  return data
}

// --- HELPER POUR LE SELECT ---
export async function getCitiesForSelect() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('cities')
    .select(`
      id, 
      name,
      region:regions(code)
    `)
    .eq('is_active', true)
    .order('name')
  
  // On formate pour afficher "Lubumbashi (HK)"
  return (data || []).map((c: any) => ({
    id: c.id,
    name: `${c.name} (${c.region?.code || '-'})`
  }))
}

// --- CREATE ---
export async function createAgency(formData: AgencyFormData) {
  const supabase = await createClient()
  const validation = agencySchema.safeParse(formData)
  
  if (!validation.success) return { success: false, error: validation.error.format() }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Non authentifié" }

  const { error } = await supabase.from('agencies').insert(validation.data)

  if (error) {
    if (error.code === '23505') return { success: false, error: "Ce code agence existe déjà." }
    return { success: false, error: error.message }
  }

  await logAuditEvent({
    userId: user.id,
    eventType: 'CREATE_AGENCY',
    details: { name: validation.data.name, code: validation.data.code },
    targetTable: 'agencies'
  })
  
  revalidatePath('/dashboard/agencies')
  return { success: true }
}

// --- UPDATE ---
export async function updateAgency(id: string, formData: AgencyFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('agencies')
    .update({
      ...formData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  await logAuditEvent({
    userId: user?.id,
    eventType: 'UPDATE_AGENCY',
    details: { changes: formData },
    targetTable: 'agencies',
    targetId: id
  })

  revalidatePath('/dashboard/agencies')
  return { success: true }
}