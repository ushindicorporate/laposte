// actions/addresses.ts
'use server'

import { createClient } from "@/lib/supabase/server"
import { addressSchema, AddressFormData } from "@/lib/validations/adresses"
import { revalidatePath } from "next/cache"
import { logAuditEvent } from "@/lib/logger"

// --- LISTER ADRESSES D'UN CLIENT ---
export async function getCustomerAddresses(customerId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('customer_addresses')
    .select(`
      *,
      city:cities (id, name)
    `)
    .eq('customer_id', customerId)
    .order('is_default', { ascending: false }) // Par défaut en premier

  if (error) throw new Error(error.message)
  return data
}

// --- AJOUTER ADRESSE ---
export async function createAddress(customerId: string, formData: AddressFormData) {
  const supabase = await createClient()
  const validation = addressSchema.safeParse(formData)
  
  if (!validation.success) return { success: false, error: validation.error.format() }

  const { data: { user } } = await supabase.auth.getUser()
  
  // Gestion du "is_default" : si c'est la nouvelle défaut, on désactive les autres
  if (validation.data.is_default) {
    await supabase
      .from('customer_addresses')
      .update({ is_default: false })
      .eq('customer_id', customerId)
  }

  const { error } = await supabase
    .from('customer_addresses')
    .insert({
      customer_id: customerId,
      ...validation.data
    })

  if (error) return { success: false, error: error.message }

  await logAuditEvent({
    userId: user?.id,
    eventType: 'UPDATE_CUSTOMER',
    details: { action: 'ADD_ADDRESS', customerId },
    targetTable: 'customer_addresses'
  })
  
  revalidatePath('/dashboard/customers')
  return { success: true }
}

// --- SUPPRIMER ADRESSE ---
export async function deleteAddress(addressId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('customer_addresses').delete().eq('id', addressId)
  
  if (error) return { success: false, error: error.message }
  
  revalidatePath('/dashboard/customers')
  return { success: true }
}