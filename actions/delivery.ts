// actions/delivery.ts
'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAuditEvent } from "@/lib/logger"

export async function recordDelivery(
  trackingNumber: string,
  data: {
    status: 'DELIVERED' | 'FAILED_ATTEMPT',
    recipientName?: string,
    relationship?: string,
    failureReason?: string,
    notes?: string,
    proofUrl?: string // URL Supabase Storage si on upload une image
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Non authentifié" }

  // 1. Récupérer ID Colis
  const { data: shipment } = await supabase
    .from('shipments')
    .select('id')
    .eq('tracking_number', trackingNumber)
    .single()
  
  if (!shipment) return { success: false, error: "Colis introuvable" }

  // 2. Enregistrer la tentative
  const { error } = await supabase.from('delivery_attempts').insert({
    shipment_id: shipment.id,
    attempted_by: user.id,
    status: data.status,
    recipient_name: data.recipientName,
    recipient_relationship: data.relationship,
    failure_reason: data.failureReason,
    notes: data.notes,
    proof_url: data.proofUrl
  })

  if (error) return { success: false, error: error.message }

  // 3. Audit
  await logAuditEvent({
    userId: user.id,
    eventType: 'UPDATE_SHIPMENT_STATUS',
    details: { tracking: trackingNumber, action: 'DELIVERY_RECORD', status: data.status },
    targetTable: 'shipments',
    targetId: shipment.id
  })

  revalidatePath(`/dashboard/shipments/${trackingNumber}`)
  return { success: true }
}