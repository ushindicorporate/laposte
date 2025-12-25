'use client'

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { CityFormData, citySchema } from "@/lib/validations/cities"
import { createCity, updateCity } from "@/actions/cities"

// Import du nouveau composant
import { SearchableSelect } from "@/components/ui/searchable-select"

interface CityFormProps {
  initialData?: any 
  regions: { id: string; name: string }[] 
  onSuccess: () => void
  onCancel: () => void
}

export function CityForm({ initialData, regions, onSuccess, onCancel }: CityFormProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(citySchema),
    defaultValues: {
      name: "",
      region_id: "",
      postal_code: "",
      description: "",
      is_active: true,
      population: undefined
    }
  })

  // Transformation des régions pour le format attendu par SearchableSelect
  const regionOptions = regions.map(r => ({
    label: r.name,
    value: r.id
  }));

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        region_id: initialData.region_id,
        postal_code: initialData.postal_code || "",
        description: initialData.notes || "",
        is_active: initialData.is_active,
        population: initialData.population
      })
    } else {
      form.reset({ name: "", region_id: "", postal_code: "", description: "", is_active: true })
    }
  }, [initialData, form])

  const onSubmit = async (data: CityFormData) => {
    setLoading(true)
    try {
      let result
      if (initialData?.id) {
        result = await updateCity(initialData.id, data)
      } else {
        result = await createCity(data)
      }

      if (result.success) {
        toast.success(initialData ? "Ville mise à jour" : "Ville créée")
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4 h-full flex flex-col">
        
        <div className="flex-1 space-y-4">
          
          {/* REMPLACEMENT ICI : On utilise SearchableSelect */}
          <FormField
            control={form.control}
            name="region_id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Région d'appartenance *</FormLabel>
                <FormControl>
                  <SearchableSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={regionOptions}
                    placeholder="Rechercher une région..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la Ville *</FormLabel>
                  <FormControl><Input placeholder="Ex: Lubumbashi" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="postal_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code Postal</FormLabel>
                  <FormControl><Input placeholder="Ex: 2000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl><Textarea {...field} value={field.value || ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Active</FormLabel>
                  <FormDescription>Ville desservie par le réseau</FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
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