'use client'

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CustomerForm } from "@/components/customers/customer-form"

interface QuickCreateDialogProps {
  onCustomerCreated: (customer: any) => void
}

export function QuickCreateDialog({ onCustomerCreated }: QuickCreateDialogProps) {
  const [open, setOpen] = useState(false)

  const handleSuccess = (newCustomer: any) => {
    setOpen(false)
    if (newCustomer) {
      onCustomerCreated(newCustomer)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Nouveau Client">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau Client</DialogTitle>
          <DialogDescription>
            Création rapide d'un expéditeur ou destinataire.
          </DialogDescription>
        </DialogHeader>
        
        <CustomerForm 
          onSuccess={handleSuccess} 
          onCancel={() => setOpen(false)} 
        />
      </DialogContent>
    </Dialog>
  )
}