import { Metadata } from "next"
import { getShipmentFormData } from "@/actions/shipments"
import { NewShipmentWizard } from "@/app/(dashboard)/_components/shipments/new-shipment-wizard"

export const metadata: Metadata = { title: "Nouvel Envoi" }

export default async function NewShipmentPage() {
  const { agencies } = await getShipmentFormData()

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h3 className="text-2xl font-medium tracking-tight">Nouvel Envoi</h3>
        <p className="text-sm text-muted-foreground">
          Saisie d'un colis ou courrier au guichet.
        </p>
      </div>
      
      <NewShipmentWizard agencies={agencies} />
    </div>
  )
}