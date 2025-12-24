// lib/validations/users.ts
import * as z from "zod"

export const userSchema = z.object({
  full_name: z.string().min(2, "Le nom est requis"),
  email: z.string().email().readonly(), // L'email ne change pas ici
  agency_id: z.string().nullable().optional(), // Peut être null pour un Super Admin
  role: z.enum(['SUPER_ADMIN', 'REGIONAL_MANAGER', 'AGENCY_MANAGER', 'AGENT', 'DRIVER', 'FINANCE'], {
    message: "Le rôle est obligatoire",
  }),
  is_active: z.boolean().default(true),
})

export type UserFormData = z.infer<typeof userSchema>

export const USER_ROLES_OPTIONS = [
  { value: 'SUPER_ADMIN', label: 'Super Administrateur (Siège)' },
  { value: 'REGIONAL_MANAGER', label: 'Directeur Régional' },
  { value: 'AGENCY_MANAGER', label: 'Chef d\'Agence' },
  { value: 'AGENT', label: 'Agent de Guichet' },
  { value: 'DRIVER', label: 'Chauffeur / Livreur' },
  { value: 'FINANCE', label: 'Contrôleur Financier' },
]