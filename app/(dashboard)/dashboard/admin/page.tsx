import { Metadata } from "next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getHolidays, getTariffConfig } from "@/actions/admin"
import { HolidaysManager } from "@/components/admin/holidays-manager"
import { PricingManager } from "@/components/admin/pricing-manager"
import { RoleGate } from "@/components/auth/role-gate"

export const metadata: Metadata = { title: "Administration Système" }

export default async function AdminPage() {
  const [holidays, tariff] = await Promise.all([
    getHolidays(),
    getTariffConfig()
  ])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-medium tracking-tight">Paramètres Système</h3>
        <p className="text-sm text-muted-foreground">
          Configuration globale de l'ERP. Zone réservée aux administrateurs.
        </p>
      </div>

      <RoleGate allowedRoles={['SUPER_ADMIN']}>
        <Tabs defaultValue="pricing" className="space-y-4">
            <TabsList>
                <TabsTrigger value="pricing">Tarification</TabsTrigger>
                <TabsTrigger value="holidays">Calendrier</TabsTrigger>
                {/* On pourrait ajouter Settings, Notifications, etc. ici */}
            </TabsList>

            <TabsContent value="pricing">
                <PricingManager tariff={tariff} />
            </TabsContent>

            <TabsContent value="holidays">
                <HolidaysManager holidays={holidays} />
            </TabsContent>
        </Tabs>
      </RoleGate>
    </div>
  )
}