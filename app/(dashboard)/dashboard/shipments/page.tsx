import { Metadata } from "next"
import { getShipments } from "@/actions/shipments"
import { ShipmentsClient } from "./shipments-client"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = { title: "Liste des Envois" }

export default async function ShipmentsListPage() {
  const shipments = await getShipments()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-medium tracking-tight">Envois & Colis</h3>
        <p className="text-sm text-muted-foreground">
          Suivi global des expéditions en cours.
        </p>
      </div>
      <Separator />
      
      <ShipmentsClient initialShipments={shipments || []} />
    </div>
  )
}