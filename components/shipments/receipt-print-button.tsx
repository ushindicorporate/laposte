'use client'

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export function ReceiptPrintButton() {
  return (
    <Button onClick={() => window.print()} className="bg-black text-white hover:bg-gray-800">
      <Printer className="mr-2 h-4 w-4" /> Imprimer le Reçu
    </Button>
  )
}