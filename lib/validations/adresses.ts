// lib/validations/addresses.ts
import * as z from "zod"

export const addressSchema = z.object({
  type: z.enum(['MAIN', 'DELIVERY', 'BILLING', 'OTHER'], {
    error: () => ({ message: "Type requis" })
  }),
  address_line1: z.string().min(5, "Adresse requise"),
  address_line2: z.string().optional(),
  city_id: z.string().uuid("Ville requise"),
  postal_code: z.string().optional(),
  contact_name: z.string().optional(), // ex: "Responsable Entrepôt"
  contact_phone: z.string().optional(),
  is_default: z.boolean().default(false),
})

export type AddressFormData = z.infer<typeof addressSchema>

export const ADDRESS_TYPES = [
  { value: 'MAIN', label: 'Adresse Principale / Siège' },
  { value: 'DELIVERY', label: 'Livraison / Entrepôt' },
  { value: 'BILLING', label: 'Facturation' },
  { value: 'OTHER', label: 'Autre' },
]