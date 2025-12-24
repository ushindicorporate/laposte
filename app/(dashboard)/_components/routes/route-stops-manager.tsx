// components/routes/route-stops-manager.tsx
'use client'

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Loader2, Trash2, ArrowDown, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { getRouteStops, addRouteStop, deleteRouteStop } from "@/actions/route-stops"

interface RouteStopsManagerProps {
  route: any
  agencies: { id: string, name: string }[]
}

export function RouteStopsManager({ route, agencies }: RouteStopsManagerProps) {
  const [stops, setStops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  
  // État pour le nouvel arrêt
  const [newStopAgency, setNewStopAgency] = useState("")
  const [newStopOrder, setNewStopOrder] = useState(1)

  // Options pour le select (exclure Origine et Destination de la route)
  const availableAgencies = agencies.filter(a => 
    a.id !== route.origin_agency_id && 
    a.id !== route.destination_agency_id
  ).map(a => ({ label: a.name, value: a.id }))

  // Charger les arrêts
  const fetchStops = useCallback(async () => {
    try {
        const data = await getRouteStops(route.id)
        setStops(data || [])
        // Calculer le prochain ordre logique (max + 1)
        const maxOrder = data?.length ? Math.max(...data.map((s:any) => s.stop_order)) : 0
        setNewStopOrder(maxOrder + 1)
    } catch (e) {
        toast.error("Erreur chargement arrêts")
    } finally {
        setLoading(false)
    }
  }, [route.id]) // Depend only on route.id

  useEffect(() => {
    fetchStops()
  }, [fetchStops]) // fetchStops is stable now

  const handleAdd = async () => {
    if (!newStopAgency) return toast.error("Sélectionnez une agence")
    
    setAdding(true)
    const result = await addRouteStop(route.id, newStopAgency, Number(newStopOrder))
    setAdding(false)

    if (result.success) {
      toast.success("Arrêt ajouté")
      setNewStopAgency("") // Reset select
      fetchStops() // Refresh liste
    } else {
      toast.error(result.error as string)
    }
  }

  const handleDelete = async (stopId: string) => {
    if (!confirm("Supprimer cet arrêt ?")) return
    const result = await deleteRouteStop(stopId, route.id)
    if (result.success) {
      toast.success("Arrêt supprimé")
      fetchStops()
    } else {
      toast.error(result.error as string)
    }
  }

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

  return (
    <div className="space-y-6">
      
      {/* RÉSUMÉ ROUTE */}
      <div className="bg-muted/30 p-4 rounded-md border flex items-center justify-between">
        <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground uppercase font-bold">Départ</span>
            <Badge variant="outline" className="bg-background">{route.origin?.code}</Badge>
        </div>
        <div className="flex-1 h-px bg-border mx-4 relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-background px-2">
                {stops.length} Arrêts
             </div>
        </div>
        <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground uppercase font-bold">Arrivée</span>
            <Badge variant="outline" className="bg-background">{route.destination?.code}</Badge>
        </div>
      </div>

      <Separator />

      {/* LISTE DES ARRÊTS */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> 
            Arrêts Intermédiaires
        </h4>
        
        {stops.length === 0 ? (
            <p className="text-sm text-muted-foreground italic pl-6">Aucun arrêt intermédiaire.</p>
        ) : (
            <div className="relative pl-6 border-l-2 border-dashed border-primary/20 space-y-4 ml-2">
                {stops.map((stop) => (
                    <div key={stop.id} className="relative bg-card border p-3 rounded-md flex items-center justify-between shadow-sm">
                        {/* Puce Visuelle */}
                        <div className="absolute -left-7.75 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                        
                        <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="font-mono">#{stop.stop_order}</Badge>
                            <span className="font-medium">{stop.agency?.name}</span>
                            <span className="text-xs text-muted-foreground">({stop.agency?.code})</span>
                        </div>
                        
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(stop.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
        )}
      </div>

      <Separator />

      {/* FORMULAIRE AJOUT */}
      <div className="bg-muted/10 p-4 border rounded-md space-y-3">
        <h4 className="font-medium text-sm">Ajouter un arrêt</h4>
        <div className="grid grid-cols-[80px_1fr_auto] gap-2 items-end">
            <div className="space-y-1">
                <label className="text-xs font-medium">Ordre</label>
                <Input 
                    type="number" 
                    value={newStopOrder} 
                    onChange={e => setNewStopOrder(Number(e.target.value))} 
                    className="h-9"
                />
            </div>
            <div className="space-y-1">
                <label className="text-xs font-medium">Agence</label>
                <SearchableSelect 
                    value={newStopAgency} 
                    onChange={setNewStopAgency} 
                    options={availableAgencies} 
                    placeholder="Choisir..."
                />
            </div>
            <Button onClick={handleAdd} disabled={adding} className="h-9">
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDown className="h-4 w-4" />}
            </Button>
        </div>
      </div>

    </div>
  )
}