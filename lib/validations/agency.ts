// /lib/validations/agency.ts
import { z } from 'zod';

export const agencySchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères'),
  code: z.string()
    .min(2, 'Le code doit contenir au moins 2 caractères')
    .max(20, 'Le code ne peut pas dépasser 20 caractères')
    .regex(/^[A-Z0-9-]+$/, 'Uniquement majuscules, chiffres et tirets'),
  city_id: z.string()
    .uuid('Veuillez sélectionner une ville valide')
    .nonempty('La ville est obligatoire'),
  address: z.string()
    .min(5, 'L\'adresse doit contenir au moins 5 caractères')
    .max(500, 'L\'adresse ne peut pas dépasser 500 caractères')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .regex(/^\+?[\d\s\-()]+$/, 'Format de téléphone invalide')
    .optional()
    .or(z.literal('')),
  email: z.string()
    .email('Email invalide')
    .optional()
    .or(z.literal('')),
  // NOTE: Votre table n'a pas manager_name, seulement manager_id (UUID)
  // Pour l'instant, on le garde optionnel mais il ne sera pas sauvegardé
  manager_name: z.string()
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .optional()
    .or(z.literal('')),
  opening_hours: z.string()
    .max(200, 'Les horaires ne peuvent pas dépasser 200 caractères')
    .optional()
    .or(z.literal('')),
  latitude: z.number()
    .min(-90, 'Latitude invalide')
    .max(90, 'Latitude invalide')
    .optional()
    .or(z.nan()),
  longitude: z.number()
    .min(-180, 'Longitude invalide')
    .max(180, 'Longitude invalide')
    .optional()
    .or(z.nan()),
}).refine((data) => {
  // Si latitude est fournie, longitude doit l'être aussi
  if (data.latitude && !data.longitude) return false;
  if (data.longitude && !data.latitude) return false;
  return true;
}, {
  message: 'Latitude et longitude doivent être fournies ensemble',
  path: ['longitude'],
});

export type AgencyFormData = z.infer<typeof agencySchema>;