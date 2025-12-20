'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, User, Building2, Phone, Mail } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export default function CRMPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const supabase = createClient()

  // État du formulaire
  const [newCustomer, setNewCustomer] = useState({
    type: 'PARTICULIER',
    name: '',
    phone: '',
    email: '',
    address: '',
    tax_id: ''
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  async function fetchCustomers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setCustomers(data)
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    // Récupérer l'utilisateur courant pour le champ 'created_by'
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('customers')
      .insert({
        ...newCustomer,
        created_by: user?.id
      })

    if (error) {
      toast.error("Erreur : " + error.message)
    } else {
      toast.success("Client ajouté avec succès !")
      setIsDialogOpen(false)
      setNewCustomer({ type: 'PARTICULIER', name: '', phone: '', email: '', address: '', tax_id: '' }) // Reset
      fetchCustomers() // Rafraîchir
    }
    setSubmitting(false)
  }

  // Filtrage
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  )

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Clients & CRM</h1>
          <p className="text-muted-foreground">Base de données des expéditeurs et partenaires.</p>
        </div>
        
        {/* MODALE D'AJOUT */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-blue-700 text-white gap-2">
              <Plus size={18} /> Nouveau Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Ajouter un Client</DialogTitle>
                <DialogDescription>
                  Enregistrez un nouveau client pour faciliter les envois futurs.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                
                {/* Type de client */}
                <div className="grid gap-2">
                  <Label>Type de Client</Label>
                  <Select 
                    value={newCustomer.type} 
                    onValueChange={(val) => setNewCustomer({...newCustomer, type: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PARTICULIER">Particulier (Individu)</SelectItem>
                      <SelectItem value="ENTREPRISE">Entreprise / Organisation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Nom */}
                <div className="grid gap-2">
                  <Label>{newCustomer.type === 'ENTREPRISE' ? 'Raison Sociale' : 'Nom Complet'}</Label>
                  <Input 
                    placeholder={newCustomer.type === 'ENTREPRISE' ? 'Ex: SCPT Direction Générale' : 'Ex: Jean Mutombo'} 
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    required 
                  />
                </div>

                {/* Contact */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Téléphone</Label>
                    <Input 
                      placeholder="+243..." 
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Email (Optionnel)</Label>
                    <Input 
                      type="email"
                      placeholder="client@email.com" 
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                    />
                  </div>
                </div>

                {/* Adresse */}
                <div className="grid gap-2">
                  <Label>Adresse physique</Label>
                  <Input 
                    placeholder="Numéro, Avenue, Quartier..." 
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                  />
                </div>

                {/* Champs Spécifiques Entreprise */}
                {newCustomer.type === 'ENTREPRISE' && (
                  <div className="grid gap-2">
                    <Label>ID Nat / RCCM (Fiscal)</Label>
                    <Input 
                      placeholder="Numéro d'identification fiscale" 
                      value={newCustomer.tax_id}
                      onChange={(e) => setNewCustomer({...newCustomer, tax_id: e.target.value})}
                    />
                  </div>
                )}

              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Enregistrement...' : 'Sauvegarder le client'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Liste des clients */}
      <Card>
        <CardHeader className="pb-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou téléphone..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">Chargement...</TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Aucun client trouvé.</TableCell>
                </TableRow>
              ) : filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="font-medium flex items-center gap-2">
                      {customer.type === 'ENTREPRISE' ? <Building2 className="h-4 w-4 text-blue-500" /> : <User className="h-4 w-4 text-slate-500" />}
                      {customer.name}
                    </div>
                    {customer.tax_id && <div className="text-xs text-muted-foreground ml-6">ID: {customer.tax_id}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {customer.phone}</span>
                      {customer.email && <span className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" /> {customer.email}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm truncate max-w-[200px]">
                    {customer.address || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={customer.type === 'ENTREPRISE' ? 'default' : 'secondary'}>
                      {customer.type}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}