// components/agencies/agency-form.tsx
'use client'

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

import { AgencyFormData, agencySchema, AGENCY_TYPES } from "@/lib/validations/agencies"
import { createAgency, updateAgency } from "@/actions/agencies"
import { SearchableSelect } from "@/components/ui/searchable-select"

interface AgencyFormProps {
  initialData?: any 
  cities: { id: string, name: string }[] 
  onSuccess: () => void
  onCancel: () => void
}

export function AgencyForm({ initialData, cities, onSuccess, onCancel }: AgencyFormProps) {
  const [loading, setLoading] = useState(false)

  const cityOptions = cities.map(c => ({
    label: c.name,
    value: c.id
  }))

  // CORRECTION ICI : On retire <AgencyFormData>
  const form = useForm({
    resolver: zodResolver(agencySchema),
    defaultValues: {
      name: "",
      code: "",
      type: "POST_OFFICE" as const, // Casting pour rassurer TS sur l'enum
      city_id: "",
      address: "",
      phone: "",
      email: "",
      is_active: true
    }
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        code: initialData.code,
        // On s'assure que le type correspond à une des valeurs de l'enum
        type: initialData.type || "POST_OFFICE", 
        city_id: initialData.city_id,
        address: initialData.address || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        is_active: initialData.is_active ?? true // Fallback si null
      })
    } else {
      form.reset({
        name: "", code: "", type: "POST_OFFICE", city_id: "", 
        address: "", phone: "", email: "", is_active: true
      })
    }
  }, [initialData, form])

  const onSubmit = async (data: AgencyFormData) => {
    setLoading(true)
    try {
      let result
      if (initialData?.id) {
        result = await updateAgency(initialData.id, data)
      } else {
        result = await createAgency(data)
      }

      if (result.success) {
        toast.success(initialData ? "Agence mise à jour" : "Agence créée")
        onSuccess()
      } else {
        toast.error(typeof result.error === 'string' ? result.error : "Erreur de validation")
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
        
        {/* GROUPE 1 : IDENTIFICATION */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom de l'agence *</FormLabel>
                <FormControl><Input placeholder="Agence Gombe" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code Unique *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="KIN-GOM-01" 
                    {...field} 
                    onChange={e => field.onChange(e.target.value.toUpperCase())} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* GROUPE 2 : TYPE ET VILLE */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {AGENCY_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="city_id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Ville *</FormLabel>
                <FormControl>
                  <SearchableSelect 
                    value={field.value} 
                    onChange={field.onChange} 
                    options={cityOptions}
                    placeholder="Chercher une ville..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* GROUPE 3 : CONTACTS */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adresse complète</FormLabel>
              <FormControl><Input placeholder="Avenue, Numéro..." {...field} value={field.value || ''} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone</FormLabel>
                <FormControl><Input placeholder="+243..." {...field} value={field.value || ''}/></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email (Optionnel)</FormLabel>
                <FormControl><Input placeholder="agence@poste.cd" {...field} value={field.value || ''}/></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
              <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Agence Opérationnelle</FormLabel>
                <FormDescription>Décocher en cas de fermeture temporaire.</FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* FOOTER BOUTONS */}
        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Enregistrer" : "Créer"}
          </Button>
        </div>

      </form>
    </Form>
  )
}