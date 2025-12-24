// lib/validations/cities.ts
import * as z from "zod"

export const citySchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  region_id: z.string().uuid("Veuillez sélectionner une région valide"),
  postal_code: z.string().optional(),
  description: z.string().optional(), // Mappé sur 'notes' en DB
  is_active: z.boolean().default(true),
  // Champs avancés (optionnels pour l'instant, mais prévus dans la DB)
  population: z.coerce.number().optional(),
})

export type CityFormData = z.infer<typeof citySchema>