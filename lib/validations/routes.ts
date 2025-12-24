// lib/validations/routes.ts
import * as z from "zod"

export const routeSchema = z.object({
  name: z.string().min(3, "Nom requis"),
  code: z.string().min(3, "Code unique requis"),
  origin_agency_id: z.string().uuid("Origine requise"),
  destination_agency_id: z.string().uuid("Destination requise"),
  distance_km: z.coerce.number().min(0).optional(),
  estimated_duration_minutes: z.coerce.number().min(0).optional(),
  transport_type: z.enum(['ROAD', 'AIR', 'WATER', 'RAIL']).default('ROAD'),
  frequency: z.enum(['DAILY', 'WEEKLY', 'ADHOC']).default('DAILY'),
  is_active: z.boolean().default(true),
})
// Validation personnalisée : Origine != Destination
.refine((data) => data.origin_agency_id !== data.destination_agency_id, {
  message: "L'origine et la destination doivent être différentes",
  path: ["destination_agency_id"],
});

export type RouteFormData = z.infer<typeof routeSchema>

export const TRANSPORT_TYPES = [
  { value: 'ROAD', label: 'Routier (Camion)' },
  { value: 'AIR', label: 'Aérien (Avion)' },
  { value: 'WATER', label: 'Fluvial / Maritime' },
  { value: 'RAIL', label: 'Ferroviaire' },
]

export const FREQUENCY_TYPES = [
  { value: 'DAILY', label: 'Quotidien' },
  { value: 'WEEKLY', label: 'Hebdomadaire' },
  { value: 'ADHOC', label: 'À la demande' },
]