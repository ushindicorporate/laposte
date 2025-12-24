// components/routes/route-form.tsx
'use client'

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

import { RouteFormData, routeSchema, TRANSPORT_TYPES, FREQUENCY_TYPES } from "@/lib/validations/routes"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { updateRoute, createRoute } from "@/actions/route"

interface RouteFormProps {
  initialData?: any 
  agencies: { id: string, name: string }[] 
  onSuccess: () => void
  onCancel: () => void
}

export function RouteForm({ initialData, agencies, onSuccess, onCancel }: RouteFormProps) {
  const [loading, setLoading] = useState(false)

  const agencyOptions = agencies.map(a => ({ label: a.name, value: a.id }))

  const form = useForm({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      name: "",
      code: "",
      origin_agency_id: "",
      destination_agency_id: "",
      transport_type: "ROAD" as const,
      frequency: "DAILY" as const,
      distance_km: 0,
      estimated_duration_minutes: 0,
      is_active: true
    }
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        code: initialData.code,
        origin_agency_id: initialData.origin_agency_id,
        destination_agency_id: initialData.destination_agency_id,
        transport_type: initialData.transport_type || "ROAD",
        frequency: initialData.frequency || "DAILY",
        distance_km: initialData.distance_km || 0,
        estimated_duration_minutes: initialData.estimated_duration_minutes || 0,
        is_active: initialData.is_active ?? true
      })
    }
  }, [initialData, form])

  const onSubmit = async (data: RouteFormData) => {
    setLoading(true)
    try {
      let result
      if (initialData?.id) {
        result = await updateRoute(initialData.id, data)
      } else {
        result = await createRoute(data)
      }

      if (result.success) {
        toast.success("Trajet enregistré")
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
        
        {/* IDENTIFICATION */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du Trajet *</FormLabel>
                <FormControl><Input placeholder="KIN -> LUB (Express)" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code Route *</FormLabel>
                <FormControl><Input placeholder="RT-001" {...field} onChange={e => field.onChange(e.target.value.toUpperCase())}/></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ORIGINE / DESTINATION */}
        <div className="grid grid-cols-2 gap-4 p-4 border rounded-md bg-muted/5">
          <FormField
            control={form.control}
            name="origin_agency_id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Origine (Départ)</FormLabel>
                <FormControl>
                  <SearchableSelect 
                    value={field.value} onChange={field.onChange} options={agencyOptions} 
                    placeholder="Choisir..." 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="destination_agency_id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Destination (Arrivée)</FormLabel>
                <FormControl>
                  <SearchableSelect 
                    value={field.value} onChange={field.onChange} options={agencyOptions} 
                    placeholder="Choisir..." 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* LOGISTIQUE */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="transport_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transport</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                  <SelectContent>
                    {TRANSPORT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fréquence</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                  <SelectContent>
                    {FREQUENCY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* METRIQUES */}
        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="distance_km"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Distance (km)</FormLabel>
                    <FormControl>
                        <Input 
                            type="number" 
                            placeholder="0"
                            {...field}
                            value={field.value as number}
                            onChange={e => field.onChange(e.target.valueAsNumber || 0)}
                        />
                    </FormControl>
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="estimated_duration_minutes"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Durée Est. (min)</FormLabel>
                        <FormControl>
                            <Input 
                                type="number" 
                                placeholder="0"
                                {...field}
                                value={field.value as number}
                                onChange={e => field.onChange(e.target.valueAsNumber || 0)}
                            />
                        </FormControl>
                    <FormDescription>Ex: 120 pour 2h</FormDescription>
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
                <FormLabel>Route Active</FormLabel>
                <FormDescription>Disponible pour le routage des colis</FormDescription>
              </div>
            </FormItem>
          )}
        />

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