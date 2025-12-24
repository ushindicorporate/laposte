'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, User, Building2, MapPin } from "lucide-react"
import { CustomDrawer } from "@/components/ui/custom-drawer"
import { RoleGate } from "../../_components/auth/role-gate"
import { CustomerForm } from "../../_components/customers/customer-form"
import { AddressesManager } from "../../_components/customers/addresses-manager"

interface CustomersClientProps {
  initialCustomers: any[]
}

export function CustomersClient({ initialCustomers }: CustomersClientProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [managingAddresses, setManagingAddresses] = useState<any | null>(null)
  
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)

  const openAddresses = (customer: any) => {
    setManagingAddresses(customer)
  }

  const closeAddresses = () => {
    setManagingAddresses(null)
  }

  const filtered = initialCustomers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.account_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreate = () => {
    setSelectedCustomer(null)
    setIsOpen(true)
  }

  const handleEdit = (customer: any) => {
    setSelectedCustomer(customer)
    setIsOpen(true)
  }

  const handleSuccess = () => {
    setIsOpen(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher (Nom, Tél, Compte)..." 
            className="pl-8 w-87.5" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <RoleGate allowedRoles={['SUPER_ADMIN', 'AGENCY_MANAGER', 'AGENT']}>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> Nouveau Client
          </Button>
        </RoleGate>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Compte</TableHead>
              <TableHead>Nom / Raison Sociale</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-mono text-xs">{customer.account_number || "-"}</TableCell>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>
                  {customer.type === 'INDIVIDUAL' ? (
                    <Badge variant="secondary" className="gap-1"><User className="h-3 w-3"/> Particulier</Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1"><Building2 className="h-3 w-3"/> Entreprise</Badge>
                  )}
                </TableCell>
                <TableCell>
                    <div className="flex flex-col text-sm">
                        <span>{customer.phone}</span>
                        <span className="text-muted-foreground text-xs">{customer.email}</span>
                    </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                      {/* Bouton Adresses */}
                      <Button variant="ghost" size="icon" onClick={() => openAddresses(customer)} title="Gérer adresses">
                        <MapPin className="h-4 w-4 text-blue-600" />
                      </Button>
                      
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(customer)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CustomDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={selectedCustomer ? "Fiche Client" : "Nouveau Client"}
        description="Gestion CRM (Coordonnées et facturation)."
      >
        <CustomerForm 
          key={selectedCustomer ? selectedCustomer.id : 'new'}
          initialData={selectedCustomer}
          onSuccess={handleSuccess}
          onCancel={() => setIsOpen(false)}
        />
      </CustomDrawer>
      <CustomDrawer
        isOpen={!!managingAddresses}
        onClose={closeAddresses}
        title="Carnet d'Adresses"
        description="Gestion des lieux de livraison et facturation."
    >
        {managingAddresses && <AddressesManager customer={managingAddresses} />}
    </CustomDrawer>
    </div>
  )
}