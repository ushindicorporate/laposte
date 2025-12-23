// components/admin/UsersManagement.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2, Search, MoreVertical, User, 
  Mail, Building, Calendar, Key, UserX, UserCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  getUsersForManagement, 
  toggleUserStatus, 
  resetUserPassword 
} from '@/actions/admin';

export function UsersManagement() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await getUsersForManagement();
      if (result.success && result.data) {
        setUsers(result.data);
      }
    } catch (err: any) {
      setError('Erreur chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const result = await toggleUserStatus(userId, !currentStatus);
      if (result.success) {
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, is_active: !currentStatus }
            : user
        ));
      }
    } catch (err: any) {
      setError('Erreur changement de statut');
    }
  };

  const handleResetPassword = async (userId: string, email: string) => {
    if (!confirm(`Réinitialiser le mot de passe pour ${email} ?`)) {
      return;
    }

    try {
      const result = await resetUserPassword(userId);
      if (result.success) {
        alert('Mot de passe réinitialisé avec succès');
      }
    } catch (err: any) {
      setError('Erreur réinitialisation mot de passe');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.agency_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Chargement des utilisateurs...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Recherche et statistiques */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par email, nom, agence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{users.length} utilisateurs</span>
          </div>
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-green-500" />
            <span>{users.filter(u => u.is_active).length} actifs</span>
          </div>
        </div>
      </div>

      {/* Table des utilisateurs */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Agence</TableHead>
                <TableHead>Rôles</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead>Création</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {user.full_name || 'Non renseigné'}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-m