'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Plus, Search, Package, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchShipments()
  }, [])

  async function fetchShipments() {
    setLoading(true)
    // On récupère les colis avec les infos des villes d'origine et destination
    const { data, error } = await supabase
      .from('shipments')
      .select(`
        *,
        origin:origin_agency_id(name, city_id),
        destination:destination_agency_id(name)
      `)
      .order('created_at', { ascending: false })

    if (!error && data) setShipments(data)
    setLoading(false)
  }

  // Fonction pour colorer les statuts
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED': return 'bg-gray-500 hover:bg-gray-600'
      case 'IN_TRANSIT': return 'bg-blue-500 hover:bg-blue-600'
      case 'DELIVERED': return 'bg-green-600 hover:bg-green-700'
      case 'ISSUE': return 'bg-red-500 hover:bg-red-600'
      default: return 'bg-slate-500'
    }
  }

  // Filtrage simple
  const filteredShipments = shipments.filter(s => 
    s.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.recipient_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      
      {/* Header de la page */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Gestion des Envois</h1>
          <p className="text-muted-foreground">Suivez et gérez les colis du réseau national.</p>
        </div>
        <Link href="/dashboard/shipments/new">
          <Button className="bg-primary hover:bg-blue-700 text-white gap-2">
            <Plus size={18} />
            Nouvel Envoi
          </Button>
        </Link>
      </div>

      {/* Barre de recherche et stats */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par N° de suivi ou destinataire..."
            className="pl-9 bg-white dark:bg-slate-950"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tableau des données */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Colis récents</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10">Chargement des données...</div>
          ) : filteredShipments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground flex flex-col items-center">
              <Package className="h-12 w-12 mb-2 opacity-20" />
              Aucun colis trouvé.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Suivi</TableHead>
                  <TableHead>Expéditeur</TableHead>
                  <TableHead>Destinataire</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-mono font-bold text-primary">
                      {shipment.tracking_number}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{shipment.sender_name}</div>
                      <div className="text-xs text-muted-foreground">{shipment.sender_phone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{shipment.recipient_name}</div>
                      <div className="text-xs text-muted-foreground">{shipment.recipient_phone}</div>
                    </TableCell>
                    <TableCell>
                      {shipment.destination?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(shipment.status)} text-white border-0`}>
                        {shipment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/tracking?id=${shipment.tracking_number}`}>
                          Voir <ArrowRight className="ml-2 h-3 w-3" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}