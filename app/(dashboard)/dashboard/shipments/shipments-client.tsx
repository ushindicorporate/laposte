'use client'

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Search, Plus, Eye, Box, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "../../../../components/shipments/status-badge"
import { RoleGate } from "../../../../components/auth/role-gate"

interface ShipmentsClientProps {
  initialShipments: any[]
}

export function ShipmentsClient({ initialShipments }: ShipmentsClientProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

  const filtered = initialShipments.filter(s => 
    s.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.sender_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.recipient_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher (Tracking, Noms)..." 
            className="pl-8 w-87.5" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <RoleGate allowedRoles={['SUPER_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
          <Link href="/dashboard/shipments/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nouvel Envoi
            </Button>
          </Link>
        </RoleGate>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tracking</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Expéditeur / Destinataire</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Prix</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Aucun envoi trouvé.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id} className="group">
                  <TableCell className="font-mono font-medium">
                    <div className="flex items-center gap-2">
                        {s.type === 'DOCUMENT' ? <FileText className="h-3 w-3 text-muted-foreground" /> : <Box className="h-3 w-3 text-muted-foreground" />}
                        {s.tracking_number}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(s.created_at), "d MMM HH:mm", { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold">{s.origin?.city?.name}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-semibold">{s.destination?.city?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                        <span className="font-medium truncate max-w-37.5">{s.sender_name}</span>
                        <span className="text-muted-foreground truncate max-w-37.5">vers {s.recipient_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {s.total_price} $
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/shipments/${s.tracking_number}`}>
                        <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}