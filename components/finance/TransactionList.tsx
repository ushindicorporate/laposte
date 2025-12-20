'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, DollarSign, CreditCard } from 'lucide-react'

// On reçoit les données initiales depuis le Serveur (Props)
interface TransactionListProps {
  initialTransactions: any[]
}

export default function TransactionList({ initialTransactions }: TransactionListProps) {
  const [filter, setFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('ALL')

  // Filtrage côté client (pour l'instant, performant pour < 1000 lignes)
  const filtered = initialTransactions.filter(t => {
    const matchesSearch = t.description?.toLowerCase().includes(filter.toLowerCase()) || 
                          t.amount.toString().includes(filter)
    const matchesMethod = methodFilter === 'ALL' || t.method === methodFilter
    return matchesSearch && matchesMethod
  })

  // Calcul des totaux à la volée
  const totalAmount = filtered.reduce((acc, curr) => acc + Number(curr.amount), 0)

  return (
    <div className="space-y-6">
      {/* Cartes de Synthèse (Dynamiques selon filtres) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Affichés</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAmount.toLocaleString('fr-CD')} FC</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une transaction..."
            className="pl-9"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Moyen de paiement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tout voir</SelectItem>
            <SelectItem value="CASH">Espèces</SelectItem>
            <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
            <SelectItem value="CHECK">Chèque</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tableau */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Agence</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucune transaction.</TableCell>
                </TableRow>
              ) : filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">
                    {format(new Date(t.created_at), 'dd MMM yyyy', { locale: fr })}
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(t.created_at), 'HH:mm', { locale: fr })}
                    </div>
                  </TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell>{t.agencies?.name || 'Siège'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex w-fit items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      {t.method}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold font-mono">
                    {t.amount.toLocaleString('fr-CD')} {t.currency}
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