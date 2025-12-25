'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Truck, Plane, Ship, Train, Milestone } from "lucide-react"
import { CustomDrawer } from "@/components/ui/custom-drawer"
import { RoleGate } from "../../../../components/auth/role-gate"
import { RouteForm } from "../../../../components/routes/route-form"
import { RouteStopsManager } from "../../../../components/routes/route-stops-manager"

interface RoutesClientProps {
  initialRoutes: any[]
  agencies: any[]
}

export function RoutesClient({ initialRoutes, agencies }: RoutesClientProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<any | null>(null)
  const [managingStops, setManagingStops] = useState<any | null>(null)

  const openStops = (route: any) => {
    setManagingStops(route)
  }

  const closeStops = () => {
    setManagingStops(null)
  }

  const filtered = initialRoutes.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openCreate = () => {
    setSelectedRoute(null)
    setIsOpen(true)
  }

  const openEdit = (route: any) => {
    setSelectedRoute(route)
    setIsOpen(true)
  }

  const handleSuccess = () => {
    setIsOpen(false)
    router.refresh()
  }

  const getTransportIcon = (type: string) => {
    switch(type) {
        case 'AIR': return <Plane className="h-4 w-4" />
        case 'WATER': return <Ship className="h-4 w-4" />
        case 'RAIL': return <Train className="h-4 w-4" />
        default: return <Truck className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher un trajet..." 
            className="pl-8 w-75" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <RoleGate allowedRoles={['SUPER_ADMIN', 'REGIONAL_MANAGER']}>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Nouveau Trajet
          </Button>
        </RoleGate>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Transport</TableHead>
              <TableHead>Origine {"->"} Destination</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((route) => (
              <TableRow key={route.id}>
                <TableCell className="font-mono">{route.code}</TableCell>
                <TableCell className="font-medium">{route.name}</TableCell>
                <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        {getTransportIcon(route.transport_type)}
                        <span className="text-xs">{route.transport_type}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{route.origin?.code}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium">{route.destination?.code}</span>
                    </div>
                </TableCell>
                <TableCell>
                  <Badge variant={route.is_active ? "default" : "secondary"}>
                    {route.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                      {/* Bouton Stops */}
                      <Button variant="ghost" size="icon" onClick={() => openStops(route)} title="Gérer les arrêts">
                        <Milestone className="h-4 w-4 text-blue-600" />
                      </Button>
                      
                      <Button variant="ghost" size="icon" onClick={() => openEdit(route)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CustomDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={selectedRoute ? "Modifier le trajet" : "Nouveau Trajet"}
        description="Configuration des liaisons logistiques."
      >
        <RouteForm 
          key={selectedRoute ? selectedRoute.id : 'new'}
          initialData={selectedRoute}
          agencies={agencies}
          onSuccess={handleSuccess}
          onCancel={() => setIsOpen(false)}
        />
      </CustomDrawer>
      <CustomDrawer
        isOpen={!!managingStops}
        onClose={closeStops}
        title="Gestion des Arrêts"
        description={`Configuration de la ligne ${managingStops?.code}`}
      >
        {managingStops && (
            <RouteStopsManager 
                route={managingStops}
                agencies={agencies} // On passe la liste complète des agences
            />
        )}
      </CustomDrawer>
    </div>
  )
}