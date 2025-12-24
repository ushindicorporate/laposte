// lib/validations/shipments.ts
import * as z from "zod"

// Sous-schéma pour une personne (Expéditeur/Destinataire)
export const partySchema = z.object({
  customer_id: z.string().optional(), // Si sélectionné depuis le CRM
  name: z.string().min(2, "Nom requis"),
  phone: z.string().min(9, "Téléphone requis"),
  address: z.string().optional(), // Adresse simple
  email: z.string().email("Email invalide").optional().or(z.literal("")),
})

// Sous-schéma pour un article dans le colis
export const itemSchema = z.object({
  description: z.string().min(2, "Description requise"),
  quantity: z.coerce.number().min(1, "Min 1").default(1),
  weight_kg: z.coerce.number().min(0.1, "Poids requis"),
  declared_value: z.coerce.number().optional(),
  is_fragile: z.boolean().default(false),
})

// Schéma Global
export const shipmentSchema = z.object({
  // 1. Parties
  sender: partySchema,
  recipient: partySchema,

  // 2. Logistique
  origin_agency_id: z.string().uuid(), // Sera rempli auto par l'agence de l'agent connecté
  destination_agency_id: z.string().uuid("Destination requise"),
  type: z.enum(['PARCEL', 'DOCUMENT', 'EMS']).default('PARCEL'),
  
  // 3. Contenu
  items: z.array(itemSchema).min(1, "Au moins un article requis"),
  
  // 4. Totaux (Calculés)
  total_weight: z.coerce.number(),
  total_price: z.coerce.number(),
})

export type ShipmentFormData = z.infer<typeof shipmentSchema>
export type PartyFormData = z.infer<typeof partySchema>
export type ItemFormData = z.infer<typeof itemSchema>