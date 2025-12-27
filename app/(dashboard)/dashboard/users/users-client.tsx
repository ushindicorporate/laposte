'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Edit, UserCog, ShieldCheck, Plus, UserX } from "lucide-react"
import { CustomDrawer } from "@/components/ui/custom-drawer"
import { RoleGate } from "../../../../components/auth/role-gate"
import { UserForm } from "../../../../components/users/user-form"

interface UsersClientProps {
  initialUsers: any[]
  agencies: any[]
}

export function UsersClient({ initialUsers, agencies }: UsersClientProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)

  const filtered = initialUsers.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreate = () => {
    setSelectedUser(null)
    setIsOpen(true)
  }

  const handleEdit = (user: any) => {
    setSelectedUser(user)
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
            placeholder="Rechercher un agent..." 
            className="pl-8 w-75" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <RoleGate allowedRoles={['SUPER_ADMIN']}>
            <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" /> Nouvel Utilisateur
            </Button>
        </RoleGate>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Agence Affectée</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <UserX className="h-8 w-8 mb-2 opacity-20" />
                            <p>Aucun utilisateur trouvé.</p>
                            <Button variant="link" onClick={handleCreate} className="mt-1">
                                Créer le premier agent
                            </Button>
                        </div>
                    </TableCell>
                </TableRow>
            ) : (
                // MAPPING DES USERS (Ton code existant)
                filtered.map((user) => {
                    const roleCode = user.user_roles?.[0]?.role?.code || 'N/A'
                    return (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                    {user.full_name?.substring(0,2).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                    <span>{user.full_name}</span>
                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="gap-1">
                                <ShieldCheck className="h-3 w-3" />
                                {roleCode}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {user.agency ? (
                                <span className="text-sm">{user.agency.name} <span className="text-muted-foreground text-xs">({user.agency.code})</span></span>
                                ) : (
                                <span className="text-muted-foreground italic text-sm">Non affecté</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <Badge variant={user.is_active ? "default" : "destructive"}>
                                {user.is_active ? "Actif" : "Bloqué"}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <RoleGate allowedRoles={['SUPER_ADMIN']}>
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                                    <UserCog className="h-4 w-4" />
                                </Button>
                                </RoleGate>
                            </TableCell>
                        </TableRow>
                    )
                })
            )}
          </TableBody>
        </Table>
      </div>

      <CustomDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={selectedUser ? "Modifier Agent" : "Créer un Utilisateur"}
        description={selectedUser ? "Modifier les droits." : "Ajouter un nouveau membre au personnel."}
      >
          <UserForm 
            key={selectedUser ? selectedUser.id : 'new'} // Important
            initialData={selectedUser}
            agencies={agencies}
            onSuccess={handleSuccess}
            onCancel={() => setIsOpen(false)}
          />
      </CustomDrawer>
    </div>
  )
}