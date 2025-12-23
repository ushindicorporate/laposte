// /lib/validations/region.ts
import { z } from 'zod';

export const regionSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s\-]+$/, 'Caractères spéciaux non autorisés'),
  code: z.string()
    .min(2, 'Le code doit contenir au moins 2 caractères')
    .max(10, 'Le code ne peut pas dépasser 10 caractères')
    .regex(/^[A-Z0-9\-]+$/i, 'Code invalide'),
});

export type RegionFormData = z.infer<typeof regionSchema>;

export interface Region {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  is_active?: boolean;
}

export interface RegionFormInputs {
  name: string;
  code?: string;
}
