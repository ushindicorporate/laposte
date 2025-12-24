import { Metadata } from "next"
import { getUsers, getAgenciesForSelect } from "@/actions/users"
import { UsersClient } from "./users-client"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = { title: "Gestion des Utilisateurs" }

export default async function UsersPage() {
  const [users, agencies] = await Promise.all([
    getUsers(),
    getAgenciesForSelect()
  ])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-medium tracking-tight">Personnel & Accès</h3>
        <p className="text-sm text-muted-foreground">
          Gérez l'affectation des agents aux agences et leurs permissions.
        </p>
      </div>
      <Separator />
      
      <UsersClient 
        initialUsers={users || []} 
        agencies={agencies || []} 
      />
    </div>
  )
}