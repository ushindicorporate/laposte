'use client'

import { useState } from "react"
import { useForm, useFieldArray, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Package, Truck, ArrowRight, ArrowLeft, CheckCircle, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"

import { shipmentSchema, ShipmentFormData } from "@/lib/validations/shipments"
import { createShipment } from "@/actions/shipments"
import { PartySelector } from "./party-selector" // Ton composant précédent
import { SearchableSelect } from "@/components/ui/searchable-select" // Ton select robuste

interface NewShipmentWizardProps {
  agencies: { id: string, name: string }[]
}

const STEPS = [
  { id: 1, title: "Parties", icon: Truck },
  { id: 2, title: "Colis & Route", icon: Package },
  { id: 3, title: "Validation", icon: CheckCircle },
]

export function NewShipmentWizard({ agencies }: NewShipmentWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Options pour le select agence
  const agencyOptions = agencies.map(a => ({ label: a.name, value: a.id }))

  const methods = useForm({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      sender: { name: "", phone: "" },
      recipient: { name: "", phone: "" },
      items: [{ description: "", quantity: 1, weight_kg: 1, is_fragile: false }],
      type: "PARCEL",
      total_weight: 0,
      total_price: 0
    },
    mode: "onChange" // Validation en temps réel
  })

  // Gestion de la liste des items
  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: "items"
  })

  // Calcul automatique des totaux (Effet de bord UI)
  const watchedItems = methods.watch("items")
  const totalWeight = watchedItems.reduce((sum, item) => sum + (Number(item.weight_kg) || 0) * (Number(item.quantity) || 1), 0)
  
  // Simulation Tarif (Logique métier complexe simplifiée ici)
  // Prix de base 10$ + 5$ par Kg
  const totalPrice = 10 + (totalWeight * 5)

  // Synchronisation des valeurs calculées dans le form
  // On utilise setValue pour que ces données soient envoyées au submit
  if (methods.getValues("total_weight") !== totalWeight) methods.setValue("total_weight", totalWeight)
  if (methods.getValues("total_price") !== totalPrice) methods.setValue("total_price", totalPrice)

  const onSubmit = async (data: ShipmentFormData) => {
    setLoading(true)
    try {
      const result = await createShipment(data)
      if (result.success) {
        toast.success(`Envoi créé : ${result.trackingNumber}`)
        router.push(`/dashboard/shipments/${result.trackingNumber}`) // Redirection vers la fiche suivi
      } else {
        toast.error(typeof result.error === 'string' ? result.error : "Erreur de validation")
      }
    } catch (e) {
      toast.error("Erreur système")
    } finally {
      setLoading(false)
    }
  }

  // Navigation entre étapes avec validation partielle
  const nextStep = async () => {
    let valid = false
    if (step === 1) {
        valid = await methods.trigger(["sender", "recipient"])
    } else if (step === 2) {
        valid = await methods.trigger(["items", "destination_agency_id"])
    }
    
    if (valid) setStep(step + 1)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* STEPPER */}
      <div className="flex justify-between items-center px-10">
        {STEPS.map((s, i) => (
            <div key={s.id} className={`flex flex-col items-center gap-2 ${step >= s.id ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= s.id ? 'border-primary bg-primary/10' : 'border-muted'}`}>
                    <s.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{s.title}</span>
            </div>
        ))}
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
            
            {/* ÉTAPE 1 : PARTIES (Expéditeur / Destinataire) */}
            {step === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <PartySelector type="sender" label="Expéditeur" />
                    <Separator />
                    <PartySelector type="recipient" label="Destinataire" />
                </div>
            )}

            {/* ÉTAPE 2 : LOGISTIQUE & CONTENU */}
            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    
                    {/* Destination */}
                    <Card>
                        <CardContent className="pt-6">
                            <FormField
                                control={methods.control}
                                name="destination_agency_id"
                                render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Agence de Destination *</FormLabel>
                                    <FormControl>
                                        <SearchableSelect 
                                            value={field.value} 
                                            onChange={field.onChange} 
                                            options={agencyOptions} 
                                            placeholder="Choisir l'agence d'arrivée..."
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Liste des Colis */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">Contenu de l'envoi</h3>
                            <Button type="button" variant="outline" size="sm" onClick={() => append({ description: "", quantity: 1, weight_kg: 1, is_fragile: false })}>
                                <Plus className="h-4 w-4 mr-2" /> Ajouter un article
                            </Button>
                        </div>

                        {fields.map((field, index) => (
                            <Card key={field.id}>
                                <CardContent className="pt-6 grid grid-cols-12 gap-4 items-end">
                                    <div className="col-span-5">
                                        <FormField
                                            control={methods.control}
                                            name={`items.${index}.description`}
                                            render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Description</FormLabel>
                                                <FormControl><Input {...field} placeholder="Ex: Documents..." /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <FormField
                                            control={methods.control}
                                            name={`items.${index}.quantity`}
                                            render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Qté</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)}
                                                        value={field.value as number}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <FormField
                                            control={methods.control}
                                            name={`items.${index}.weight_kg`}
                                            render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Poids (kg)</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        type="number" step="0.1" {...field} 
                                                        onChange={e => field.onChange(e.target.valueAsNumber)}
                                                        value={field.value as number}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="col-span-2 flex items-center h-10">
                                        <FormField
                                            control={methods.control}
                                            name={`items.${index}.is_fragile`}
                                            render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                <FormLabel className="text-xs font-normal">Fragile</FormLabel>
                                            </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                        {fields.length > 1 && (
                                            <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* ÉTAPE 3 : RÉCAPITULATIF & PAIEMENT */}
            {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="pt-6 space-y-4">
                            <h3 className="font-semibold text-lg text-primary">Récapitulatif</h3>
                            
                            <div className="grid grid-cols-2 gap-8 text-sm">
                                <div>
                                    <span className="text-muted-foreground block mb-1">Expéditeur</span>
                                    <p className="font-medium">{methods.getValues('sender.name')}</p>
                                    <p>{methods.getValues('sender.phone')}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block mb-1">Destinataire</span>
                                    <p className="font-medium">{methods.getValues('recipient.name')}</p>
                                    <p>{methods.getValues('recipient.phone')}</p>
                                </div>
                            </div>

                            <Separator className="bg-primary/20" />

                            <div className="flex justify-between items-center text-lg font-bold">
                                <span>Total à payer</span>
                                <span>{totalPrice.toFixed(2)} $</span>
                            </div>
                            <p className="text-xs text-muted-foreground text-right">
                                {totalWeight} kg • {watchedItems.length} article(s)
                            </p>
                        </CardContent>
                    </Card>

                    <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 text-yellow-800 text-sm">
                        ⚠️ En cliquant sur "Confirmer", le numéro de suivi sera généré et le client devra payer le montant indiqué.
                    </div>
                </div>
            )}

            {/* NAVIGATION BAR (Fixe en bas) */}
            <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-background border-t flex justify-between items-center z-10">
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => step > 1 ? setStep(step - 1) : router.back()}
                    disabled={loading}
                >
                    {step === 1 ? "Annuler" : "Retour"}
                </Button>

                {step < 3 ? (
                    <Button type="button" onClick={nextStep}>
                        Suivant <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmer l'envoi
                    </Button>
                )}
            </div>

        </form>
      </FormProvider>
    </div>
  )
}