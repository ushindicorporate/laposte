// app/(dashboard)/dashboard/cities/page.tsx
import { Metadata } from "next"
import { getCities, getRegionsForSelect } from "@/actions/cities"
import { CitiesClient } from "./cities-client"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "Gestion des Villes",
}

export default async function CitiesPage() {
  // Fetching Parallèle (Performance Optimale)
  const [cities, regions] = await Promise.all([
    getCities(),
    getRegionsForSelect()
  ])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-medium tracking-tight">Villes & Zones</h3>
        <p className="text-sm text-muted-foreground">
          Configuration des villes desservies par le réseau postal.
        </p>
      </div>
      <Separator />
      
      <CitiesClient 
        initialCities={cities || []} 
        availableRegions={regions || []} 
      />
    </div>
  )
}