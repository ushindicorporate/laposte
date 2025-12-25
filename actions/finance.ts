// actions/finance.ts
'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAuditEvent } from "@/lib/logger"

// --- ENCAISSER UN PAIEMENT ---
export async function recordPayment(data: {
  shipmentId: string,
  amount: number,
  method: 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER',
  reference?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Non authentifié" }

  // 1. Récupérer l'agence de l'agent (Pour savoir dans quelle caisse ça va)
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single()

  if (!profile?.agency_id) return { success: false, error: "Aucune caisse (agence) associée à votre compte." }

  // 2. Insérer le paiement
  const { error } = await supabase.from('payments').insert({
    shipment_id: data.shipmentId,
    amount: data.amount,
    payment_method: data.method,
    transaction_ref: data.reference,
    cashier_id: user.id,
    agency_id: profile.agency_id,
    currency: 'USD' // Par défaut pour simplifier le MVP
  })

  if (error) return { success: false, error: error.message }

  // 3. Audit
  await logAuditEvent({
    userId: user.id,
    eventType: 'UPDATE_SHIPMENT_STATUS', // On considère le paiement comme une maj statut
    details: { action: 'PAYMENT', amount: data.amount, method: data.method },
    targetTable: 'payments'
  })

  revalidatePath('/dashboard/shipments')
  // On revalide aussi la fiche détail
  // Note: On ne peut pas facilement revalider une route dynamique spécifique depuis ici sans l'ID, 
  // mais Next.js gère ça si on visite la page.
  
  return { success: true }
}

// --- CALCUL DU PRIX (Moteur de Tarification) ---
// Remplace le calcul JS hardcodé du Wizard
export async function calculatePrice(weight: number) {
  const supabase = await createClient()
  
  // On prend le tarif actif par défaut (Simplification MVP)
  // Dans le futur : Logique zones/distances complexe
  const { data: tariff } = await supabase
    .from('tariffs')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .single()
  
  if (!tariff) return 0 // Fallback

  // Formule : Base + (Poids * Prix/Kg)
  const price = Number(tariff.base_price) + (weight * Number(tariff.price_per_kg))
  return Math.ceil(price) // Arrondi supérieur
}

// --- DASHBOARD FINANCE (KPIs) ---
export async function getDailyRevenue() {
  const supabase = await createClient()
  
  // On récupère les paiements du jour (UTC)
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('payments')
    .select('amount, payment_method, agency:agencies(name)')
    .gte('created_at', today)

  if (error) return { total: 0, breakdown: [] }

  // Agrégation simple JS
  const total = data.reduce((sum, p) => sum + Number(p.amount), 0)
  
  return { total, count: data.length, raw: data }
}