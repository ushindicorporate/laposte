// actions/tracking.ts
'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAuditEvent } from "@/lib/logger"

// --- AJOUTER UN ÉVÉNEMENT (SCAN) ---
export async function scanShipment(
  trackingNumber: string, 
  status: string, 
  locationId: string, 
  notes?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Non authentifié" }

  // 1. Trouver l'ID du colis à partir du numéro de suivi
  const { data: shipment } = await supabase
    .from('shipments')
    .select('id')
    .eq('tracking_number', trackingNumber)
    .single()
  
  if (!shipment) return { success: false, error: "Numéro de suivi introuvable" }

  // 2. Insérer l'événement (Le Trigger mettra à jour le colis)
  const { error } = await supabase.from('tracking_events').insert({
    shipment_id: shipment.id,
    status: status,
    location_agency_id: locationId,
    scanned_by: user.id,
    notes: notes,
    // created_at est auto
  })

  if (error) return { success: false, error: error.message }

  // 3. Audit léger
  await logAuditEvent({
    userId: user.id,
    eventType: 'UPDATE_SHIPMENT_STATUS',
    details: { tracking: trackingNumber, new_status: status },
    targetTable: 'shipments',
    targetId: shipment.id
  })

  // On revalide la page détail et la liste
  revalidatePath(`/dashboard/shipments/${trackingNumber}`)
  revalidatePath('/dashboard/shipments')
  
  return { success: true }
}

// --- RÉCUPÉRER L'HISTORIQUE ---
export async function getTrackingHistory(shipmentId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('tracking_events')
    .select(`
      *,
      agency:location_agency_id(name, code),
      scanner:scanned_by(full_name)
    `)
    .eq('shipment_id', shipmentId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data
}