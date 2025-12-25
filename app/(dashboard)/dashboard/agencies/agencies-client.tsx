'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit } from "lucide-react"
import { CustomDrawer } from "@/components/ui/custom-drawer"
import { AgencyForm } from "../../../../components/agencies/agency-form"
import { RoleGate } from "../../../../components/auth/role-gate"

interface AgenciesClientProps {
  initialAgencies: any[]
  cities: any[]
}

export function AgenciesClient({ initialAgencies, cities }: AgenciesClientProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  
  // États pour le Drawer
  const [isOpen, setIsOpen] = useState(false)
  const [selectedAgency, setSelectedAgency] = useState<any | null>(null)

  const filtered = initialAgencies.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openCreate = () => {
    setSelectedAgency(null)
    setIsOpen(true)
  }

  const openEdit = (agency: any) => {
    setSelectedAgency(agency)
    setIsOpen(true)
  }

  const closeDrawer = () => {
    setIsOpen(false)
  }

  const handleSuccess = () => {
    setIsOpen(false)
    router.refresh()
  }

  const getTypeLabel = (type: string) => {
    if (type === 'SORTING_CENTER') return 'Centre de Tri'
    if (type === 'HEADQUARTERS') return 'Siège'
    if (type === 'RELAY_POINT') return 'Point Relais'
    return 'Bureau de Poste'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher une agence..." 
            className="pl-8 w-75" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <RoleGate allowedRoles={['SUPER_ADMIN']}>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle Agence
          </Button>
        </RoleGate>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((agency) => (
              <TableRow key={agency.id}>
                <TableCell className="font-mono">{agency.code}</TableCell>
                <TableCell className="font-medium">{agency.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {getTypeLabel(agency.type)}
                  </Badge>
                </TableCell>
                <TableCell>{agency.city?.name}</TableCell>
                <TableCell>
                  <Badge variant={agency.is_active ? "default" : "secondary"}>
                    {agency.is_active ? "Ouverte" : "Fermée"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                   <Button variant="ghost" size="icon" onClick={() => openEdit(agency)}>
                     <Edit className="h-4 w-4" />
                   </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* CUSTOM DRAWER */}
      <CustomDrawer
        isOpen={isOpen}
        onClose={closeDrawer}
        title={selectedAgency ? "Modifier l'agence" : "Nouvelle Agence"}
        description={selectedAgency ? "Mise à jour des informations." : "Création d'un point de présence."}
      >
        <AgencyForm 
          // La key est vitale pour le reset du formulaire
          key={selectedAgency ? selectedAgency.id : 'new'}
          initialData={selectedAgency}
          cities={cities}
          onSuccess={handleSuccess}
          onCancel={closeDrawer}
        />
      </CustomDrawer>
    </div>
  )
}