import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VolumeChart from '@/components/reports/VolumeChart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, Package, AlertOctagon, TrendingUp } from 'lucide-react'
import { subDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default async function ReportsPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // 1. Récupération Parallèle des Données (Plus rapide)
  // On récupère les colis des 7 derniers jours pour le graphe
  const sevenDaysAgo = subDays(new Date(), 7).toISOString()

  const [shipmentsResponse, transactionsResponse, issuesResponse] = await Promise.all([
    // A. Tous les colis récents
    supabase
      .from('shipments')
      .select('created_at, status')
      .gte('created_at', sevenDaysAgo),
    
    // B. Toutes les transactions (Revenus)
    supabase
      .from('transactions')
      .select('amount'),

    // C. Colis avec problèmes (Total global)
    supabase
      .from('shipments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'ISSUE')
  ])

  const shipments = shipmentsResponse.data || []
  const transactions = transactionsResponse.data || []
  const issuesCount = issuesResponse.count || 0

  // 2. Calcul des KPI (Business Logic sur le Serveur)
  
  // KPI: Revenu Total
  const totalRevenue = transactions.reduce((acc, curr) => acc + Number(curr.amount), 0)

  // KPI: Préparation des données pour le Graphique (Group by Date)
  // On crée un tableau vide pour les 7 derniers jours
  const chartDataMap = new Map<string, number>()
  
  for (let i = 6; i >= 0; i--) {
    const dateStr = format(subDays(new Date(), i), 'dd MMM', { locale: fr })
    chartDataMap.set(dateStr, 0)
  }

  // On remplit avec les vraies données
  shipments.forEach((s) => {
    const dateStr = format(new Date(s.created_at), 'dd MMM', { locale: fr })
    if (chartDataMap.has(dateStr)) {
      chartDataMap.set(dateStr, (chartDataMap.get(dateStr) || 0) + 1)
    }
  })

  // Conversion en format pour Recharts [{date: '12 Jan', total: 5}, ...]
  const chartData = Array.from(chartDataMap).map(([date, total]) => ({ date, total }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Rapports & Analytics</h1>
        <p className="text-muted-foreground">Vue d'ensemble de la performance opérationnelle.</p>
      </div>

      {/* KPI CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu Total (Est.)</CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString('fr-CD')} FC</div>
            <p className="text-xs text-muted-foreground">+20.1% par rapport au mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Hebdo</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shipments.length}</div>
            <p className="text-xs text-muted-foreground">Colis sur les 7 derniers jours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'Incidents</CardTitle>
            <AlertOctagon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{issuesCount}</div>
            <p className="text-xs text-muted-foreground">Colis bloqués ou perdus</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground">Taux de livraison réussi</p>
          </CardContent>
        </Card>

      </div>

      {/* GRAPHIQUES */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Le composant Client reçoit les données calculées par le Serveur */}
        <VolumeChart data={chartData} />

        {/* Placeholder pour un futur PieChart (Répartition par région) */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Répartition par Statut</CardTitle>
            <CardDescription>État actuel du réseau</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border rounded bg-slate-50 dark:bg-slate-900 text-muted-foreground text-sm">
              Graphique circulaire ici (Phase 3)
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}