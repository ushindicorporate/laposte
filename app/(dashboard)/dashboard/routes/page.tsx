import { Metadata } from "next"
import { Separator } from "@/components/ui/separator"
import { getAgencies } from "@/actions/agencies"
import { getRoutes } from "@/actions/route"
import { RoutesClient } from "./routes-client"

export const metadata: Metadata = { title: "Gestion des Routes" }

export default async function RoutesPage() {
  const [routes, agencies] = await Promise.all([
    getRoutes(),
    getAgencies()
  ])

  // Transformation des agences pour le selecteur
  const agencyOptions = (agencies || []).map((a: any) => ({
    id: a.id,
    name: `${a.name} (${a.code})`
  }))

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-medium tracking-tight">Routes & Logistique</h3>
        <p className="text-sm text-muted-foreground">
          Définition des liaisons de transport entre les agences.
        </p>
      </div>
      <Separator />
      
      <RoutesClient 
        initialRoutes={routes || []} 
        agencies={agencyOptions} 
      />
    </div>
  )
}