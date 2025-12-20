'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ScanBarcode, ArrowRight, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export default function ScanPage() {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [status, setStatus] = useState('ARRIVED_AT_AGENCY')
  const [loading, setLoading] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // 1. Vérifier si le colis existe
    const { data: shipment, error: findError } = await supabase
      .from('shipments')
      .select('id, current_agency_id')
      .eq('tracking_number', trackingNumber)
      .single()

    if (findError || !shipment) {
      toast.error("Numéro de suivi invalide ou introuvable.")
      setLoading(false)
      return
    }

    // 2. Récupérer l'agent courant (pour savoir où on scanne)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('agency_id').eq('id', user?.id).single()
    
    const locationId = profile?.agency_id || shipment.current_agency_id // Fallback

    // 3. Mettre à jour le statut du colis
    const { error: updateError } = await supabase
      .from('shipments')
      .update({ 
        status: status,
        current_agency_id: locationId, // Le colis est maintenant ici
        updated_at: new Date().toISOString()
      })
      .eq('id', shipment.id)

    if (updateError) {
      toast.error("Erreur mise à jour: " + updateError.message)
      setLoading(false)
      return
    }

    // 4. Ajouter l'événement dans l'historique
    // Définir une description automatique selon le statut
    let description = "Mise à jour statut"
    if (status === 'IN_TRANSIT') description = "Colis expédié vers prochaine étape"
    if (status === 'ARRIVED_AT_AGENCY') description = "Colis arrivé au centre de tri / agence"
    if (status === 'OUT_FOR_DELIVERY') description = "En cours de distribution par le facteur"
    if (status === 'DELIVERED') description = "Colis livré au destinataire"

    await supabase.from('tracking_events').insert({
      shipment_id: shipment.id,
      status: status,
      location_agency_id: locationId,
      description: description,
      scanned_by: user?.id
    })

    toast.success(`Statut mis à jour : ${status}`)
    setTrackingNumber('') // Reset pour le prochain scan rapide
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <Card className="border-t-4 border-primary shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-50 text-primary rounded-full flex items-center justify-center mb-4">
            <ScanBarcode size={24} />
          </div>
          <CardTitle className="text-2xl">Scanner Rapide</CardTitle>
          <CardDescription>Mise à jour des mouvements de colis</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleScan} className="space-y-6">
            
            <div className="space-y-2">
              <Label>Numéro de suivi</Label>
              <Input 
                autoFocus
                placeholder="Scanner ou taper ici..." 
                className="h-12 text-lg font-mono uppercase text-center tracking-widest"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
              />
            </div>

            <div className="space-y-2">
              <Label>Nouvel Événement</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_TRANSIT">🚛 En Transit (Départ)</SelectItem>
                  <SelectItem value="ARRIVED_AT_AGENCY">🏢 Arrivé à l'Agence (Réception)</SelectItem>
                  <SelectItem value="OUT_FOR_DELIVERY">🛵 En cours de Livraison</SelectItem>
                  <SelectItem value="DELIVERED">✅ Livré (Final)</SelectItem>
                  <SelectItem value="ISSUE">⚠️ Problème / Retard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full h-12 text-lg bg-primary hover:bg-blue-700" disabled={loading || !trackingNumber}>
              {loading ? 'Traitement...' : 'Valider le Scan'}
            </Button>

          </form>
        </CardContent>
      </Card>

      {/* Raccourci vers le suivi public */}
      <div className="text-center mt-6">
        <Button variant="link" onClick={() => router.push('/dashboard/tracking')}>
          Chercher un colis <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}