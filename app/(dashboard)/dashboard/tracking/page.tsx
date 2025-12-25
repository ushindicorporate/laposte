'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Loader2, PackageSearch } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { getShipmentByTracking } from "@/actions/shipments"

export default function InternalTrackingPage() {
  const router = useRouter()
  const [trackingNumber, setTrackingNumber] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingNumber) return

    setLoading(true)
    try {
      // On vérifie juste si le colis existe avant de rediriger
      const shipment = await getShipmentByTracking(trackingNumber)
      
      if (shipment) {
        // Redirection vers la fiche détail complète
        router.push(`/dashboard/shipments/${trackingNumber}`)
      } else {
        toast.error("Numéro de suivi introuvable")
      }
    } catch (error) {
      toast.error("Erreur de connexion")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Recherche Colis</h1>
        <p className="text-muted-foreground">
          Accès rapide aux informations d'un envoi pour le service client.
        </p>
      </div>

      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageSearch className="h-5 w-5 text-primary" />
            Suivi Interne
          </CardTitle>
          <CardDescription>Saisissez le numéro (ex: CD-123456)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Input
                placeholder="CD-..."
                className="text-lg h-12 pl-10 font-mono tracking-wider uppercase"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                autoFocus
              />
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
            </div>
            
            <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Rechercher le dossier
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}