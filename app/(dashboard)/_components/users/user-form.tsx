// components/users/user-form.tsx
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

import { UserFormData, userSchema, USER_ROLES_OPTIONS } from "@/lib/validations/users"
import { updateUser } from "@/actions/users"
import { SearchableSelect } from "@/components/ui/searchable-select"

interface UserFormProps {
  initialData?: any 
  agencies: { id: string, name: string }[] 
  onSuccess: () => void
  onCancel: () => void
}

export function UserForm({ initialData, agencies, onSuccess, onCancel }: UserFormProps) {
  const [loading, setLoading] = useState(false)

  // Préparation options agences
  const agencyOptions = agencies.map(a => ({ label: a.name, value: a.id }))

  // Extraction du rôle principal actuel (si existe)
  const currentRole = initialData?.user_roles?.[0]?.role?.code || 'AGENT'

  const form = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      full_name: "",
      email: "",
      role: "AGENT" as const,
      agency_id: "",
      is_active: true
    }
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        full_name: initialData.full_name || "",
        // On va chercher l'email via auth, mais ici on affiche souvent just le nom si l'email n'est pas dans profiles
        // (Note: Idéalement il faut une vue SQL qui joint auth.users, mais on fera simple ici)
        email: initialData.email || "Non visible", 
        role: currentRole,
        agency_id: initialData.agency_id || "",
        is_active: initialData.is_active ?? true
      })
    }
  }, [initialData, form, currentRole])

  const onSubmit = async (data: UserFormData) => {
    setLoading(true)
    try {
      // On ne fait que de l'update ici (la création se fait par Auth)
      const result = await updateUser(initialData.id, data)

      if (result.success) {
        toast.success("Profil utilisateur mis à jour")
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
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Lecture seule)</FormLabel>
              <FormControl><Input {...field} disabled className="bg-muted" /></FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom Complet *</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rôle Système *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {USER_ROLES_OPTIONS.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  Définit les permissions d'accès au dashboard.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="agency_id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Affectation Agence</FormLabel>
                <FormControl>
                  <SearchableSelect 
                    value={field.value || ""} 
                    onChange={field.onChange} 
                    options={agencyOptions}
                    placeholder="Sélectionner une agence..."
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Obligatoire sauf pour le Siège/Super Admin.
                </FormDescription>
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
                <FormLabel>Compte Actif</FormLabel>
                <FormDescription>L'utilisateur peut se connecter.</FormDescription>
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
            Enregistrer
          </Button>
        </div>

      </form>
    </Form>
  )
}