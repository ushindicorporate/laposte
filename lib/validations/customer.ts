import { z } from 'zod';

// Validation pour une adresse client
export const customerAddressSchema = z.object({
  address_type: z.enum(['PRINCIPALE', 'LIVRAISON', 'FACTURATION', 'AUTRE']).default('PRINCIPALE'),
  address_line1: z.string()
    .min(5, 'L\'adresse doit contenir au moins 5 caractères')
    .max(200, 'L\'adresse ne peut pas dépasser 200 caractères'),
  address_line2: z.string()
    .max(200, 'L\'adresse ne peut pas dépasser 200 caractères')
    .optional()
    .nullable(),
  city_id: z.string()
    .uuid('Sélectionnez une ville valide')
    .optional()
    .nullable(),
  postal_code: z.string()
    .max(10, 'Le code postal ne peut pas dépasser 10 caractères')
    .optional()
    .nullable(),
  country: z.string().default('RDC'),
  is_default: z.boolean().default(false),
  latitude: z.number()
    .min(-90, 'Latitude invalide')
    .max(90, 'Latitude invalide')
    .optional()
    .nullable(),
  longitude: z.number()
    .min(-180, 'Longitude invalide')
    .max(180, 'Longitude invalide')
    .optional()
    .nullable(),
  notes: z.string()
    .max(500, 'Les notes ne peuvent pas dépasser 500 caractères')
    .optional()
    .nullable(),
});

// Validation pour un client
export const customerSchema = z.object({
  customer_type: z.enum(['PARTICULIER', 'ENTREPRISE']).default('PARTICULIER'),
  full_name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères'),
  company_name: z.string()
    .max(200, 'Le nom de l\'entreprise ne peut pas dépasser 200 caractères')
    .optional()
    .nullable(),
  email: z.string()
    .email('Email invalide')
    .optional()
    .nullable(),
  phone: z.string()
    .min(10, 'Le téléphone doit contenir au moins 10 caractères')
    .max(20, 'Le téléphone ne peut pas dépasser 20 caractères')
    .regex(/^\+?[\d\s\-()]+$/, 'Format de téléphone invalide'),
  address: z.string()
    .max(500, 'L\'adresse ne peut pas dépasser 500 caractères')
    .optional()
    .nullable(),
  tax_id: z.string()
    .max(50, 'Le numéro fiscal ne peut pas dépasser 50 caractères')
    .optional()
    .nullable(),
  id_type: z.enum(['PASSPORT', 'NATIONAL_ID', 'DRIVER_LICENSE', 'OTHER'])
    .optional()
    .nullable(),
  id_number: z.string()
    .max(50, 'Le numéro d\'identification ne peut pas dépasser 50 caractères')
    .optional()
    .nullable(),
  is_active: z.boolean().default(true),
  notes: z.string()
    .max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères')
    .optional()
    .nullable(),
  addresses: z.array(customerAddressSchema).optional(),
}).refine((data) => {
  // Si c'est une entreprise, le nom de l'entreprise est requis
  if (data.customer_type === 'ENTREPRISE' && !data.company_name) {
    return false;
  }
  return true;
}, {
  message: 'Le nom de l\'entreprise est requis pour les entreprises',
  path: ['company_name'],
});

export type CustomerFormData = z.infer<typeof customerSchema>;
export type CustomerAddressFormData = z.infer<typeof customerAddressSchema>;

