// /components/regions/RegionsTable.tsx
'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import { DeleteRegionDialog } from './DeleteRegionDialog'
import { DataTable } from '../table/data-table'

interface Region {
  id: string
  name: string
  code: string | null
  created_at: string
  _count?: {
    cities?: number
  }
}

interface RegionsTableProps {
  regions: Region[]
}

export function RegionsTable({ regions }: RegionsTableProps) {
  const [regionToDelete, setRegionToDelete] = useState<string | null>(null)

  const columns: ColumnDef<Region>[] = [
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.getValue("name")}</span>
          {row.original.code && (
            <span className="text-xs text-muted-foreground">
              Code : {row.original.code}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => {
        const code = row.getValue("code") as string | null
        return code ? (
          <Badge variant="outline">{code}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: "_count.cities",
      header: "Villes",
      cell: ({ row }) => {
        const count = row.original._count?.cities || 0;
        return (
          <div className="flex items-center gap-2">
            <Badge variant={count > 0 ? "default" : "secondary"}>
              {count}
            </Badge>
            {count > 0 && (
              <Link 
                href={`/dashboard/cities?region=${row.original.id}`}
                className="text-xs text-primary hover:underline"
              >
                Voir
              </Link>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Créé le",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"))
        return date.toLocaleDateString("fr-FR")
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const region = row.original
        return (
          <div className="flex justify-end gap-2">
            <Link href={`/dashboard/regions/${region.id}`}>
              <Button variant="ghost" size="icon">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/dashboard/regions/${region.id}/edit`}>
              <Button variant="ghost" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRegionToDelete(region.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  const handleDeleteSelected = (selectedRows: Region[]) => {
    // Implémenter la suppression multiple si besoin
    console.log('Supprimer plusieurs:', selectedRows)
  }

  const handleExportSelected = (selectedRows: Region[]) => {
    // Implémenter l'export CSV
    console.log('Exporter:', selectedRows)
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={regions}
        searchKey="name"
        placeholder="Rechercher une région..."
        onDeleteSelected={handleDeleteSelected}
        onExportSelected={handleExportSelected}
        enableRowSelection={true}
      />
      
      <DeleteRegionDialog
        regionId={regionToDelete}
        onClose={() => setRegionToDelete(null)}
      />
    </>
  )
}