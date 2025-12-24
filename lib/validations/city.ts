import * as z from 'zod';

// export const citySchema = z.object({
//   name: z.string().min(1, "Le nom est requis"),
//   region_id: z.string().min(1, "La région est requise"),
//   postal_code: z.string().nullable().optional(),
//   population: z.number().nullable().optional(),
//   area_km2: z.number().nullable().optional(),
//   timezone: z.string().default("Africa/Lubumbashi"),
//   latitude: z.number().nullable().optional(),
//   longitude: z.number().nullable().optional(),
//   is_capital: z.boolean().default(false),
//   economic_zone: z.string().nullable().optional(),
//   last_census_year: z.number().nullable().optional(),
//   notes: z.string().nullable().optional(),
//   is_active: z.boolean().default(true),
// });

export const citySchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  region_id: z.string().min(1, "La région est requise"),
  postal_code: z.string(),
  population: z.number().nullable().default(null),
  area_km2: z.number().nullable().default(null),
  timezone: z.string().default('Africa/Lubumbashi'),
  latitude: z.number().nullable().default(null),
  longitude: z.number().nullable().default(null),
  is_capital: z.boolean().default(false),
  economic_zone: z.string().nullable().default(''),
  notes: z.string().nullable().default(''),
});

export type CityFormData = z.infer<typeof citySchema>;
