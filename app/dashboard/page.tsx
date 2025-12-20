'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Package, Truck, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardHome() {
  const [stats, setStats] = useState({
    total: 0,
    inTransit: 0,
    delivered: 0,
    issues: 0
  })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadStats() {
      // Auth check
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Calcul des stats (Approche simplifiée pour le MVP)
      // Note: En prod avec beaucoup de données, on utilise `count` SQL, pas fetch all
      const { data: shipments } = await supabase.from('shipments').select('status')
      
      if (shipments) {
        setStats({
          total: shipments.length,
          inTransit: shipments.filter(s => ['IN_TRANSIT', 'ARRIVED_AT_AGENCY', 'OUT_FOR_DELIVERY'].includes(s.status)).length,
          delivered: shipments.filter(s => s.status === 'DELIVERED').length,
          issues: shipments.filter(s => s.status === 'ISSUE').length
        })
      }
      setLoading(false)
    }
    loadStats()
  }, [router, supabase])

  if (loading) return <div className="p-8">Chargement du tableau de bord...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Tableau de Bord</h1>
        <p className="text-muted-foreground">Bienvenue, {user?.email}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Envois</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Depuis le début du mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Transit (Actifs)</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inTransit}</div>
            <p className="text-xs text-muted-foreground">En mouvement dans le réseau</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livrés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            <p className="text-xs text-muted-foreground">Livraisons réussies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Problèmes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.issues}</div>
            <p className="text-xs text-muted-foreground">Nécessitent une action</p>
          </CardContent>
        </Card>

      </div>

      {/* Zone Graphique ou Tableau récent (Placeholder pour Phase 2) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-slate-50 rounded border border-dashed">
              Graphique des volumes (Phase 2)
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Performance Agences</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-slate-50 rounded border border-dashed">
              Top Agences (Phase 2)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}