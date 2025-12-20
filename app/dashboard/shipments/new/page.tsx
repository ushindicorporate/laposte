'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Truck } from 'lucide-react'
import { toast } from 'sonner' // Notification système
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function NewShipmentPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  
  // Données pour les listes déroulantes
  const [agencies, setAgencies] = useState<any[]>([])
  
  // État du formulaire
  const [formData, setFormData] = useState({
    sender_name: '',
    sender_phone: '',
    sender_address: '',
    recipient_name: '',
    recipient_phone: '',
    recipient_address: '',
    destination_agency_id: '',
    weight_kg: '',
    price: '',
    type: 'PARCEL'
  })

  // Charger les agences au démarrage
  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.from('agencies').select('id, name, code, cities(name)')
      if (data) setAgencies(data)
    }
    loadData()
  }, [])

  // Générateur de numéro de suivi (Simulé pour le front, idéalement backend)
  const generateTrackingNumber = () => {
    const random = Math.floor(100000 + Math.random() * 900000)
    return `CD-${random}-PO`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // 1. Récupérer l'utilisateur courant (l'agent qui crée le colis)
    const { data: { user } } = await supabase.auth.getUser()
    
    // Récupérer le profil pour avoir son agence d'origine
    const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('id', user?.id)
        .single()

    const trackingNumber = generateTrackingNumber()
    const originId = profile?.agency_id || agencies[0]?.id // Fallback si pas d'agence assignée

    // 2. Insérer le Colis
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .insert({
        tracking_number: trackingNumber,
        sender_name: formData.sender_name,
        sender_phone: formData.sender_phone,
        sender_address: formData.sender_address,
        recipient_name: formData.recipient_name,
        recipient_phone: formData.recipient_phone,
        recipient_address: formData.recipient_address,
        origin_agency_id: originId,
        destination_agency_id: formData.destination_agency_id,
        current_agency_id: originId, // Le colis est physiquement ici au départ
        weight_kg: parseFloat(formData.weight_kg),
        price: parseFloat(formData.price),
        type: formData.type,
        status: 'CREATED',
        created_by: user?.id
      })
      .select()
      .single()

    if (shipmentError) {
      toast.error("Erreur lors de la création : " + shipmentError.message)
      setLoading(false)
      return
    }

    // 3. Créer le premier événement de tracking
    const { error: trackingError } = await supabase
      .from('tracking_events')
      .insert({
        shipment_id: shipment.id,
        status: 'CREATED',
        location_agency_id: originId,
        description: 'Colis enregistré au guichet',
        scanned_by: user?.id
      })

    if (!trackingError) {
      toast.success(`Colis créé avec succès ! N° ${trackingNumber}`)
      router.push('/dashboard/shipments')
    } else {
      toast.error("Erreur lors de l'enregistrement du suivi.")
    }
    
    setLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/shipments"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Enregistrer un colis</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* SECTION EXPÉDITEUR */}
          <Card>
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b pb-4">
              <CardTitle className="text-base text-primary flex items-center gap-2">
                1. Expéditeur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nom complet</Label>
                <Input required name="sender_name" placeholder="Ex: Jean Kapata" onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input required name="sender_phone" placeholder="+243..." onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Adresse / Quartier</Label>
                <Textarea name="sender_address" placeholder="Adresse complète..." onChange={handleChange} />
              </div>
            </CardContent>
          </Card>

          {/* SECTION DESTINATAIRE */}
          <Card>
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b pb-4">
              <CardTitle className="text-base text-primary flex items-center gap-2">
                2. Destinataire
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nom complet</Label>
                <Input required name="recipient_name" placeholder="Ex: Marie Mutombo" onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Téléphone (Important pour SMS)</Label>
                <Input required name="recipient_phone" placeholder="+243..." onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Adresse de livraison</Label>
                <Textarea required name="recipient_address" placeholder="Adresse précise..." onChange={handleChange} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SECTION DÉTAILS COLIS */}
        <Card className="mt-6 border-2 border-primary/20">
          <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10 border-b pb-4">
            <CardTitle className="text-base text-primary flex items-center gap-2">
              <Truck className="h-5 w-5" /> 3. Détails de l'envoi & Route
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="space-y-2">
                <Label>Agence de Destination</Label>
                <Select required onValueChange={(val) => setFormData({...formData, destination_agency_id: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir l'agence..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agencies.map((agency) => (
                      <SelectItem key={agency.id} value={agency.id}>
                        {agency.cities?.name} - {agency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Type d'envoi</Label>
                <Select defaultValue="PARCEL" onValueChange={(val) => setFormData({...formData, type: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PARCEL">Colis Standard</SelectItem>
                    <SelectItem value="LETTER">Courrier / Lettre</SelectItem>
                    <SelectItem value="EMS">EMS (Express)</SelectItem>
                    <SelectItem value="DOCUMENT">Documents officiels</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Poids (kg)</Label>
                <Input required type="number" step="0.1" name="weight_kg" placeholder="0.0" onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label>Prix Total (FC)</Label>
                <Input required type="number" name="price" placeholder="Montant payé" className="font-bold" onChange={handleChange} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ACTIONS */}
        <div className="flex justify-end mt-6 gap-4">
          <Button variant="outline" type="button" onClick={() => router.back()}>Annuler</Button>
          <Button type="submit" className="bg-primary hover:bg-blue-700 min-w-[200px]" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {loading ? 'Enregistrement...' : 'Valider et Créer'}
          </Button>
        </div>
      </form>
    </div>
  )
}