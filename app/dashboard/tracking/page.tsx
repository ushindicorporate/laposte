'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { Search, MapPin, Calendar, User, PackageCheck } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function TrackingPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('id') || ''
  
  const [trackingNumber, setTrackingNumber] = useState(initialQuery)
  const [shipment, setShipment] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  
  const supabase = createClient()

  // Si on arrive avec un ID dans l'URL, on cherche direct
  useEffect(() => {
    if (initialQuery) {
      handleSearch()
    }
  }, [initialQuery])

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!trackingNumber) return

    setLoading(true)
    setNotFound(false)
    setShipment(null)

    // 1. Chercher le colis
    const { data: shipmentData, error } = await supabase
      .from('shipments')
      .select(`
        *,
        origin:origin_agency_id(name, cities(name)),
        destination:destination_agency_id(name, cities(name))
      `)
      .eq('tracking_number', trackingNumber)
      .single()

    if (error || !shipmentData) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setShipment(shipmentData)

    // 2. Chercher l'historique
    const { data: eventsData } = await supabase
      .from('tracking_events')
      .select(`
        *,
        agency:location_agency_id(name, cities(name)),
        agent:scanned_by(full_name) -- On suppose que la table profiles est jointe via auth.users si configuré, sinon faudra ajuster
      `)
      .eq('shipment_id', shipmentData.id)
      .order('created_at', { ascending: false })

    setEvents(eventsData || [])
    setLoading(false)
  }

  // Helper pour les couleurs de statut
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'CREATED': 'bg-gray-500',
      'IN_TRANSIT': 'bg-blue-500',
      'ARRIVED_AT_AGENCY': 'bg-orange-500',
      'OUT_FOR_DELIVERY': 'bg-purple-500',
      'DELIVERED': 'bg-green-600',
      'ISSUE': 'bg-red-600'
    }
    return <Badge className={`${styles[status] || 'bg-slate-500'} text-white`}>{status}</Badge>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Suivi des Colis</h1>
        <p className="text-muted-foreground">Entrez le numéro de suivi pour voir la progression.</p>
      </div>

      {/* Barre de Recherche */}
      <Card className="border-2 border-primary/10">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <Input 
              placeholder="Ex: CD-123456-PO" 
              className="text-lg font-mono uppercase h-12"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
            />
            <Button type="submit" size="lg" className="h-12 bg-primary hover:bg-blue-700 px-8" disabled={loading}>
              {loading ? '...' : <Search />}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Résultat : Non trouvé */}
      {notFound && (
        <div className="text-center p-8 bg-red-50 text-red-600 rounded-lg border border-red-100">
          <PackageCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <h3 className="font-bold">Colis introuvable</h3>
          <p>Vérifiez le numéro de suivi et réessayez.</p>
        </div>
      )}

      {/* Résultat : Détail du Colis */}
      {shipment && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* En-tête du Colis */}
          <Card className="overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-900 border-b p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Numéro de suivi</p>
                <h2 className="text-3xl font-mono font-bold text-primary">{shipment.tracking_number}</h2>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(shipment.status)}
                <span className="text-sm text-muted-foreground">
                  Type: <strong>{shipment.type}</strong> • Poids: <strong>{shipment.weight_kg} kg</strong>
                </span>
              </div>
            </div>
            
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
              <div className="space-y-1">
                <h4 className="font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                  <MapPin className="h-4 w-4 text-primary" /> Origine
                </h4>
                <p className="text-lg">{shipment.origin?.cities?.name}</p>
                <p className="text-sm text-muted-foreground">{shipment.origin?.name}</p>
                <div className="mt-2 text-sm bg-slate-100 dark:bg-slate-800 p-2 rounded">
                  <span className="font-bold">Exp:</span> {shipment.sender_name}
                </div>
              </div>

              <div className="space-y-1 md:text-right">
                <h4 className="font-semibold flex items-center gap-2 md:justify-end text-slate-900 dark:text-white">
                  Destination <MapPin className="h-4 w-4 text-green-600" />
                </h4>
                <p className="text-lg">{shipment.destination?.cities?.name}</p>
                <p className="text-sm text-muted-foreground">{shipment.destination?.name}</p>
                <div className="mt-2 text-sm bg-slate-100 dark:bg-slate-800 p-2 rounded text-left md:text-right">
                  <span className="font-bold">Dest:</span> {shipment.recipient_name}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Verticale */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des événements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-8 py-2">
                {events.map((event, index) => (
                  <div key={event.id} className="relative pl-8">
                    {/* Point sur la ligne */}
                    <span className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white dark:border-slate-950 ${index === 0 ? 'bg-primary' : 'bg-slate-300'}`}></span>
                    
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                      <div>
                        <p className="text-base font-bold text-slate-900 dark:text-white">
                          {event.description || event.status}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.agency?.name || 'En route'} ({event.agency?.cities?.name || 'Transit'})
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium flex items-center gap-1 justify-end">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(event.created_at), 'dd MMM yyyy', { locale: fr })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.created_at), 'HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}