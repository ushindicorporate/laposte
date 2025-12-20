'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Search, Building2, Mail, Lock, UserCog, MailCheck 
} from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserRowData, AgencyOption, RoleOption } from '@/lib/types/user'


// Props reçues du Server Component
interface UsersTableProps {
  initialUsers: UserRowData[]; // Utilise le type UserRowData
  agencies: AgencyOption[];
  roles: RoleOption[];
}

export default function UsersTable({ initialUsers, agencies, roles }: UsersTableProps) {
  const [users, setUsers] = useState<UserRowData[]>(initialUsers) // Typage du state
  const [loading, setLoading] = useState(false) 
  const [searchTerm, setSearchTerm] = useState('')

  // Filtrage
  const filteredUsers = users.filter(u => 
    (u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  return (
    <Card>
        <CardHeader className="pb-3">
            <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Rechercher par nom ou email..."
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
                <TableHead>Nom & Email</TableHead>
                <TableHead>Agence</TableHead>
                <TableHead>Rôles</TableHead>
                <TableHead>Statut</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">Chargement...</TableCell>
                </TableRow>
                ) : filteredUsers.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Aucun utilisateur trouvé.</TableCell>
                </TableRow>
                ) : filteredUsers.map((user) => (
                <TableRow key={user.id}>
                    <TableCell>
                    <div className="font-medium">{user.full_name || user.email}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                    {user.agencies?.city?.name} - {user.agencies?.name || 'Non assigné'}
                    </TableCell>
                    <TableCell>
                    {user.user_roles && user.user_roles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                        {user.user_roles.map((ur: any) => (
                            // Assure-toi que ur.roles est bien typé
                            <Badge key={ur.role_id} variant="outline">
                            {ur.roles?.name}
                            </Badge>
                        ))}
                        </div>
                    ) : (
                        <Badge variant="secondary">Aucun rôle</Badge>
                    )}
                    </TableCell>
                    <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'destructive'}>
                        {user.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </CardContent>
    </Card>
  );
}