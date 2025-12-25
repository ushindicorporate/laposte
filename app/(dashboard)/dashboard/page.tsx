import { Metadata } from "next"
import { getDashboardStats } from "@/actions/dashboard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { OverviewChart } from "@/components/dashboard/overview-chart"
import { DollarSign, Package, Activity, Truck } from "lucide-react"
import { AgencyList } from "@/components/dashboard/agency-chart"

export const metadata: Metadata = { title: "Tableau de Bord" }

export default async function DashboardPage() {
  const { kpi, charts } = await getDashboardStats()

  return (
    <div className="space-y-6">
      
      {/* KPI CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu Total (30j)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.revenue.toLocaleString()} $</div>
            <p className="text-xs text-muted-foreground">+20.1% par rapport au mois dernier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colis Expédiés</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{kpi.shipments}</div>
            <p className="text-xs text-muted-foreground">Volume mensuel</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Livraison</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.deliveryRate}%</div>
            <p className="text-xs text-muted-foreground">Efficacité réseau</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {/* On cherche le statut IN_TRANSIT dans les stats */}
                {charts.status.find((s: any) => s.status === 'IN_TRANSIT')?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">Actuellement sur la route</p>
          </CardContent>
        </Card>
      </div>

      {/* GRAPHIQUES */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* GRANDE COLONNE : VOLUME */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Activité Journalière</CardTitle>
            <CardDescription>Volume des colis traités sur les 14 derniers jours.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewChart data={charts.daily} />
          </CardContent>
        </Card>

        {/* PETITE COLONNE : CLASSEMENT */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Agences</CardTitle>
            <CardDescription>Performance financière ce mois-ci.</CardDescription>
          </CardHeader>
          <CardContent>
            <AgencyList data={charts.agency} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}