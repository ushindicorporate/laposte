import { Metadata } from "next"
import { DeliveryForm } from "../../_components/delivery/delivery-form"

export const metadata: Metadata = { title: "Livraison" }

export default function DeliveryPage() {
  return (
    <div className="space-y-6 pt-6">
      <DeliveryForm />
    </div>
  )
}