// /components/cities/CitiesTable.tsx
'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, MapPin } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '../table/data-table';
import { DeleteCityDialog } from './DeleteCityDialog';

interface City {
  id: string;
  name: string;
  postal_code: string | null;
  population: number | null;
  created_at: string;
  region_id: string;
  regions: {
    id: string;
    name: string;
  };
  _count?: {
    agencies?: number;
  };
}

interface Region {
  id: string;
  name: string;
}

interface CitiesTableProps {
  cities: City[];
  regions: Region[];
}

export function CitiesTable({ cities, regions }: CitiesTableProps) {
  const [cityToDelete, setCityToDelete] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  
  // Filtrer les villes par région
  const filteredCities = selectedRegion === 'all' 
    ? cities 
    : cities.filter(city => city.region_id === selectedRegion);
  
  const columns: ColumnDef<City>[] = [
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "regions.name",
      header: "Région",
      cell: ({ row }) => {
        const regionName = row.original.regions?.name || "Non assigné";
        return (
          <Badge variant="outline" className="bg-blue-50">
            <MapPin className="mr-1 h-3 w-3" />
            {regionName}
          </Badge>
        );
      },
    },
    {
      accessorKey: "postal_code",
      header: "Code postal",
      cell: ({ row }) => {
        const postalCode = row.getValue("postal_code") as string | null;
        return postalCode ? (
          <span className="font-mono">{postalCode}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "population",
      header: "Population",
      cell: ({ row }) => {
        const population = row.getValue("population") as number | null;
        return population ? (
          <span className="font-medium">
            {population.toLocaleString('fr-FR')}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "_count.agencies",
      header: "Agences",
      cell: ({ row }) => {
        const count = row.original._count?.agencies || 0;
        return (
          <Badge variant={count > 0 ? "default" : "secondary"}>
            {count} agence(s)
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const city = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Link href={`/dashboard/cities/${city.id}`}>
              <Button variant="ghost" size="icon">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/dashboard/cities/${city.id}/edit`}>
              <Button variant="ghost" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCityToDelete(city.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const handleDeleteSelected = (selectedRows: City[]) => {
    // Implémenter la suppression multiple si besoin
    console.log('Supprimer plusieurs villes:', selectedRows);
  };

  const handleExportSelected = (selectedRows: City[]) => {
    // Implémenter l'export CSV
    console.log('Exporter villes:', selectedRows);
  };

  return (
    <>
      {/* Filtre par région */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Filtrer par région :</span>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Toutes les régions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les régions</SelectItem>
              {regions.map((region) => (
                <SelectItem key={region.id} value={region.id}>
                  {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredCities.length} ville(s) {selectedRegion !== 'all' ? 'dans cette région' : 'au total'}
        </div>
      </div>

      {/* Tableau */}
      <DataTable
        columns={columns}
        data={filteredCities}
        searchKey="name"
        placeholder="Rechercher une ville..."
        onDeleteSelected={handleDeleteSelected}
        onExportSelected={handleExportSelected}
        enableRowSelection={true}
      />
      
      <DeleteCityDialog
        cityId={cityToDelete}
        onClose={() => setCityToDelete(null)}
      />
    </>
  );
}