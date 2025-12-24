// lib/validations/regions.ts
import * as z from "zod"

export const regionSchema = z.object({
  id: z.string().optional(), // Optionnel car absent à la création
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  code: z.string()
    .min(3, "Le code doit faire exactement 3 caractères")
    .max(3, "Le code doit faire exactement 3 caractères")
    .regex(/^[A-Z0-9]+$/, "Lettres majuscules et chiffres uniquement")
    .transform(val => val.toUpperCase()), // Auto-uppercase
  description: z.string().optional(),
  is_active: z.boolean().default(true),
})

export type RegionFormData = z.infer<typeof regionSchema>