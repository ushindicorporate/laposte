'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, MapPin } from "lucide-react"
import { CustomDrawer } from "@/components/ui/custom-drawer"
import { RegionForm } from "@/components/regions/region-form"
import { RoleGate } from "../../../../components/auth/role-gate"

interface RegionsClientProps {
  initialRegions: any[]
}

export function RegionsClient({ initialRegions }: RegionsClientProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  
  // Gestion d'état
  const [isOpen, setIsOpen] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<any | null>(null)

  const filteredRegions = initialRegions.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openCreate = () => {
    setSelectedRegion(null)
    setIsOpen(true)
  }

  const openEdit = (region: any) => {
    setSelectedRegion(region)
    setIsOpen(true)
  }

  const closeDrawer = () => {
    setIsOpen(false)
  }

  const handleSuccess = () => {
    setIsOpen(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher..." 
            className="pl-8 w-62.5" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <RoleGate allowedRoles={['SUPER_ADMIN']}>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle Région
          </Button>
        </RoleGate>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRegions.map((region) => (
              <TableRow key={region.id}>
                <TableCell className="font-mono">{region.code}</TableCell>
                <TableCell>{region.name}</TableCell>
                <TableCell>
                  <Badge variant={region.is_active ? "default" : "secondary"}>
                    {region.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                   <Button variant="ghost" size="icon" onClick={() => openEdit(region)}>
                     <Edit className="h-4 w-4" />
                   </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* NOTRE DRAWER MAISON */}
      <CustomDrawer
        isOpen={isOpen}
        onClose={closeDrawer}
        title={selectedRegion ? "Modifier la région" : "Nouvelle Région"}
        description={selectedRegion ? "Modification des données." : "Ajout d'une zone au réseau."}
      >
        <RegionForm 
          // La key force le reset du formulaire quand on change de région
          key={selectedRegion ? selectedRegion.id : 'new'}
          initialData={selectedRegion}
          onSuccess={handleSuccess}
          onCancel={closeDrawer}
        />
      </CustomDrawer>
    </div>
  )
}