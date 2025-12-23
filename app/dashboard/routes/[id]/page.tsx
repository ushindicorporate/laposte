import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, Clock, Route, Calendar, Truck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getRouteById } from '@/actions/route';

interface RouteDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: RouteDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const response = await getRouteById(id);
  
  return {
    title: response.success ? `Route ${response.data?.code}` : 'Route non trouvée',
  };
}

export default async function RouteDetailPage({ params }: RouteDetailPageProps) {
  const { id } = await params;
  const response = await getRouteById(id);

  if (!response.success || !response.data) {
    notFound();
  }

  const route = response.data;

  const formatTime = (time: string) => {
    if (!time) return 'Non défini';
    const [hours, minutes] = time.split(':');
    return `${hours}h${minutes}`;
  };

  const getTransportIcon = (type: string) => {
    const icons = {
      ROAD: '🚚',
      AIR: '✈️',
      RAIL: '🚆',
      MARITIME: '🚢',
      OTHER: '📦',
    };
    return icons[type as keyof typeof icons] || '📦';
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels = {
      DAILY: 'Quotidien',
      WEEKLY: 'Hebdomadaire',
      BIWEEKLY: 'Bi-hebdomadaire',
      MONTHLY: 'Mensuel',
      ON_DEMAND: 'Sur demande',
    };
    return labels[frequency as keyof typeof labels] || frequency;
  };

  return (
    <div className="container mx-auto p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/routes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{route.name}</h1>
            <p className="text-muted-foreground">
              Code: {route.code} • {route.origin_agency?.name} → {route.destination_agency?.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/routes/${route.id}/edit`}>
            <Button>Modifier</Button>
          </Link>
          <Badge variant={route.is_active ? "default" : "destructive"}>
            {route.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Informations principales */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Informations de la route
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Origine et Destination */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Origine</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <div>
                          <div className="font-medium">{route.origin_agency?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {route.origin_agency?.cities?.name}
                          </div>
                        </div>
                      </div>
                      <div className="pl-6 text-sm">
                        <div>Code: {route.origin_agency?.code}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Destination</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-500" />
                        <div>
                          <div className="font-medium">{route.destination_agency?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {route.destination_agency?.cities?.name}
                          </div>
                        </div>
                      </div>
                      <div className="pl-6 text-sm">
                        <div>Code: {route.destination_agency?.code}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Détails techniques */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Caractéristiques</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Distance</span>
                        <span className="font-medium">
                          {route.distance_km ? `${route.distance_km} km` : 'Non définie'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Durée estimée</span>
                        <span className="font-medium">
                          {route.estimated_duration_minutes ? `${route.estimated_duration_minutes} min` : 'Non définie'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Type de transport</span>
                        <Badge variant="outline">
                          {getTransportIcon(route.transport_type)} {route.transport_type}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Fréquence</span>
                        <Badge variant="outline">
                          <Calendar className="mr-1 h-3 w-3" />
                          {getFrequencyLabel(route.frequency)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Horaires */}
                  {(route.departure_time || route.arrival_time) && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Horaires</h3>
                      <div className="space-y-2">
                        {route.departure_time && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span>Départ: {formatTime(route.departure_time)}</span>
                          </div>
                        )}
                        {route.arrival_time && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-green-500" />
                            <span>Arrivée: {formatTime(route.arrival_time)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Métadonnées */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Date de création</div>
                  <div>
                    {new Date(route.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Dernière modification</div>
                  <div>
                    {new Date(route.updated_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Arrêts intermédiaires</div>
                  <div className="font-medium">
                    {route.route_stops?.length || 0} arrêt(s)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline des arrêts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Parcours de la route
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RouteTimeline 
                origin={route.origin_agency}
                destination={route.destination_agency}
                stops={route.route_stops || []}
                duration={route.estimated_duration_minutes}
              />
            </CardContent>
          </Card>
        </div>

        {/* Liste des arrêts détaillée */}
        {route.route_stops && route.route_stops.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Arrêts intermédiaires</CardTitle>
              <p className="text-sm text-muted-foreground">
                {route.route_stops.length} arrêt(s) entre {route.origin_agency?.name} et {route.destination_agency?.name}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {route.route_stops
                  .sort((a, b) => a.stop_order - b.stop_order)
                  .map((stop) => (
                    <div key={stop.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="font-bold text-blue-600">{stop.stop_order}</span>
                          </div>
                          <div>
                            <div className="font-medium">{stop.agency?.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {stop.agency?.cities?.name} • Code: {stop.agency?.code}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {stop.is_mandatory && (
                            <Badge variant="default">Obligatoire</Badge>
                          )}
                          {!stop.is_mandatory && (
                            <Badge variant="outline">Optionnel</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Arrivée estimée</div>
                          <div className="font-medium">
                            {stop.estimated_arrival_minutes 
                              ? `${stop.estimated_arrival_minutes} min après départ`
                              : 'Non défini'
                            }
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Départ estimé</div>
                          <div className="font-medium">
                            {stop.estimated_departure_minutes 
                              ? `${stop.estimated_departure_minutes} min après départ`
                              : 'Non défini'
                            }
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Temps d'arrêt</div>
                          <div className="font-medium">
                            {stop.estimated_arrival_minutes && stop.estimated_departure_minutes
                              ? `${stop.estimated_departure_minutes - stop.estimated_arrival_minutes} min`
                              : 'Non défini'
                            }
                          </div>
                        </div>
                      </div>

                      {stop.notes && (
                        <div className="mt-3 p-3 bg-slate-50 rounded text-sm">
                          <div className="text-muted-foreground mb-1">Notes:</div>
                          <div>{stop.notes}</div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href={`/dashboard/routes/${route.id}/edit`}>
                <Button variant="outline">Modifier la route</Button>
              </Link>
              <Button variant="outline">Voir sur la carte</Button>
              <Link href={`/dashboard/shipments?route=${route.id}`}>
                <Button variant="outline">Voir les envois</Button>
              </Link>
              <Button variant="outline" disabled={!route.is_active}>
                Planifier un transport
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}