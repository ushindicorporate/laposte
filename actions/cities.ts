// actions/cities.ts
'use server'

import { createClient } from "@/lib/supabase/server"
import { citySchema, CityFormData } from "@/lib/validations/cities"
import { revalidatePath } from "next/cache"
import { logAuditEvent } from "@/lib/logger"

// --- READ (Villes + Nom Région) ---
export async function getCities() {
  const supabase = await createClient()
  
  // Syntaxe Supabase pour les jointures : region:regions(name)
  const { data, error } = await supabase
    .from('cities')
    .select(`
      *,
      region:regions (
        id,
        name,
        code
      )
    `)
    .order('name')
  
  if (error) throw new Error(error.message)
  return data
}

// --- HELPER POUR LE SELECT ---
export async function getRegionsForSelect() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('regions')
    .select('id, name')
    .eq('is_active', true) // On ne crée pas de villes dans des régions archivées
    .order('name')
  
  return data || []
}

// --- CREATE ---
export async function createCity(formData: CityFormData) {
  const supabase = await createClient()
  
  const validation = citySchema.safeParse(formData)
  if (!validation.success) return { success: false, error: validation.error.format() }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Non authentifié" }

  const { error } = await supabase
    .from('cities')
    .insert({
      name: validation.data.name,
      region_id: validation.data.region_id,
      postal_code: validation.data.postal_code,
      notes: validation.data.description, // Mapping description -> notes
      is_active: validation.data.is_active,
      population: validation.data.population
    })

  if (error) return { success: false, error: error.message }

  await logAuditEvent({
    userId: user.id,
    eventType: 'CREATE_CITY',
    details: { name: validation.data.name, region: validation.data.region_id },
    targetTable: 'cities'
  })
  
  revalidatePath('/dashboard/cities')
  return { success: true }
}

// --- UPDATE ---
export async function updateCity(id: string, formData: CityFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('cities')
    .update({
      name: formData.name,
      region_id: formData.region_id,
      postal_code: formData.postal_code,
      notes: formData.description,
      is_active: formData.is_active,
      population: formData.population,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  await logAuditEvent({
    userId: user?.id,
    eventType: 'UPDATE_CITY',
    details: { changes: formData },
    targetTable: 'cities',
    targetId: id
  })

  revalidatePath('/dashboard/cities')
  return { success: true }
}