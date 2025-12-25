import { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDailyRevenue } from "@/actions/finance"
import { DollarSign, TrendingUp } from "lucide-react"

export const metadata: Metadata = { title: "Finance" }

export default async function FinancePage() {
  const { total, count, raw } = await getDailyRevenue()

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-medium tracking-tight">Finance & Revenus</h3>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus du Jour (Global)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total.toFixed(2)} $</div>
            <p className="text-xs text-muted-foreground">
              {count} transactions enregistrées aujourd'hui
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Transactions Récentes</CardTitle>
        </CardHeader>
        <CardContent>
            <ul className="space-y-2">
                {raw?.map((p: any, i: number) => (
                    <li key={i} className="flex justify-between p-2 border-b text-sm">
                        <span>{p.payment_method}</span>
                        <span className="font-mono">{p.amount} $</span>
                    </li>
                ))}
            </ul>
        </CardContent>
      </Card>
    </div>
  )
}