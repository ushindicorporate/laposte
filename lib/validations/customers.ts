// lib/validations/customers.ts
import * as z from "zod"

const baseSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  email: z.union([z.literal(""), z.string().email("Email invalide")]),
  phone: z.string().min(9, "Numéro de téléphone invalide (min 9 chiffres)"),
  address: z.string().optional(), // Adresse rapide (texte)
  is_active: z.boolean().default(true),
})

// Schéma Entreprise (Tax ID requis)
const corporateSchema = baseSchema.extend({
  type: z.enum(['CORPORATE', 'GOVERNMENT', 'NGO']),
  tax_id: z.string().min(3, "RCCM / Id. Nat. requis pour les entreprises"),
})

// Schéma Particulier (Tax ID optionnel)
const individualSchema = baseSchema.extend({
  type: z.literal('INDIVIDUAL'),
  tax_id: z.string().optional(),
})

// Union discriminée
export const customerSchema = z.discriminatedUnion("type", [
  individualSchema,
  corporateSchema
])

export type CustomerFormData = z.infer<typeof customerSchema>

export const CUSTOMER_TYPES = [
  { value: 'INDIVIDUAL', label: 'Particulier' },
  { value: 'CORPORATE', label: 'Entreprise' },
  { value: 'GOVERNMENT', label: 'Institution Publique' },
  { value: 'NGO', label: 'ONG' },
]