// app/(dashboard)/dashboard/regions/page.tsx
import { Metadata } from "next"
import { RegionsClient } from "./regions-client"
import { Separator } from "@/components/ui/separator"
import { getRegions } from "@/actions/region"

export const metadata: Metadata = {
  title: "Gestion des Régions",
  description: "Administration du découpage régional postal",
}

export default async function RegionsPage() {
  // Fetching côté serveur (rapide et SEO friendly)
  const regions = await getRegions()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-medium tracking-tight">Régions Administratives</h3>
        <p className="text-sm text-muted-foreground">
          Gérez les 26 provinces et zones postales de la RDC.
        </p>
      </div>
      <Separator />
      
      {/* On passe les données au composant client */}
      <RegionsClient initialRegions={regions || []} />
    </div>
  )
}