'use client'

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { updateTariffConfig } from "@/actions/admin"

export function PricingManager({ tariff }: { tariff: any }) {
  const [loading, setLoading] = useState(false)
  const [basePrice, setBasePrice] = useState(tariff?.base_price || 0)
  const [priceKg, setPriceKg] = useState(tariff?.price_per_kg || 0)

  const handleSave = async () => {
    setLoading(true)
    const res = await updateTariffConfig(tariff.id, basePrice, priceKg)
    setLoading(false)
    
    if (res.success) toast.success("Tarifs mis à jour")
    else toast.error("Erreur mise à jour")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tarification Standard</CardTitle>
        <CardDescription>Définissez les prix de base appliqués par défaut.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Prix de Base ($)</label>
            <Input 
                type="number" 
                value={basePrice} 
                onChange={e => setBasePrice(Number(e.target.value))} 
            />
            <p className="text-xs text-muted-foreground">Appliqué à chaque colis</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Prix au Kg ($)</label>
            <Input 
                type="number" 
                value={priceKg} 
                onChange={e => setPriceKg(Number(e.target.value))} 
            />
            <p className="text-xs text-muted-foreground">Multiplié par le poids</p>
          </div>
        </div>
        <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Enregistrer
            </Button>
        </div>
      </CardContent>
    </Card>
  )
}