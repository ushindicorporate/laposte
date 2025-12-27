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
import { createUser, updateUser } from "@/actions/users"
import { SearchableSelect } from "@/components/ui/searchable-select"

interface UserFormProps {
  initialData?: any 
  agencies: { id: string, name: string }[] 
  onSuccess: () => void
  onCancel: () => void
}

export function UserForm({ initialData, agencies, onSuccess, onCancel }: UserFormProps) {
  const [loading, setLoading] = useState(false)
  const agencyOptions = agencies.map(a => ({ label: a.name, value: a.id }))
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
        email: initialData.email || "",
        password: "", // Pas de mot de passe en édition
        role: currentRole,
        agency_id: initialData.agency_id || "",
        is_active: initialData.is_active ?? true
      })
    }
  }, [initialData, form, currentRole])

  const onSubmit = async (data: UserFormData) => {
    setLoading(true)
    try {
      let result
      if (initialData?.id) {
        // En édition, on ignore le mot de passe pour l'instant
        // (Pour changer le mdp, il faudrait une route dédiée ou utiliser Supabase Reset)
        const { password, ...updateData } = data
        result = await updateUser(initialData.id, updateData as any)
      } else {
        result = await createUser(data)
      }

      if (result.success) {
        toast.success(initialData ? "Utilisateur mis à jour" : "Utilisateur créé")
        onSuccess()
      } else {
        toast.error(typeof result.error === 'string' ? result.error : "Erreur validation")
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
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input 
                    {...field} 
                    type="email" 
                    placeholder="agent@poste.cd"
                    disabled={!!initialData} // Bloqué en mode édition
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Mot de passe (Visible seulement en création) */}
        {!initialData && (
            <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Mot de passe provisoire *</FormLabel>
                <FormControl>
                    <Input {...field} type="password" placeholder="••••••••" />
                </FormControl>
                <FormDescription>Min. 6 caractères.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
        )}

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