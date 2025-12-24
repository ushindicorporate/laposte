// app/tracking/[trackingNumber]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrackingTimeline } from '@/components/tracking/TrackingTimeline';
import { 
  Package, Search, MapPin, User, Phone, 
  Calendar, Truck, Shield 
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/server';

interface PublicTrackingPageProps {
  params: Promise<{
    trackingNumber: string;
  }>;
}

export async function generateMetadata({ params }: PublicTrackingPageProps): Promise<Metadata> {
  const { trackingNumber } = await params;
  return {
    title: `Suivi ${trackingNumber} - Système Postal`,
    description: `Suivez votre colis ${trackingNumber}`,
  };
}

export default async function PublicTrackingPage({ params }: PublicTrackingPageProps) {
  const { trackingNumber } = await params;
  const supabase = await createClient();
  
  // Récupérer l'envoi (sans données sensibles)
  const { data: shipment, error } = await supabase
    .from('shipments')
    .select(`
      id,
      tracking_number,
      status,
      created_at,
      estimated_delivery_date,
      origin_agency:agencies(name, city:cities(name)),
      destination_agency:agencies(name, city:cities(name))
    `)
    .eq('tracking_number', trackingNumber)
    .single();
  
  if (error || !shipment) {
    notFound();
  }
  
  // Récupérer les événements de tracking
  const { data: events } = await supabase
    .from('tracking_events')
    .select(`
      id,
      status,
      description,
      created_at,
      location_agency:agencies(name)
    `)
    .eq('shipment_id', shipment.id)
    .order('created_at', { ascending: false });
  
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      CREATED: 'Créé',
      RECEIVED: 'Reçu',
      IN_TRANSIT: 'En transit',
      ARRIVED_AT_DESTINATION: 'Arrivé à destination',
      OUT_FOR_DELIVERY: 'En livraison',
      DELIVERED: 'Livré',
      FAILED_DELIVERY: 'Échec livraison',
      RETURNED: 'Retourné',
      CANCELLED: 'Annulé',
      ON_HOLD: 'En attente'
    };
    return labels[status] || status;
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-800';
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Truck className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Suivi de Colis</h1>
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">
            Suivez votre colis en temps réel
          </p>
        </div>
        
        {/* Carte principale */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            {/* Numéro de suivi */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Numéro de suivi</span>
              </div>
              <div className="text-2xl font-bold font-mono tracking-wider">
                {shipment.tracking_number}
              </div>
              <Badge className={`mt-2 ${getStatusColor(shipment.status)}`}>
                {getStatusLabel(shipment.status)}
              </Badge>
            </div>
            
            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Trajet
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <div className="text-muted-foreground">Origine</div>
                    <div>{shipment.origin_agency?.name || 'N/A'}</div>
                    {shipment.origin_agency?.city && (
                      <div className="text-muted-foreground">
                        {shipment.origin_agency.city.name}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-muted-foreground">Destination</div>
                    <div>{shipment.destination_agency?.name || 'N/A'}</div>
                    {shipment.destination_agency?.city && (
                      <div className="text-muted-foreground">
                        {shipment.destination_agency.city.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Dates
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <div className="text-muted-foreground">Date d'envoi</div>
                    <div>
                      {format(new Date(shipment.created_at), 'PPP', { locale: fr })}
                    </div>
                  </div>
                  {shipment.estimated_delivery_date && (
                    <div>
                      <div className="text-muted-foreground">Livraison estimée</div>
                      <div>
                        {format(new Date(shipment.estimated_delivery_date), 'PPP', { locale: fr })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Timeline */}
            <div>
              <h3 className="font-semibold mb-4">Historique du suivi</h3>
              {events && events.length > 0 ? (
                <TrackingTimeline events={events} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun événement de tracking disponible
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Rechercher un autre colis */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Suivre un autre colis</h3>
            <form action="/tracking" method="GET" className="flex gap-2">
              <Input
                name="trackingNumber"
                placeholder="Entrez un numéro de suivi"
                required
              />
              <Button type="submit" className="gap-2">
                <Search className="h-4 w-4" />
                Suivre
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Information de contact */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Besoin d'aide ? Contactez notre service client au 123-456-789</p>
          <p className="mt-1">© {new Date().getFullYear()} Système Postal National - Tous droits réservés</p>
        </div>
      </div>
    </div>
  );
}