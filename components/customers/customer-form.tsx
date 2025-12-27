'use client'

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { Loader2, Bug } from "lucide-react" // J'ajoute une icône de debug

import { CustomerFormData, customerSchema, CUSTOMER_TYPES } from "@/lib/validations/customers"
import { createCustomer, updateCustomer } from "@/actions/customers"

interface CustomerFormProps {
  initialData?: any 
  onSuccess: (newCustomer?: any) => void
  onCancel: () => void
}

export function CustomerForm({ initialData, onSuccess, onCancel }: CustomerFormProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      type: "INDIVIDUAL" as const,
      name: "",
      phone: "",
      email: "",
      tax_id: "",
      address: "",
      is_active: true
    }
  })

  // Watch pour UI
  const type = form.watch("type")
  const isCorporate = type !== 'INDIVIDUAL'

  // Afficher les erreurs en temps réel dans la console (Debug)
  console.log("État du formulaire (Erreurs):", form.formState.errors)

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        // S'assurer que les champs optionnels ne sont pas null
        email: initialData.email || "",
        tax_id: initialData.tax_id || "",
        address: initialData.address || ""
      })
    }
  }, [initialData, form])

  const onSubmit = async (data: CustomerFormData) => {
    console.log("SOUMISSION EN COURS...", data) // Tu dois voir ça
    setLoading(true)
    try {
      let result
      if (initialData?.id) {
        result = await updateCustomer(initialData.id, data)
      } else {
        result = await createCustomer(data)
      }

      console.log("RÉSULTAT SERVEUR:", result) // Tu dois voir ça

      if (result.success) {
        toast.success(initialData ? "Client modifié" : "Client créé")
        // @ts-ignore
        onSuccess(result.data) 
      } else {
        toast.error(typeof result.error === 'string' ? result.error : "Erreur serveur")
      }
    } catch (e) {
      console.error(e)
      toast.error("Erreur système")
    } finally {
      setLoading(false)
    }
  }

  // Fonction de débogage manuel
  const handleDebug = () => {
    const values = form.getValues();
    const errors = form.formState.errors;
    alert(`Valeurs: ${JSON.stringify(values, null, 2)}\n\nErreurs: ${JSON.stringify(errors, null, 2)}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, (err) => console.error("Erreur Validation:", err))} className="space-y-6">
        
        {/* ... CHAMPS (TYPE, NOM, PHONE) ... */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                <SelectContent>
                  {CUSTOMER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>{isCorporate ? "Raison Sociale *" : "Nom Complet *"}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Téléphone *</FormLabel>
                    <FormControl><Input placeholder="081..." {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>

        {/* ... AUTRES CHAMPS (TAX_ID, EMAIL, ADDRESS) ... */}
        {isCorporate && (
            <FormField
                control={form.control}
                name="tax_id"
                render={({ field }) => (
                <FormItem className="bg-muted/30 p-3 rounded-md border border-dashed">
                    <FormLabel>RCCM / ID. Nat *</FormLabel>
                    <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        )}

        <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                <FormMessage />
            </FormItem>
            )}
        />

        <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Adresse</FormLabel>
                <FormControl><Textarea {...field} value={field.value || ''} /></FormControl>
                <FormMessage />
            </FormItem>
            )}
        />

        <div className="flex justify-end gap-3 pt-4 border-t mt-6 items-center">
          
          {/* BOUTON DEBUG (À retirer en prod) */}
          <Button type="button" variant="ghost" size="icon" onClick={handleDebug} title="Voir les erreurs">
            <Bug className="h-4 w-4 text-orange-500" />
          </Button>

          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Annuler
          </Button>
          
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Modifier" : "Créer"}
          </Button>
        </div>

      </form>
    </Form>
  )
}