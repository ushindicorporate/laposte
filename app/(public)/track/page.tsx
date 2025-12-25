'use client'

import { useState } from "react"
import { Search, PackageX, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getShipmentByTracking } from "@/actions/shipments"
import { getTrackingHistory } from "@/actions/tracking"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { StatusBadge } from "@/app/(dashboard)/_components/shipments/status-badge"

export default function TrackPage() {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingNumber) return
    
    setLoading(true)
    setError("")
    setResult(null)

    try {
      // Note: Idéalement, créer une Server Action spécifique "getPublicTracking" 
      // qui ne renvoie PAS les données sensibles (prix, nom client complet)
      // Pour l'instant on réutilise l'existante
      const shipment = await getShipmentByTracking(trackingNumber)
      
      if (!shipment) {
        setError("Numéro de suivi introuvable.")
      } else {
        const events = await getTrackingHistory(shipment.id)
        setResult({ shipment, events })
      }
    } catch (err) {
      setError("Erreur de connexion.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Suivre un envoi</h1>
        <p className="text-muted-foreground">Entrez le numéro de suivi figurant sur votre reçu.</p>
      </div>

      <form onSubmit={handleTrack} className="flex gap-2">
        <Input 
            placeholder="Ex: CD-123456" 
            className="text-lg h-12" 
            value={trackingNumber}
            onChange={e => setTrackingNumber(e.target.value.toUpperCase())}
        />
        <Button type="submit" size="lg" className="h-12 px-8" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Search />}
        </Button>
      </form>

      {error && (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive flex items-center gap-2 justify-center">
            <PackageX className="h-5 w-5" /> {error}
        </div>
      )}

      {result && (
        <Card className="animate-in slide-in-from-bottom-4 duration-500">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>{result.shipment.tracking_number}</CardTitle>
                    <StatusBadge status={result.shipment.status} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="flex justify-between text-sm">
                        <div className="font-semibold">{result.shipment.origin_agency?.city?.name}</div>
                        <div className="text-muted-foreground">Vers</div>
                        <div className="font-semibold">{result.shipment.destination_agency?.city?.name}</div>
                    </div>

                    <div className="relative border-l-2 border-muted ml-2 space-y-6 pb-2">
                        {result.events?.map((event: any, i: number) => (
                            <div key={i} className="pl-6 relative">
                                <div className={`absolute -left-1.25 top-1.5 h-2.5 w-2.5 rounded-full ${i===0 ? 'bg-primary' : 'bg-muted-foreground'}`} />
                                <div className="text-sm font-medium">{event.status}</div>
                                <div className="text-xs text-muted-foreground">
                                    {format(new Date(event.created_at), "d MMM à HH:mm", { locale: fr })}
                                    {event.agency && ` • ${event.agency.name}`}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  )
}