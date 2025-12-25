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
import { updateRegion, createRegion } from "@/actions/region"
import { regionSchema, RegionFormData } from "@/lib/validations/region"

interface RegionFormProps {
  initialData?: any 
  onSuccess: () => void
  onCancel: () => void
}

export function RegionForm({ initialData, onSuccess, onCancel }: RegionFormProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(regionSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      is_active: true
    }
  })

  // Reset le formulaire quand les données changent (important pour la réutilisation)
  useEffect(() => {
    if (initialData) {
      form.reset(initialData)
    } else {
      form.reset({
        name: "",
        code: "",
        description: "",
        is_active: true
      })
    }
  }, [initialData, form])

  const onSubmit = async (data: RegionFormData) => {
    setLoading(true)
    try {
      let result
      if (initialData?.id) {
        result = await updateRegion(initialData.id, data)
      } else {
        result = await createRegion(data)
      }

      if (result.success) {
        toast.success(initialData ? "Modification enregistrée" : "Région créée")
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
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl><Input placeholder="Ex: Kinshasa" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input placeholder="KIN" maxLength={3} {...field} onChange={e => field.onChange(e.target.value.toUpperCase())} />
                </FormControl>
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
              <FormLabel>Description</FormLabel>
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
                <FormDescription>Visible dans le système</FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* BOUTONS D'ACTION CLASSIQUES (Pas de SheetClose spécifique) */}
        <div className="flex justify-end gap-3 pt-4 border-t mt-8">
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