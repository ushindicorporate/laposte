import { notFound } from "next/navigation"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Printer, MapPin, Package, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getShipmentByTracking } from "@/actions/shipments"
import { StatusBadge } from "@/app/(dashboard)/_components/shipments/status-badge"
import { getTrackingHistory } from "@/actions/tracking"
import { ShipmentActions } from "@/app/(dashboard)/_components/shipments/shipment-actions"

interface PageProps {
  params: Promise<{ trackingNumber: string }>
}

export default async function ShipmentDetailPage({ params }: PageProps) {
  const {trackingNumber} = await params;
  const shipment = await getShipmentByTracking(trackingNumber)

  if (!shipment) {
    return notFound()
  }

  const trackingEvents = await getTrackingHistory(shipment.id)

  return (
    <div className="space-y-6 pb-20">
      
      {/* HEADER ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono">{shipment.tracking_number}</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
            Créé le {format(new Date(shipment.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShipmentActions shipment={shipment} />
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" /> Étiquette
          </Button>
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" /> Reçu Client
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* COLONNE GAUCHE : INFO PRINCIPALE */}
        <div className="md:col-span-2 space-y-6">
          
          {/* STATUT & ROUTE */}
          <Card className="border-l-4 border-l-primary shadow-sm">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-6">
                <StatusBadge status={shipment.status} />
                <span className="font-bold text-lg">{shipment.total_price} $</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Origine</span>
                  <span className="font-semibold text-lg">{shipment.origin_agency?.city?.name}</span>
                  <span className="text-xs bg-muted px-2 py-1 rounded w-fit">{shipment.origin_agency?.code}</span>
                </div>
                
                <div className="flex-1 px-4 flex flex-col items-center">
                  <Truck className="h-6 w-6 text-muted-foreground mb-2" />
                  <div className="w-full h-0.5 bg-border relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                      Service {shipment.type}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-right">
                  <span className="text-muted-foreground">Destination</span>
                  <span className="font-semibold text-lg">{shipment.destination_agency?.city?.name}</span>
                  <span className="text-xs bg-muted px-2 py-1 rounded w-fit ml-auto">{shipment.destination_agency?.code}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PARTIES (EXPÉDITEUR / DESTINATAIRE) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Expéditeur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="font-bold text-lg">{shipment.sender_name}</p>
                <p className="text-sm">{shipment.sender_phone}</p>
                {shipment.sender_email && <p className="text-sm text-muted-foreground">{shipment.sender_email}</p>}
                {shipment.sender_address && (
                  <div className="flex items-start gap-2 mt-2 pt-2 border-t text-sm">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                    <span>{shipment.sender_address}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Destinataire</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="font-bold text-lg">{shipment.recipient_name}</p>
                <p className="text-sm">{shipment.recipient_phone}</p>
                {shipment.recipient_address && (
                  <div className="flex items-start gap-2 mt-2 pt-2 border-t text-sm">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                    <span>{shipment.recipient_address}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* CONTENU COLIS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" /> Contenu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 font-medium text-right">Qté</th>
                    <th className="pb-2 font-medium text-right">Poids</th>
                    <th className="pb-2 font-medium text-center">Fragile</th>
                  </tr>
                </thead>
                <tbody>
                  {shipment.items?.map((item: any) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-3">{item.description}</td>
                      <td className="py-3 text-right">{item.quantity}</td>
                      <td className="py-3 text-right">{item.weight_kg} kg</td>
                      <td className="py-3 text-center">
                        {item.is_fragile ? <span className="text-red-500 font-bold">OUI</span> : <span className="text-muted-foreground">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30">
                    <td className="py-3 pl-2 font-bold">Total</td>
                    <td className="py-3"></td>
                    <td className="py-3 text-right font-bold">{shipment.weight_kg} kg</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>

        </div>

        {/* COLONNE DROITE : TIMELINE (Placeholder pour Phase 6) */}
        <div className="space-y-6">
          <Card className="h-full border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Historique</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="relative border-l-2 border-muted ml-2 space-y-8 pb-10">
                
                {trackingEvents?.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic pl-6">Aucun événement enregistré.</p>
                ) : (
                    trackingEvents.map((event, index) => (
                        <div key={event.id} className="relative pl-6 group">
                          {/* Point Timeline */}
                          <div className={`absolute -left-1.25 top-1 h-3 w-3 rounded-full ring-4 ring-background ${index === 0 ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`} />
                          
                          <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium">
                                {/* On peut traduire les statuts ici ou utiliser un helper */}
                                {event.status === 'CREATED' ? 'Envoi Créé' : 
                                 event.status === 'RECEIVED' ? 'Pris en charge' :
                                 event.status === 'IN_TRANSIT' ? 'En transit' :
                                 event.status === 'ARRIVED' ? 'Arrivé en agence' :
                                 event.status === 'OUT_FOR_DELIVERY' ? 'En livraison' :
                                 event.status === 'DELIVERED' ? 'Livré' : event.status}
                              </span>
                              
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(event.created_at), "d MMMM 'à' HH:mm", { locale: fr })}
                              </span>
                              
                              {/* Localisation */}
                              {event.agency && (
                                <span className="text-xs font-semibold text-primary/80">
                                    📍 {event.agency.name}
                                </span>
                              )}

                              {/* Agent (Optionnel, visible admin seulement) */}
                              {event.scanner && (
                                <span className="text-[10px] text-muted-foreground/50">
                                    Par : {event.scanner.full_name}
                                </span>
                              )}
                          </div>
                        </div>
                    ))
                )}

              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}