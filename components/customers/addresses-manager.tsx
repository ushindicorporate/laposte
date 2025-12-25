'use client'

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2, Trash2, MapPin, Building, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"

import { getCitiesForSelect } from "@/actions/agencies" // On réutilise l'action des villes
import { SearchableSelect } from "@/components/ui/searchable-select"
import { getCustomerAddresses, createAddress, deleteAddress } from "@/actions/adresses"
import { AddressFormData, addressSchema, ADDRESS_TYPES } from "@/lib/validations/adresses"

interface AddressesManagerProps {
  customer: any
}

export function AddressesManager({ customer }: AddressesManagerProps) {
  const [addresses, setAddresses] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [loadingSubmit, setLoadingSubmit] = useState(false)

  // Formulaire pour AJOUTER une adresse
  const form = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      type: 'DELIVERY',
      address_line1: "",
      address_line2: "",
      city_id: "",
      postal_code: "",
      contact_name: "",
      contact_phone: "",
      is_default: false
    }
  })

  // Chargement des données (Adresses existantes + Villes dispos)
  const fetchData = useCallback(async () => {
    try {
      const [addrData, citiesData] = await Promise.all([
        getCustomerAddresses(customer.id),
        getCitiesForSelect()
      ])
      setAddresses(addrData || [])
      setCities(citiesData || [])
    } catch (e) {
      toast.error("Erreur chargement")
    } finally {
      setLoadingList(false)
    }
  }, [customer.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const onSubmit = async (data: AddressFormData) => {
    setLoadingSubmit(true)
    const result = await createAddress(customer.id, data)
    setLoadingSubmit(false)

    if (result.success) {
      toast.success("Adresse ajoutée")
      form.reset() // Reset form
      fetchData() // Refresh list
    } else {
      toast.error("Erreur d'enregistrement")
    }
  }

  const handleDelete = async (id: string) => {
    if(!confirm("Supprimer cette adresse ?")) return
    await deleteAddress(id)
    fetchData()
    toast.success("Adresse supprimée")
  }

  // Transformation villes pour select
  const cityOptions = cities.map(c => ({ label: c.name, value: c.id }))

  if (loadingList) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

  return (
    <div className="space-y-6">
      
      {/* HEADER INFO CLIENT */}
      <div className="bg-primary/5 p-4 rounded-md border border-primary/10 flex items-center justify-between">
        <div>
            <h4 className="font-bold text-sm">{customer.name}</h4>
            <p className="text-xs text-muted-foreground">{customer.account_number}</p>
        </div>
        <Badge variant="outline">{addresses.length} Adresses</Badge>
      </div>

      {/* LISTE DES ADRESSES EXISTANTES */}
      <div className="space-y-3">
        {addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-4">Aucune adresse enregistrée.</p>
        ) : (
            <div className="grid gap-3">
                {addresses.map((addr) => (
                    <div key={addr.id} className="relative bg-card border p-3 rounded-md flex flex-col gap-1 group">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <Badge variant={addr.is_default ? "default" : "secondary"} className="text-[10px]">
                                    {addr.type}
                                </Badge>
                                <span className="font-medium text-sm">{addr.city?.name}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => handleDelete(addr.id)}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                        
                        <div className="text-sm border-l-2 border-muted pl-2 mt-1">
                            <p>{addr.address_line1}</p>
                            {addr.address_line2 && <p className="text-muted-foreground">{addr.address_line2}</p>}
                        </div>

                        {(addr.contact_name || addr.contact_phone) && (
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground bg-muted/30 p-1.5 rounded">
                                {addr.contact_name && <span className="flex items-center gap-1"><Building className="h-3 w-3"/> {addr.contact_name}</span>}
                                {addr.contact_phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3"/> {addr.contact_phone}</span>}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}
      </div>

      <Separator />

      {/* FORMULAIRE D'AJOUT */}
      <div className="bg-muted/10 border rounded-md p-4 space-y-4">
        <h4 className="font-medium text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Nouvelle Adresse
        </h4>

        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs">Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger className="h-8"><SelectValue/></SelectTrigger></FormControl>
                                <SelectContent>
                                    {ADDRESS_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="city_id"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs">Ville</FormLabel>
                            {/* Le Searchable Select doit être petit ici, on peut adapter le style si besoin */}
                            <FormControl>
                                <div className="h-8">
                                    <SearchableSelect 
                                        value={field.value} 
                                        onChange={field.onChange} 
                                        options={cityOptions} 
                                        placeholder="Ville..."
                                    />
                                </div>
                            </FormControl>
                        </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="address_line1"
                    render={({ field }) => (
                    <FormItem>
                        <FormControl><Input placeholder="Adresse (Avenue, N°...)" {...field} className="h-8" /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                {/* Champs contact optionnels (Collapse ou simple) */}
                <div className="grid grid-cols-2 gap-3">
                    <FormField
                        control={form.control}
                        name="contact_name"
                        render={({ field }) => (
                        <FormItem>
                            <FormControl><Input placeholder="Contact sur place (Nom)" {...field} className="h-8" /></FormControl>
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="contact_phone"
                        render={({ field }) => (
                        <FormItem>
                            <FormControl><Input placeholder="Tél Contact" {...field} className="h-8" /></FormControl>
                        </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="is_default"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <div className="text-xs leading-none text-muted-foreground">Définir comme adresse par défaut</div>
                        </FormItem>
                    )}
                />

                <Button type="submit" size="sm" className="w-full mt-2" disabled={loadingSubmit}>
                    {loadingSubmit && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                    Ajouter l'adresse
                </Button>
            </form>
        </Form>
      </div>
    </div>
  )
}