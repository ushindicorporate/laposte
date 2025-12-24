// actions/customers.ts
'use server'

import { createClient } from "@/lib/supabase/server"
import { customerSchema, CustomerFormData } from "@/lib/validations/customers"
import { revalidatePath } from "next/cache"
import { logAuditEvent } from "@/lib/logger"

// --- READ (Avec recherche) ---
export async function getCustomers(query?: string) {
  const supabase = await createClient()
  
  let req = supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50) // Pagination simple pour commencer

  if (query) {
    // Recherche floue sur nom OU téléphone OU numéro compte
    req = req.or(`name.ilike.%${query}%,phone.ilike.%${query}%,account_number.ilike.%${query}%`)
  }
  
  const { data, error } = await req
  if (error) throw new Error(error.message)
  return data
}

// --- CREATE ---
export async function createCustomer(formData: CustomerFormData) {
  const supabase = await createClient()
  
  // Validation Zod
  const validation = customerSchema.safeParse(formData)
  if (!validation.success) return { success: false, error: validation.error.format() }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Auth required" }

  // Vérification doublon téléphone (Optionnel mais recommandé)
  const { data: existing } = await supabase
    .from('customers')
    .select('id')
    .eq('phone', validation.data.phone)
    .single()
  
  if (existing) return { success: false, error: "Un client existe déjà avec ce numéro de téléphone." }

  const { error } = await supabase.from('customers').insert({
    ...validation.data,
    created_by: user.id
  })

  if (error) return { success: false, error: error.message }

  await logAuditEvent({
    userId: user.id,
    eventType: 'CREATE_CUSTOMER', // Ajoute ce type dans logger.ts
    details: { name: validation.data.name, phone: validation.data.phone },
    targetTable: 'customers'
  })
  
  revalidatePath('/dashboard/customers')
  return { success: true }
}

// --- UPDATE ---
export async function updateCustomer(id: string, formData: CustomerFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('customers')
    .update({
      ...formData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  await logAuditEvent({
    userId: user?.id,
    eventType: 'UPDATE_CUSTOMER',
    details: { changes: formData },
    targetTable: 'customers',
    targetId: id
  })

  revalidatePath('/dashboard/customers')
  return { success: true }
}