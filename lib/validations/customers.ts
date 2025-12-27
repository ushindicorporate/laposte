// lib/validations/customers.ts
import * as z from "zod"

export const customerSchema = z.object({
  // Tous les champs sont définis dans un seul objet
  type: z.enum(['INDIVIDUAL', 'CORPORATE', 'GOVERNMENT', 'NGO'], {
    error: () => ({ message: "Type requis" })
  }),
  name: z.string().min(2, "Le nom est requis"),
  email: z.union([z.literal(""), z.string().email("Email invalide")]),
  phone: z.string().min(9, "Téléphone invalide (min 9 chiffres)"),
  address: z.string().optional(),
  
  // On rend tax_id optionnel par défaut pour ne pas bloquer le formulaire
  tax_id: z.string().optional(),
  
  is_active: z.boolean().default(true),
})
.refine((data) => {
  // LOGIQUE CONDITIONNELLE MANUELLE
  // Si ce n'est pas un Particulier, le tax_id est obligatoire
  if (data.type !== 'INDIVIDUAL' && (!data.tax_id || data.tax_id.length < 3)) {
    return false
  }
  return true
}, {
  message: "Le RCCM / Id. Nat. est obligatoire pour les entreprises",
  path: ["tax_id"], // L'erreur s'affichera sous le champ tax_id
})

export type CustomerFormData = z.infer<typeof customerSchema>

export const CUSTOMER_TYPES = [
  { value: 'INDIVIDUAL', label: 'Particulier' },
  { value: 'CORPORATE', label: 'Entreprise' },
  { value: 'GOVERNMENT', label: 'Institution Publique' },
  { value: 'NGO', label: 'ONG' },
]