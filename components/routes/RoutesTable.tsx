'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, Route as RouteIcon, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';
import { DataTable } from '../table/data-table';
import { toast } from 'sonner';
import { RouteWithRelations } from '@/lib/types/route';
import { deleteRoute } from '@/actions/route';

interface RoutesTableProps {
  routes: RouteWithRelations[];
}

export function RoutesTable({ routes }: RoutesTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la route "${name}" ?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await deleteRoute(id);
      
      if (result.success) {
        toast.success('Route supprimée avec succès');
      } else {
        toast.error(result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setDeletingId(null);
    }
  };

  const columns: ColumnDef<RouteWithRelations>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <div className="font-mono font-bold flex items-center gap-2">
          <RouteIcon className="h-4 w-4 text-blue-500" />
          {row.getValue("code")}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("name")}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.origin_agency?.name} → {row.original.destination_agency?.name}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "details",
      header: "Détails",
      cell: ({ row }) => {
        const route = row.original;
        return (
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{route.estimated_duration_minutes} min</span>
            </div>
            {route.distance_km && (
              <div className="flex items-center gap-1">
                <span>📏</span>
                <span>{route.distance_km} km</span>
              </div>
            )}
            {route.route_stops && route.route_stops.length > 0 && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{route.route_stops.length} arrêt(s)</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "transport",
      header: "Transport",
      cell: ({ row }) => {
        const route = row.original;
        const transportIcons = {
          ROAD: '🚚',
          AIR: '✈️',
          RAIL: '🚆',
          MARITIME: '🚢',
          OTHER: '📦',
        };
        
        const frequencyLabels = {
          DAILY: 'Quotidien',
          WEEKLY: 'Hebdomadaire',
          BIWEEKLY: 'Bi-hebdomadaire',
          MONTHLY: 'Mensuel',
          ON_DEMAND: 'Sur demande',
        };

        return (
          <div className="space-y-1">
            <Badge variant="outline" className="text-xs">
              {transportIcons[route.transport_type as keyof typeof transportIcons] || '📦'} 
              {route.transport_type}
            </Badge>
            <div className="text-xs text-muted-foreground">
              {frequencyLabels[route.frequency as keyof typeof frequencyLabels] || route.frequency}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => {
        const route = row.original;
        return (
          <Badge variant={route.is_active ? "default" : "secondary"}>
            {route.is_active ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const route = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Link href={`/dashboard/routes/${route.id}`}>
              <Button variant="ghost" size="icon" title="Voir détails">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/dashboard/routes/${route.id}/edit`}>
              <Button variant="ghost" size="icon" title="Modifier">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(route.id, route.name)}
              disabled={deletingId === route.id}
              className="text-destructive hover:text-destructive"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={routes}
      searchKey="name"
      placeholder="Rechercher une route..."
    />
  );
}