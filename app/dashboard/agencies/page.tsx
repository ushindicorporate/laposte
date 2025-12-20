'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, MapPin, Building2, Search } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function AgenciesPage() {
  const [agencies, setAgencies] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const supabase = createClient()

  // État du formulaire
  const [newAgency, setNewAgency] = useState({
    name: '',
    code: '',
    city_id: '',
    address: '',
    phone: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    // 1. Récupérer les agences
    const { data: agenciesData } = await supabase
      .from('agencies')
      .select('*, cities(name, regions(name))')
      .order('name')
    
    // 2. Récupérer les villes pour le formulaire
    const { data: citiesData } = await supabase
      .from('cities')
      .select('id, name')
      .order('name')

    if (agenciesData) setAgencies(agenciesData)
    if (citiesData) setCities(citiesData)
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const { error } = await supabase
      .from('agencies')
      .insert({
        name: newAgency.name,
        code: newAgency.code.toUpperCase(),
        city_id: newAgency.city_id,
        address: newAgency.address,
        phone: newAgency.phone
      })

    if (error) {
      toast.error("Erreur : " + error.message)
    } else {
      toast.success("Agence créée avec succès !")
      setIsDialogOpen(false)
      setNewAgency({ name: '', code: '', city_id: '', address: '', phone: '' }) // Reset
      fetchData() // Rafraîchir la liste
    }
    setSubmitting(false)
  }

  // Filtrage
  const filteredAgencies = agencies.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.cities?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Réseau des Agences</h1>
          <p className="text-muted-foreground">Gérez les points de présence SCPT.</p>
        </div>
        
        {/* MODALE D'AJOUT */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-blue-700 text-white gap-2">
              <Plus size={18} /> Nouvelle Agence
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Ajouter une Agence</DialogTitle>
                <DialogDescription>
                  Créez un nouveau point de service postal dans le réseau.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Ville</Label>
                  <Select onValueChange={(val) => setNewAgency({...newAgency, city_id: val})} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner la ville..." />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Code Agence</Label>
                    <Input 
                      placeholder="Ex: GOM-01" 
                      className="uppercase" 
                      value={newAgency.code}
                      onChange={(e) => setNewAgency({...newAgency, code: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Nom</Label>
                    <Input 
                      placeholder="Poste Centrale" 
                      value={newAgency.name}
                      onChange={(e) => setNewAgency({...newAgency, name: e.target.value})}
                      required 
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Adresse physique</Label>
                  <Input 
                    placeholder="Avenue..." 
                    value={newAgency.address}
                    onChange={(e) => setNewAgency({...newAgency, address: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Téléphone (Responsable)</Label>
                  <Input 
                    placeholder="+243..." 
                    value={newAgency.phone}
                    onChange={(e) => setNewAgency({...newAgency, phone: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Création...' : 'Sauvegarder'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une agence..."
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
                <TableHead>Code</TableHead>
                <TableHead>Nom de l'agence</TableHead>
                <TableHead>Ville / Province</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Chargement...</TableCell>
                </TableRow>
              ) : filteredAgencies.map((agency) => (
                <TableRow key={agency.id}>
                  <TableCell className="font-mono font-bold">{agency.code}</TableCell>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    {agency.name}
                  </TableCell>
                  <TableCell>
                    {agency.cities?.name} 
                    <span className="text-xs text-muted-foreground ml-1">({agency.cities?.regions?.name})</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm truncate max-w-[200px]">
                    <div className="flex items-center gap-1">
                       <MapPin className="h-3 w-3" /> {agency.address || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      agency.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {agency.is_active ? 'Active' : 'Fermée'}
                    </span>
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