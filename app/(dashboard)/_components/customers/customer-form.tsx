// components/customers/customer-form.tsx
'use client'

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

import { CustomerFormData, customerSchema, CUSTOMER_TYPES } from "@/lib/validations/customers"
import { createCustomer, updateCustomer } from "@/actions/customers"

interface CustomerFormProps {
  initialData?: any 
  onSuccess: () => void
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

  // Watch le type pour conditionner l'affichage
  const type = form.watch("type")
  const isCorporate = type !== 'INDIVIDUAL'

  useEffect(() => {
    if (initialData) {
      form.reset(initialData)
    }
  }, [initialData, form])

  const onSubmit = async (data: CustomerFormData) => {
    setLoading(true)
    try {
      let result
      if (initialData?.id) {
        result = await updateCustomer(initialData.id, data)
      } else {
        result = await createCustomer(data)
      }

      if (result.success) {
        toast.success("Client enregistré")
        onSuccess()
      } else {
        // Gestion propre des erreurs Zod imbriquées
        const msg = typeof result.error === 'string' 
            ? result.error 
            : "Vérifiez les champs (ex: Téléphone déjà utilisé)"
        toast.error(msg)
      }
    } catch (e) {
      toast.error("Erreur système")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type de Client</FormLabel>
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
                    <FormControl><Input placeholder={isCorporate ? "SARL..." : "Jean..."} {...field} /></FormControl>
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

        {/* Champ conditionnel pour Entreprises */}
        {isCorporate && (
            <FormField
                control={form.control}
                name="tax_id"
                render={({ field }) => (
                <FormItem className="bg-muted/30 p-3 rounded-md border border-dashed">
                    <FormLabel>RCCM / ID. Nat *</FormLabel>
                    <FormControl><Input placeholder="CD/KIN/RCCM/..." {...field} value={field.value || ''} /></FormControl>
                    <FormDescription>Obligatoire pour la facturation entreprise.</FormDescription>
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
                <FormControl><Input placeholder="contact@..." {...field} value={field.value || ''} /></FormControl>
                <FormMessage />
            </FormItem>
            )}
        />

        <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Adresse (Rapide)</FormLabel>
                <FormControl><Textarea placeholder="Adresse physique..." {...field} value={field.value || ''} /></FormControl>
                <FormDescription>Utilisez le module Adresses pour gérer plusieurs lieux.</FormDescription>
                <FormMessage />
            </FormItem>
            )}
        />

        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
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