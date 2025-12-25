'use client'

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2, DollarSign, Smartphone, CreditCard } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { recordPayment } from "@/actions/finance"

const paymentSchema = z.object({
  amount: z.coerce.number().min(1, "Montant invalide"),
  method: z.enum(['CASH', 'MOBILE_MONEY', 'BANK_TRANSFER']),
  reference: z.string().optional()
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shipment: { id: string, tracking_number: string, total_price: number, payment_status: string }
  onSuccess?: () => void
}

export function PaymentDialog({ open, onOpenChange, shipment, onSuccess }: PaymentDialogProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: shipment.total_price, // Par défaut, on propose de tout payer
      method: "CASH",
      reference: ""
    }
  })

  const onSubmit = async (data: PaymentFormData) => {
    setLoading(true)
    try {
      const result = await recordPayment({
        shipmentId: shipment.id,
        amount: data.amount,
        method: data.method,
        reference: data.reference
      })

      if (result.success) {
        toast.success("Paiement enregistré")
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        toast.error(result.error as string)
      }
    } catch (e) {
      toast.error("Erreur système")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Encaissement {shipment.tracking_number}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            
            <div className="p-4 bg-muted rounded-md text-center">
              <span className="text-sm text-muted-foreground">Montant Total à Payer</span>
              <div className="text-2xl font-bold text-primary">{shipment.total_price} $</div>
            </div>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant reçu</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} value={field.value as number} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mode de paiement</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="CASH">
                        <div className="flex items-center"><DollarSign className="w-4 h-4 mr-2"/> Espèces (Cash)</div>
                      </SelectItem>
                      <SelectItem value="MOBILE_MONEY">
                        <div className="flex items-center"><Smartphone className="w-4 h-4 mr-2"/> Mobile Money</div>
                      </SelectItem>
                      <SelectItem value="BANK_TRANSFER">
                        <div className="flex items-center"><CreditCard className="w-4 h-4 mr-2"/> Virement</div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Référence (Optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="ID Transaction M-Pesa..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
                <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Valider l'Encaissement
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}