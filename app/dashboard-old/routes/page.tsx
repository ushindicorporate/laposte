import { Metadata } from 'next';
import { Plus, Route, Map, Filter } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getRoutes } from '@/actions/route';
import { RouteStats } from '@/components/routes/RouteStats';
import { RoutesTable } from '@/components/routes/RoutesTable';

export const metadata: Metadata = {
  title: 'Gestion des Routes',
  description: 'Gérez les routes postales entre agences',
};

export default async function RoutesPage() {
  const routesResponse = await getRoutes();
  
  if (!routesResponse.success) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
          Erreur: {routesResponse.error}
        </div>
      </div>
    );
  }

  const routes = routesResponse.data || [];
  
  // Calculer les statistiques
  const stats = {
    total: routes.length,
    active: routes.filter(r => r.is_active).length,
    road: routes.filter(r => r.transport_type === 'ROAD').length,
    air: routes.filter(r => r.transport_type === 'AIR').length,
    rail: routes.filter(r => r.transport_type === 'RAIL').length,
    daily: routes.filter(r => r.frequency === 'DAILY').length,
    weekly: routes.filter(r => r.frequency === 'WEEKLY').length,
    withStops: routes.filter(r => r.route_stops && r.route_stops.length > 0).length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Routes</h1>
          <p className="text-muted-foreground">
            Planifiez et gérez les routes postales entre agences
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Map className="h-4 w-4" />
            Vue Carte
          </Button>
          <Link href="/dashboard/routes/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle Route
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistiques */}
      <RouteStats stats={stats} />

      {/* Tableau des routes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Toutes les routes ({routes.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {stats.active} active(s) • {stats.total - stats.active} inactive(s)
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <div className="text-center py-12">
              <Route className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Aucune route créée</h3>
              <p className="text-muted-foreground mt-2 mb-6">
                Créez votre première route pour connecter les agences
              </p>
              <Link href="/dashboard/routes/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer une route
                </Button>
              </Link>
            </div>
          ) : (
            <RoutesTable routes={routes} />
          )}
        </CardContent>
      </Card>

      {/* Informations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
        <div>
          🚚 <strong>Routes routières :</strong> {stats.road} route(s) - Transport par route
        </div>
        <div>
          ✈️ <strong>Routes aériennes :</strong> {stats.air} route(s) - Transport aérien
        </div>
        <div>
          🚆 <strong>Routes ferroviaires :</strong> {stats.rail} route(s) - Transport par rail
        </div>
        <div>
          📅 <strong>Quotidiennes :</strong> {stats.daily} route(s) - Service journalier
        </div>
        <div>
          📋 <strong>Hebdomadaires :</strong> {stats.weekly} route(s) - Service hebdomadaire
        </div>
        <div>
          🛑 <strong>Avec arrêts :</strong> {stats.withStops} route(s) avec arrêts intermédiaires
        </div>
      </div>
    </div>
  );
}