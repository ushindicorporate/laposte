import { Metadata } from "next"
import { getCustomers } from "@/actions/customers"
import { CustomersClient } from "./customers-client"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = { title: "Base Clients CRM" }

export default async function CustomersPage() {
  const customers = await getCustomers()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-medium tracking-tight">Clients & Partenaires</h3>
        <p className="text-sm text-muted-foreground">
          Annuaire centralisé des expéditeurs et destinataires.
        </p>
      </div>
      <Separator />
      
      <CustomersClient initialCustomers={customers || []} />
    </div>
  )
}