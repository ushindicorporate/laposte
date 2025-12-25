// app/(dashboard)/dashboard/cities/cities-client.tsx
'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Building2 } from "lucide-react"
import { CustomDrawer } from "@/components/ui/custom-drawer"
import { RoleGate } from "../../../../components/auth/role-gate"
import { CityForm } from "../../../../components/cities/city-form"

interface CitiesClientProps {
  initialCities: any[]
  availableRegions: { id: string; name: string }[] // Liste pour le select
}

export function CitiesClient({ initialCities, availableRegions }: CitiesClientProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCity, setSelectedCity] = useState<any | null>(null)

  const filteredCities = initialCities.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.region?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openCreate = () => {
    setSelectedCity(null)
    setIsOpen(true)
  }

  const openEdit = (city: any) => {
    setSelectedCity(city)
    setIsOpen(true)
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
            placeholder="Rechercher une ville..." 
            className="pl-8 w-62.5" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <RoleGate allowedRoles={['SUPER_ADMIN', 'REGIONAL_MANAGER']}>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle Ville
          </Button>
        </RoleGate>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ville</TableHead>
              <TableHead>Région</TableHead>
              <TableHead>Code Postal</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCities.map((city) => (
              <TableRow key={city.id}>
                <TableCell className="font-medium flex items-center gap-2">
                   <Building2 className="h-4 w-4 text-muted-foreground"/> {city.name}
                </TableCell>
                <TableCell>
                  {/* Affichage du nom de la région (jointure) */}
                  <Badge variant="outline">{city.region?.name || "N/A"}</Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">{city.postal_code || "-"}</TableCell>
                <TableCell>
                  <Badge variant={city.is_active ? "default" : "secondary"}>
                    {city.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                   <Button variant="ghost" size="icon" onClick={() => openEdit(city)}>
                     <Edit className="h-4 w-4" />
                   </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CustomDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={selectedCity ? "Modifier la ville" : "Nouvelle Ville"}
        description="Gestion des points de présence urbains."
      >
        <CityForm 
          key={selectedCity ? selectedCity.id : 'new'}
          initialData={selectedCity}
          regions={availableRegions} // On passe la liste des régions au formulaire
          onSuccess={handleSuccess}
          onCancel={() => setIsOpen(false)}
        />
      </CustomDrawer>
    </div>
  )
}