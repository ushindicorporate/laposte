// lib/validations/agencies.ts
import * as z from "zod"

export const agencySchema = z.object({
  name: z.string().min(3, "Le nom doit faire au moins 3 caractères"),
  code: z.string()
    .min(3, "Code trop court")
    .regex(/^[A-Z0-9-]+$/, "Majuscules, chiffres et tirets uniquement"),
  
  type: z.enum(['POST_OFFICE', 'SORTING_CENTER', 'HEADQUARTERS', 'RELAY_POINT']),

  city_id: z.string().uuid("La ville est obligatoire"),
  address: z.string().optional(),
  phone: z.string().optional(),
  
  // Petite astuce pour l'email optionnel vide qui ne déclenche pas l'erreur de format
  email: z.union([z.literal(""), z.string().email("Email invalide")]),
  
  is_active: z.boolean().default(true),
})

export type AgencyFormData = z.infer<typeof agencySchema>

// Constantes pour l'UI
export const AGENCY_TYPES = [
  { value: 'POST_OFFICE', label: 'Bureau de Poste (Guichet)' },
  { value: 'SORTING_CENTER', label: 'Centre de Tri (Hub)' },
  { value: 'HEADQUARTERS', label: 'Direction / Siège' },
  { value: 'RELAY_POINT', label: 'Point Relais Partenaire' },
]