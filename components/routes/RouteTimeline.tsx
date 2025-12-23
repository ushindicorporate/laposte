'use client';

import { Agency } from '@/lib/types/database';
import { MapPin, Clock, CheckCircle, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RouteStopWithAgency } from '@/lib/types/route';

interface RouteTimelineProps {
  origin: Agency;
  destination: Agency;
  stops: RouteStopWithAgency[];
  duration?: number | null;
}

export function RouteTimeline({ origin, destination, stops, duration }: RouteTimelineProps) {
  const allStops = [
    { type: 'origin', agency: origin, order: 0 },
    ...stops.sort((a, b) => a.stop_order - b.stop_order).map(stop => ({
      type: 'stop' as const,
      agency: stop.agency,
      stop,
      order: stop.stop_order,
    })),
    { type: 'destination', agency: destination, order: stops.length + 1 },
  ];

  return (
    <div className="space-y-4">
      {allStops.map((item, index) => (
        <div key={item.agency.id} className="flex items-start">
          {/* Ligne de connexion */}
          {index < allStops.length - 1 && (
            <div className="flex flex-col items-center mr-4">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                item.type === 'origin' 
                  ? 'bg-green-100 text-green-600' 
                  : item.type === 'destination'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-blue-100 text-blue-600'
              }`}>
                {item.type === 'origin' ? (
                  <MapPin className="h-3 w-3" />
                ) : item.type === 'destination' ? (
                  <MapPin className="h-3 w-3" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </div>
              <div className="w-0.5 h-8 bg-slate-200 my-1" />
            </div>
          )}

          {index === allStops.length - 1 && (
            <div className="mr-4">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                item.type === 'destination' 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                <MapPin className="h-3 w-3" />
              </div>
            </div>
          )}

          {/* Contenu */}
          <div className="flex-1 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{item.agency.name}</div>
                <div className="text-sm text-muted-foreground">
                  {item.agency.cities?.name} • {item.agency.code}
                </div>
              </div>
              
              {item.type === 'stop' && (
                <Badge variant={item.stop.is_mandatory ? "default" : "outline"}>
                  {item.stop.is_mandatory ? 'Obligatoire' : 'Optionnel'}
                </Badge>
              )}
            </div>

            {/* Détails des arrêts */}
            {item.type === 'stop' && (
              <div className="mt-2 space-y-1 text-sm">
                {item.stop.estimated_arrival_minutes && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Arrivée: {item.stop.estimated_arrival_minutes} min</span>
                  </div>
                )}
                {item.stop.estimated_departure_minutes && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Départ: {item.stop.estimated_departure_minutes} min</span>
                  </div>
                )}
                {item.stop.notes && (
                  <div className="text-muted-foreground italic">
                    "{item.stop.notes}"
                  </div>
                )}
              </div>
            )}

            {/* Labels */}
            <div className="mt-2">
              {item.type === 'origin' && (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Point de départ
                </Badge>
              )}
              {item.type === 'destination' && (
                <Badge variant="outline" className="bg-red-50 text-red-700">
                  Point d'arrivée
                </Badge>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Durée totale */}
      {duration && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Durée totale estimée</span>
            </div>
            <div className="text-lg font-bold text-blue-700">
              {duration} minutes
            </div>
          </div>
          <div className="text-sm text-blue-600 mt-1">
            {Math.floor(duration / 60)}h {duration % 60}min
          </div>
        </div>
      )}
    </div>
  );
}