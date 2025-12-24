import { Metadata } from "next"
import { getAgencies, getCitiesForSelect } from "@/actions/agencies"
import { Separator } from "@/components/ui/separator"
import { AgenciesClient } from "./agencies-client"

export const metadata: Metadata = { title: "Gestion des Agences" }

export default async function AgenciesPage() {
  const [agencies, cities] = await Promise.all([
    getAgencies(),
    getCitiesForSelect()
  ])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-medium tracking-tight">Réseau d'Agences</h3>
        <p className="text-sm text-muted-foreground">
          Administration des points de présence.
        </p>
      </div>
      <Separator />
      
      <AgenciesClient 
        initialAgencies={agencies || []} 
        cities={cities || []} 
      />
    </div>
  )
}