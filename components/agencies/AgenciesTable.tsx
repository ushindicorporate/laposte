// /components/agencies/AgenciesTable.tsx
'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, MapPin, Building2, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '../table/data-table';
import { AgencyStatusToggle } from './AgencyStatusToggle';
import { DeleteAgencyDialog } from './DeleteAgencyDialog';

interface Agency {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  city_id: string;
  cities: {
    id: string;
    name: string;
    postal_code: string | null;
    regions: {
      id: string;
      name: string;
    };
  };
  _count?: {
    profiles?: number;
    shipments_origin?: number;
    shipments_destination?: number;
  };
}

interface Region {
  id: string;
  name: string;
}

interface AgenciesTableProps {
  agencies: Agency[];
  regions: Region[];
}

export function AgenciesTable({ agencies, regions }: AgenciesTableProps) {
  const [agencyToDelete, setAgencyToDelete] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [showInactive, setShowInactive] = useState<boolean>(false);
  
  // Filtrer les agences
  const filteredAgencies = agencies.filter(agency => {
    // Filtre par région
    if (selectedRegion !== 'all' && agency.cities.regions.id !== selectedRegion) {
      return false;
    }
    // Filtre actif/inactif
    if (!showInactive && !agency.is_active) {
      return false;
    }
    return true;
  });
  
  const columns: ColumnDef<Agency>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <div className="font-mono font-bold">{row.getValue("code")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("name")}</div>
          {row.original.address && (
            <div className="text-xs text-muted-foreground truncate max-w-50">
              {row.original.address}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "cities.regions.name",
      header: "Région → Ville",
      cell: ({ row }) => {
        const city = row.original.cities;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-blue-500" />
              <span className="text-sm">{city.regions.name}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              <Building2 className="mr-1 h-3 w-3" />
              {city.name} {city.postal_code ? `(${city.postal_code})` : ''}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "contact",
      header: "Contact",
      cell: ({ row }) => {
        const agency = row.original;
        return (
          <div className="space-y-1 text-sm">
            {agency.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>{agency.phone}</span>
              </div>
            )}
            {agency.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span className="truncate max-w-37.5">{agency.email}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "stats",
      header: "Statistiques",
      cell: ({ row }) => {
        const counts = row.original._count;
        return (
          <div className="space-y-1">
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                👤 {counts?.profiles || 0}
              </Badge>
              <Badge variant="outline" className="text-xs">
                📦 {((counts?.shipments_origin || 0) + (counts?.shipments_destination || 0))}
              </Badge>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => {
        const agency = row.original;
        return (
          <AgencyStatusToggle
            agencyId={agency.id}
            isActive={agency.is_active}
            onToggle={() => {
              // Rafraîchir après toggle
              window.location.reload();
            }}
          />
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const agency = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Link href={`/dashboard/agencies/${agency.id}`}>
              <Button variant="ghost" size="icon">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/dashboard/agencies/${agency.id}/edit`}>
              <Button variant="ghost" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAgencyToDelete(agency.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  // Compter les statistiques
  const stats = {
    total: agencies.length,
    active: agencies.filter(a => a.is_active).length,
    byRegion: regions.map(region => ({
      ...region,
      count: agencies.filter(a => a.cities.regions.id === region.id).length
    }))
  };

  return (
    <>
      {/* Filtres et statistiques */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Filtrer par région :</span>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-50">
                  <SelectValue placeholder="Toutes les régions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les régions</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name} ({stats.byRegion.find(r => r.id === region.id)?.count || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showInactive"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="showInactive" className="text-sm">
                Afficher les agences inactives
              </label>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="px-3 py-1 bg-blue-50 rounded-full">
              <span className="font-medium">{filteredAgencies.length}</span> agence(s)
            </div>
            <div className="px-3 py-1 bg-green-50 rounded-full">
              <span className="font-medium text-green-600">{stats.active}</span> active(s)
            </div>
            <div className="px-3 py-1 bg-slate-50 rounded-full">
              <span className="font-medium">{stats.total - stats.active}</span> inactive(s)
            </div>
          </div>
        </div>
        
        {/* Distribution par région */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {stats.byRegion.map(region => (
            <div 
              key={region.id}
              className={`p-2 rounded border text-center cursor-pointer ${selectedRegion === region.id ? 'bg-blue-50 border-blue-200' : 'bg-slate-50'}`}
              onClick={() => setSelectedRegion(region.id === selectedRegion ? 'all' : region.id)}
            >
              <div className="font-medium text-sm">{region.name}</div>
              <div className="text-lg font-bold">{region.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <DataTable
        columns={columns}
        data={filteredAgencies}
        searchKey="name"
        placeholder="Rechercher une agence..."
        enableRowSelection={true}
      />
      
      <DeleteAgencyDialog
        agencyId={agencyToDelete}
        onClose={() => setAgencyToDelete(null)}
      />
    </>
  );
}