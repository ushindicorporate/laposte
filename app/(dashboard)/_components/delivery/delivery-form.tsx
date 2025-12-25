'use client'

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2, CheckCircle, XCircle, UserCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { recordDelivery } from "@/actions/delivery"

// Schéma de validation conditionnel
const deliverySchema = z.object({
  trackingNumber: z.string().min(5, "Numéro requis"),
  status: z.enum(['DELIVERED', 'FAILED_ATTEMPT']),
  
  // Champs Succès
  recipientName: z.string().optional(),
  relationship: z.enum(['SELF', 'FAMILY', 'NEIGHBOR', 'SECURITY', 'OTHER']).optional(),
  
  // Champs Échec
  failureReason: z.enum(['RECIPIENT_ABSENT', 'WRONG_ADDRESS', 'REFUSED', 'FORCE_MAJEURE']).optional(),
  
  notes: z.string().optional()
}).refine((data) => {
  if (data.status === 'DELIVERED') {
    return !!data.recipientName && !!data.relationship
  }
  if (data.status === 'FAILED_ATTEMPT') {
    return !!data.failureReason
  }
  return true
}, {
  message: "Veuillez compléter les détails requis",
  path: ["status"] // L'erreur s'attachera ici par défaut
})

type DeliveryFormData = z.infer<typeof deliverySchema>

export function DeliveryForm() {
  const [loading, setLoading] = useState(false)

  const form = useForm<DeliveryFormData>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      trackingNumber: "",
      status: "DELIVERED",
      relationship: "SELF"
    }
  })

  const status = form.watch("status")

  const onSubmit = async (data: DeliveryFormData) => {
    setLoading(true)
    try {
      const result = await recordDelivery(data.trackingNumber, {
        status: data.status,
        recipientName: data.recipientName,
        relationship: data.relationship,
        failureReason: data.failureReason,
        notes: data.notes
      })

      if (result.success) {
        toast.success(data.status === 'DELIVERED' ? "Livraison confirmée" : "Échec enregistré")
        form.reset({ trackingNumber: "", status: "DELIVERED", relationship: "SELF" })
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
    <div className="max-w-lg mx-auto p-6 bg-card border rounded-lg shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600">
            <UserCheck className="h-6 w-6" />
        </div>
        <div>
            <h2 className="font-bold text-lg">Livraison Finale</h2>
            <p className="text-xs text-muted-foreground">Enregistrement de la preuve de livraison</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
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
                        className="text-lg font-mono tracking-widest uppercase h-12"
                        autoFocus
                        onChange={e => field.onChange(e.target.value.toUpperCase())}
                    />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Résultat de la tentative</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md cursor-pointer hover:bg-muted/50 has-data-[state=checked]:border-green-500 has-data-[state=checked]:bg-green-50 dark:has-data-[state=checked]:bg-green-950/20">
                      <FormControl>
                        <RadioGroupItem value="DELIVERED" />
                      </FormControl>
                      <FormLabel className="font-normal flex items-center gap-2 cursor-pointer w-full">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Livraison Réussie
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md cursor-pointer hover:bg-muted/50 has-data-[state=checked]:border-red-500 has-data-[state=checked]:bg-red-50 dark:has-data-[state=checked]:bg-red-950/20">
                      <FormControl>
                        <RadioGroupItem value="FAILED_ATTEMPT" />
                      </FormControl>
                      <FormLabel className="font-normal flex items-center gap-2 cursor-pointer w-full">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Échec / Retour
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {status === 'DELIVERED' && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300 bg-muted/20 p-4 rounded-md">
                <FormField
                    control={form.control}
                    name="recipientName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nom du réceptionnaire *</FormLabel>
                        <FormControl><Input placeholder="Qui signe ?" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="relationship"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Lien avec le destinataire</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="SELF">Lui-même (Destinataire)</SelectItem>
                                <SelectItem value="FAMILY">Famille / Conjoint</SelectItem>
                                <SelectItem value="NEIGHBOR">Voisin</SelectItem>
                                <SelectItem value="SECURITY">Sécurité / Accueil</SelectItem>
                                <SelectItem value="OTHER">Autre</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
          )}

          {status === 'FAILED_ATTEMPT' && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300 bg-red-50 dark:bg-red-950/10 p-4 rounded-md">
                <FormField
                    control={form.control}
                    name="failureReason"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Motif de l'échec *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="RECIPIENT_ABSENT">Destinataire absent</SelectItem>
                                <SelectItem value="WRONG_ADDRESS">Adresse introuvable / Erronée</SelectItem>
                                <SelectItem value="REFUSED">Colis refusé par le client</SelectItem>
                                <SelectItem value="FORCE_MAJEURE">Force Majeure (Météo, Accès...)</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
          )}

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note (Optionnel)</FormLabel>
                <FormControl><Textarea placeholder="Commentaire livreur..." {...field} /></FormControl>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Valider la {status === 'DELIVERED' ? 'Livraison' : 'Tentative'}
          </Button>
        </form>
      </Form>
    </div>
  )
}