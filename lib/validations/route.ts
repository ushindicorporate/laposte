import { z } from 'zod';

// Validation pour un arrêt de route
export const routeStopSchema = z.object({
  agency_id: z.string().uuid('Sélectionnez une agence valide'),
  stop_order: z.number().int().min(1, 'L\'ordre doit être supérieur à 0'),
  estimated_arrival_minutes: z.number().int().min(0).optional().nullable(),
  estimated_departure_minutes: z.number().int().min(0).optional().nullable(),
  is_mandatory: z.boolean().default(true),
  notes: z.string().max(500, 'Les notes ne peuvent pas dépasser 500 caractères').optional().nullable(),
});

// Validation pour une route
export const routeSchema = z.object({
  code: z.string()
    .min(2, 'Le code doit contenir au moins 2 caractères')
    .max(20, 'Le code ne peut pas dépasser 20 caractères')
    .regex(/^[A-Z0-9-]+$/, 'Uniquement majuscules, chiffres et tirets'),
  name: z.string()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères'),
  origin_agency_id: z.string()
    .uuid('Sélectionnez une agence d\'origine valide')
    .nonempty('L\'agence d\'origine est obligatoire'),
  destination_agency_id: z.string()
    .uuid('Sélectionnez une agence de destination valide')
    .nonempty('L\'agence de destination est obligatoire'),
  distance_km: z.number()
    .min(0, 'La distance doit être positive')
    .optional()
    .nullable(),
  estimated_duration_minutes: z.number()
    .int()
    .min(0, 'La durée doit être positive')
    .optional()
    .nullable(),
  transport_type: z.enum(['ROAD', 'RAIL', 'AIR', 'MARITIME', 'OTHER']).default('ROAD'),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ON_DEMAND']).default('DAILY'),
  departure_time: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format HH:MM requis')
    .optional()
    .nullable(),
  arrival_time: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format HH:MM requis')
    .optional()
    .nullable(),
  is_active: z.boolean().default(true),
  route_stops: z.array(routeStopSchema).optional(),
}).refine(
  (data) => data.origin_agency_id !== data.destination_agency_id,
  {
    message: 'L\'origine et la destination doivent être différentes',
    path: ['destination_agency_id'],
  }
);

export type RouteFormData = z.infer<typeof routeSchema>;
export type RouteStopFormData = z.infer<typeof routeStopSchema>;