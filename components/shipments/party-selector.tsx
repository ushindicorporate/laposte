'use client'

import { useState, useEffect } from "react"
import { useFormContext } from "react-hook-form" // On utilise le contexte du formulaire parent
import { Search, User, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getCustomers } from "@/actions/customers" // On réutilise ton action existante
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import { QuickCreateDialog } from "../customers/quick-create-dialog"

interface PartySelectorProps {
  type: "sender" | "recipient"
  label: string
}

export function PartySelector({ type, label }: PartySelectorProps) {
  const { control, setValue, watch } = useFormContext()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  // Si un client est sélectionné (on a un ID)
  const selectedCustomerId = watch(`${type}.customer_id`)

  // Recherche Client (Debounce manuel simple)
  useEffect(() => {
    if (searchQuery.length < 3) {
        setSearchResults([])
        return
    }
    const timer = setTimeout(async () => {
        setIsSearching(true)
        const results = await getCustomers(searchQuery)
        setSearchResults(results || [])
        setIsSearching(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const selectCustomer = (customer: any) => {
    setValue(`${type}.customer_id`, customer.id)
    setValue(`${type}.name`, customer.name)
    setValue(`${type}.phone`, customer.phone)
    setValue(`${type}.address`, customer.address || "")
    setValue(`${type}.email`, customer.email || "")
    setSearchQuery("") // Clear search
    setSearchResults([]) // Clear results
  }

  const clearSelection = () => {
    setValue(`${type}.customer_id`, undefined)
    setValue(`${type}.name`, "")
    setValue(`${type}.phone`, "")
    setValue(`${type}.address`, "")
    setValue(`${type}.email`, "")
  }

  const handleQuickCreate = (customer: any) => {
    selectCustomer(customer) // Remplit automatiquement les champs
    toast.info(`Client ${customer.name} sélectionné`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> {label}
        </h3>
        {selectedCustomerId && (
            <Button variant="ghost" size="sm" onClick={clearSelection} className="text-destructive h-8">
                <X className="h-4 w-4 mr-1" /> Détacher Client
            </Button>
        )}
      </div>

      {/* BARRE DE RECHERCHE CRM */}
      {!selectedCustomerId && (
        <div className="flex gap-2 items-center">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Rechercher client existant (Nom, Tél)..." 
                    className="pl-9"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>
            
            {/* RÉSULTATS DE RECHERCHE */}
            {searchResults.length > 0 && (
                <div className="absolute z-10 w-full bg-popover border rounded-md shadow-md mt-1 max-h-50 overflow-y-auto">
                    {searchResults.map(c => (
                        <div 
                            key={c.id} 
                            className="p-2 hover:bg-muted cursor-pointer text-sm"
                            onClick={() => selectCustomer(c)}
                        >
                            <div className="font-medium">{c.name}</div>
                            <div className="text-xs text-muted-foreground">{c.phone} • {c.email}</div>
                        </div>
                    ))}
                </div>
            )}
            <QuickCreateDialog onCustomerCreated={handleQuickCreate} />
        </div>
      )}

      {/* CHAMPS FORMULAIRE (Auto-remplis ou manuels) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-card">
        <FormField
            control={control}
            name={`${type}.name`}
            render={({ field }) => (
            <FormItem>
                <FormLabel>Nom Complet *</FormLabel>
                <FormControl><Input {...field} disabled={!!selectedCustomerId} /></FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        <FormField
            control={control}
            name={`${type}.phone`}
            render={({ field }) => (
            <FormItem>
                <FormLabel>Téléphone *</FormLabel>
                <FormControl><Input {...field} disabled={!!selectedCustomerId} /></FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        <FormField
            control={control}
            name={`${type}.email`}
            render={({ field }) => (
            <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input {...field} disabled={!!selectedCustomerId} /></FormControl>
            </FormItem>
            )}
        />
        <FormField
            control={control}
            name={`${type}.address`}
            render={({ field }) => (
            <FormItem>
                <FormLabel>Adresse</FormLabel>
                <FormControl><Input {...field} disabled={!!selectedCustomerId} /></FormControl>
            </FormItem>
            )}
        />
      </div>
    </div>
  )
}