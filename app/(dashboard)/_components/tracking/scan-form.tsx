'use client'

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2, ScanLine } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { scanShipment } from "@/actions/tracking"

const scanSchema = z.object({
  trackingNumber: z.string().min(5, "Numéro invalide"),
  status: z.enum(['RECEIVED', 'IN_TRANSIT', 'ARRIVED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED']),
  notes: z.string().optional()
})

type ScanFormData = z.infer<typeof scanSchema>

const STATUS_OPTIONS = [
  { value: 'RECEIVED', label: 'Réception (Départ)' },
  { value: 'IN_TRANSIT', label: 'En Transit (Départ Camion)' },
  { value: 'ARRIVED', label: 'Arrivée (Agence Dest)' },
  { value: 'OUT_FOR_DELIVERY', label: 'En Livraison (Livreur)' },
  { value: 'DELIVERED', label: 'Livré (Client Final)' },
]

export function ScanForm({ currentAgencyId }: { currentAgencyId: string }) {
  const [loading, setLoading] = useState(false)

  const form = useForm<ScanFormData>({
    resolver: zodResolver(scanSchema),
    defaultValues: {
      trackingNumber: "",
      status: "RECEIVED",
      notes: ""
    }
  })

  const onSubmit = async (data: ScanFormData) => {
    setLoading(true)
    try {
      const result = await scanShipment(data.trackingNumber, data.status, currentAgencyId, data.notes)
      
      if (result.success) {
        toast.success(`Statut mis à jour : ${data.status}`)
        form.setValue("trackingNumber", "") // On vide le champ pour le prochain scan rapide
        form.setFocus("trackingNumber") // On remet le focus
      } else {
        toast.error(result.error as string)
      }
    } catch (e) {
      toast.error("Erreur système")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-card border rounded-lg shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-full">
            <ScanLine className="h-6 w-6 text-primary" />
        </div>
        <div>
            <h2 className="font-bold text-lg">Scanner un colis</h2>
            <p className="text-xs text-muted-foreground">Mise à jour rapide du statut</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nouvel Événement</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="trackingNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numéro de Suivi</FormLabel>
                <FormControl>
                    <Input 
                        placeholder="CD-..." 
                        {...field} 
                        className="text-lg font-mono tracking-widest uppercase"
                        autoFocus
                        onChange={e => field.onChange(e.target.value.toUpperCase())}
                    />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Scanner
          </Button>
        </form>
      </Form>
    </div>
  )
}