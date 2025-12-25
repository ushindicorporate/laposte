import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function AgencyList({ data }: { data: any[] }) {
  return (
    <div className="space-y-8">
      {data.map((agency) => (
        <div key={agency.agency_name} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{agency.agency_name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{agency.agency_name}</p>
            <p className="text-xs text-muted-foreground">
              {agency.shipments_created} colis expédiés
            </p>
          </div>
          <div className="ml-auto font-medium">+{agency.revenue_generated} $</div>
        </div>
      ))}
    </div>
  )
}