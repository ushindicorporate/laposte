'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DollarSign } from "lucide-react"
import { useRouter } from "next/navigation"
import { PaymentDialog } from "../finance/payment-dialog"

export function ShipmentActions({ shipment }: { shipment: any }) {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const router = useRouter()

  // On affiche le bouton seulement si pas encore payé totalement
  const needsPayment = shipment.payment_status !== 'PAID'

  return (
    <>
      {needsPayment && (
        <Button onClick={() => setIsPaymentOpen(true)} className="bg-green-600 hover:bg-green-700">
          <DollarSign className="mr-2 h-4 w-4" /> Encaisser
        </Button>
      )}

      <PaymentDialog 
        open={isPaymentOpen} 
        onOpenChange={setIsPaymentOpen}
        shipment={shipment}
        onSuccess={() => router.refresh()}
      />
    </>
  )
}