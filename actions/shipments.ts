// actions/shipments.ts
'use server'

import { createClient } from "@/lib/supabase/server"
import { shipmentSchema, ShipmentFormData } from "@/lib/validations/shipments"
import { revalidatePath } from "next/cache"
import { logAuditEvent } from "@/lib/logger"

// --- CREATE SHIPMENT ---
export async function createShipment(formData: ShipmentFormData) {
  const supabase = await createClient()
  
  // 1. Validation
  const validation = shipmentSchema.safeParse(formData)
  if (!validation.success) return { success: false, error: validation.error.format() }
  const data = validation.data

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Non authentifié" }

  // 2. Création de l'Entête (Shipment)
  const { data: shipment, error: shipError } = await supabase
    .from('shipments')
    .insert({
      // Expéditeur
      sender_name: data.sender.name,
      sender_phone: data.sender.phone,
      sender_address: data.sender.address,
      sender_customer_id: data.sender.customer_id || null, // Lien CRM
      
      // Destinataire
      recipient_name: data.recipient.name,
      recipient_phone: data.recipient.phone,
      recipient_address: data.recipient.address,
      recipient_customer_id: data.recipient.customer_id || null, // Lien CRM

      // Logistique
      origin_agency_id: data.origin_agency_id,
      destination_agency_id: data.destination_agency_id,
      current_agency_id: data.origin_agency_id, // Au départ, il est à l'origine
      type: data.type,
      status: 'CREATED', // Statut initial

      // Métriques
      weight_kg: data.total_weight,
      total_price: data.total_price,
      created_by: user.id
    })
    .select()
    .single()

  if (shipError) return { success: false, error: "Erreur création envoi: " + shipError.message }

  // 3. Création des Items (Contenu)
  const itemsToInsert = data.items.map(item => ({
    shipment_id: shipment.id,
    description: item.description,
    quantity: item.quantity,
    weight_kg: item.weight_kg,
    declared_value: item.declared_value,
    is_fragile: item.is_fragile
  }))

  const { error: itemsError } = await supabase.from('shipment_items').insert(itemsToInsert)

  if (itemsError) {
    // Aïe, l'entête est créé mais pas les items. 
    // Dans un vrai système, on ferait un rollback via RPC. 
    // Ici, on tente de nettoyer.
    await supabase.from('shipments').delete().eq('id', shipment.id)
    return { success: false, error: "Erreur enregistrement contenu: " + itemsError.message }
  }

  // 4. Audit & Succès
  await logAuditEvent({
    userId: user.id,
    eventType: 'CREATE_SHIPMENT',
    details: { 
      tracking: shipment.tracking_number, 
      price: data.total_price,
      destination: data.destination_agency_id 
    },
    targetTable: 'shipments',
    targetId: shipment.id
  })

  revalidatePath('/dashboard/shipments')
  return { success: true, trackingNumber: shipment.tracking_number }
}

// --- HELPER : Récupérer les données pour le formulaire ---
export async function getShipmentFormData() {
  const supabase = await createClient()
  
  // On récupère les agences pour la destination
  // On récupère les clients pour la recherche rapide (limitée aux 50 derniers ou via API search)
  // Ici on prend juste les agences pour le select
  const { data: agencies } = await supabase
    .from('agencies')
    .select('id, name, code, city:cities(name)')
    .eq('is_active', true)
    .order('name')

  return {
    agencies: (agencies || []).map((a: any) => ({
      id: a.id,
      name: `${a.name} - ${a.city?.name} (${a.code})`
    }))
  }
}

export async function getShipmentByTracking(trackingNumber: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('shipments')
    .select(`
      *,
      origin_agency:agencies!origin_agency_id(name, code, city:cities(name)),
      destination_agency:agencies!destination_agency_id(name, code, city:cities(name)),
      items:shipment_items(*)
    `)
    .eq('tracking_number', trackingNumber)
    .single()

  if (error) return null
  return data
}

// --- GET ALL SHIPMENTS (LIST) ---
export async function getShipments(limit = 20) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('shipments')
    .select(`
      id,
      tracking_number,
      created_at,
      status,
      type,
      total_price,
      sender_name,
      recipient_name,
      origin:agencies!origin_agency_id(code, city:cities(name)),
      destination:agencies!destination_agency_id(code, city:cities(name))
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data
}