// /lib/validations/city.ts
import { z } from 'zod';

export const citySchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Caractères spéciaux non autorisés'),
  region_id: z.string()
    .uuid('Veuillez sélectionner une région valide')
    .nonempty('La région est obligatoire'),
  postal_code: z.string()
    .max(20, 'Le code postal ne peut pas dépasser 20 caractères')
    .optional()
    .or(z.literal('')),
  population: z.number()
    .min(0, 'La population ne peut pas être négative')
    .optional()
    .or(z.nan()),
});

export type CityFormData = z.infer<typeof citySchema>;