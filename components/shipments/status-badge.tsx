import { Badge } from "@/components/ui/badge"

const STATUS_CONFIG: Record<string, { label: string, className: string }> = {
  'CREATED': { label: 'Créé / En attente', className: 'bg-slate-500' },
  'RECEIVED': { label: 'Reçu au guichet', className: 'bg-blue-500' },
  'IN_TRANSIT': { label: 'En transit', className: 'bg-indigo-500' },
  'ARRIVED': { label: 'Arrivé à destination', className: 'bg-purple-500' },
  'OUT_FOR_DELIVERY': { label: 'En livraison', className: 'bg-orange-500' },
  'DELIVERED': { label: 'Livré', className: 'bg-green-600' },
  'RETURNED': { label: 'Retourné', className: 'bg-red-600' },
}

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'bg-gray-500' }
  
  return (
    <Badge className={`${config.className} hover:${config.className} text-white border-none px-3 py-1 text-sm`}>
      {config.label}
    </Badge>
  )
}