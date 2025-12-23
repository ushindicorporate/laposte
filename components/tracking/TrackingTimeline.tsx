// components/tracking/TrackingTimeline.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, Truck, MapPin, CheckCircle, 
  XCircle, Clock, AlertTriangle, User
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TrackingEvent {
  id: string;
  status: string;
  description: string | null;
  created_at: string;
  location_agency?: {
    name: string;
  } | null;
  scanned_by?: {
    profiles?: {
      full_name: string;
    };
  } | null;
}

interface TrackingTimelineProps {
  events: TrackingEvent[];
}

export function TrackingTimeline({ events }: TrackingTimelineProps) {
  const getEventIcon = (status: string) => {
    switch (status) {
      case 'CREATED':
        return <Package className="h-5 w-5" />;
      case 'RECEIVED':
      case 'IN_TRANSIT':
        return <Truck className="h-5 w-5" />;
      case 'ARRIVED_AT_DESTINATION':
        return <MapPin className="h-5 w-5" />;
      case 'DELIVERED':
        return <CheckCircle className="h-5 w-5" />;
      case 'FAILED_DELIVERY':
        return <XCircle className="h-5 w-5" />;
      case 'ON_HOLD':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

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
      case 'FAILED_DELIVERY':
        return 'bg-red-100 text-red-800';
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-800';
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Aucun événement</h3>
        <p className="text-muted-foreground">
          Aucun événement de tracking n'a été enregistré
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-4">
          {/* Timeline dot */}
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(event.status)}`}>
              {getEventIcon(event.status)}
            </div>
            {index < events.length - 1 && (
              <div className="flex-1 w-px bg-border mt-2"></div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(event.status)}>
                  {getStatusLabel(event.status)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(event.created_at), 'PPP à pp', { locale: fr })}
                </span>
              </div>
              
              {event.location_agency && (
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {event.location_agency.name}
                </div>
              )}
            </div>

            {event.description && (
              <p className="text-sm mb-2">{event.description}</p>
            )}

            {event.scanned_by && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                {event.scanned_by.profiles?.full_name || 'Agent'}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}