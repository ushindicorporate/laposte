// actions/admin.ts
'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAuditEvent } from "@/lib/logger"

// --- JOURS FÉRIÉS ---
export async function getHolidays() {
  const supabase = await createClient()
  const { data } = await supabase.from('public_holidays').select('*').order('holiday_date')
  return data || []
}

export async function createHoliday(date: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { error } = await supabase.from('public_holidays').insert({ holiday_date: date, name })
  
  if (error) return { success: false, error: error.message }
  
  await logAuditEvent({
    userId: user?.id,
    eventType: 'SYSTEM_ERROR', // Tu peux ajouter 'CONFIG_CHANGE' dans tes types d'event
    details: { action: 'ADD_HOLIDAY', date, name },
    targetTable: 'public_holidays'
  })

  revalidatePath('/dashboard/admin')
  return { success: true }
}

export async function deleteHoliday(id: string) {
  const supabase = await createClient()
  await supabase.from('public_holidays').delete().eq('id', id)
  revalidatePath('/dashboard/admin')
  return { success: true }
}

// --- TARIFICATION (Mise à jour rapide) ---
export async function getTariffConfig() {
  const supabase = await createClient()
  // On suppose qu'on modifie le tarif par défaut
  const { data } = await supabase.from('tariffs').select('*').limit(1).single()
  return data
}

export async function updateTariffConfig(id: string, basePrice: number, pricePerKg: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('tariffs')
    .update({ base_price: basePrice, price_per_kg: pricePerKg })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  await logAuditEvent({
    userId: user?.id,
    eventType: 'SYSTEM_ERROR', // À changer par 'CONFIG_CHANGE'
    details: { action: 'UPDATE_TARIFF', basePrice, pricePerKg },
    targetTable: 'tariffs'
  })

  revalidatePath('/dashboard/admin')
  return { success: true }
}