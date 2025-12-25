// actions/dashboard.ts
'use server'

import { createClient } from "@/lib/supabase/server"

export async function getDashboardStats() {
  const supabase = await createClient()
  
  // Exécution parallèle pour la vitesse
  const [dailyRes, agencyRes, statusRes] = await Promise.all([
    supabase.from('view_daily_shipments').select('*').limit(14), // 2 semaines
    supabase.from('view_agency_performance').select('*').limit(5), // Top 5 agences
    supabase.from('view_shipment_status_distribution').select('*')
  ])

  // Calcul des KPI globaux (Cartes du haut)
  const totalRevenue = dailyRes.data?.reduce((acc, curr) => acc + (curr.total_revenue || 0), 0) || 0
  const totalShipments = dailyRes.data?.reduce((acc, curr) => acc + (curr.total_count || 0), 0) || 0
  
  // Taux de livraison global (basique)
  const totalDelivered = dailyRes.data?.reduce((acc, curr) => acc + (curr.delivered_count || 0), 0) || 0
  const deliveryRate = totalShipments > 0 ? Math.round((totalDelivered / totalShipments) * 100) : 0

  return {
    kpi: {
      revenue: totalRevenue,
      shipments: totalShipments,
      deliveryRate: deliveryRate
    },
    charts: {
      daily: dailyRes.data?.reverse() || [], // On remet dans l'ordre chrono pour le graph
      agency: agencyRes.data || [],
      status: statusRes.data || []
    }
  }
}