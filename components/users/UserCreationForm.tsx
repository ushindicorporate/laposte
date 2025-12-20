'use client'

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { 
  Building2, Mail, UserCog, MailCheck 
} from 'lucide-react';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'; // Import Dialog components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AgencyOption, RoleOption } from '@/lib/types/user';

// Props reçues du Server Component
interface UserCreationFormProps {
  agencies: AgencyOption[];
  roles: RoleOption[];
  onCreateSuccess: () => void; // Callback pour rafraîchir la liste après création
}

export default function UserCreationForm({ agencies, roles, onCreateSuccess }: UserCreationFormProps) {
  // --- State pour l'ouverture/fermeture du Dialog ---
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Contrôle l'état du modal

  const [newUser, setNewUser] = useState({
    email: '', password: '', password_confirmation: '', full_name: '', agency_id: '', role_id: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validations
    if (newUser.password !== newUser.password_confirmation) {
      toast.error("Les mots de passe ne ne correspondent pas.");
      return;
    }
    if (!newUser.agency_id || !newUser.role_id) {
        toast.error("Veuillez sélectionner une agence et un rôle.");
        return;
    }
    if (!newUser.email.includes('@') || !newUser.email.includes('.')) {
        toast.error("Veuillez entrer une adresse email valide.");
        return;
    }

    setSubmitting(true);

    // --- IMPORTANT: SIMULATION DE CRÉATION ---
    // La création de l'utilisateur Auth doit se faire via API Route serveur.
    // Ici, on simule la création du profil et du rôle.
    const dummyUserId = crypto.randomUUID(); 

    try {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: dummyUserId, // Ce serait l'ID de l'utilisateur Auth créé
        full_name: newUser.full_name,
        agency_id: newUser.agency_id,
        phone: '',
      });
      if (profileError) throw new Error("Erreur création profil: " + profileError.message);

      const { error: userRoleError } = await supabase.from('user_roles').insert({
        user_id: dummyUserId,
        role_id: parseInt(newUser.role_id)
      });
      if (userRoleError) throw new Error("Erreur assignation rôle: " + userRoleError.message);

      // await logAuditEvent(
      //   'CREATE_USER_PROFILE', // Le type d'événement
      //   null, // Pas de target_record_id spécifique pour la création de profil
      //   dummyUserId, // L'ID du nouveau profil créé
      //   { 
      //     created_by_userId: userIdFromMiddleware, // Il faut récupérer cet ID !
      //     email: newUser.email,
      //     full_name: newUser.full_name,
      //     agency_id: newUser.agency_id,
      //     role_id: parseInt(newUser.role_id),
      //   }
      // );
      toast.success(`Profil créé pour ${newUser.full_name} ! (Utilisateur Auth doit être créé manuellement)`);
      onCreateSuccess(); // Appeler le callback pour rafraîchir la liste
      setIsDialogOpen(false); // Ferme le modal après succès

    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // Le DialogHeader, DialogDescription, DialogFooter sont ici
    <form onSubmit={handleCreateUser}>
      <DialogHeader>
        <DialogTitle>Ajouter un Nouvel Utilisateur</DialogTitle>
        <DialogDescription>
          Créez le profil et assignez le rôle. (L'utilisateur Auth doit être créé via le dashboard Supabase).
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Nom Complet</Label>
            <Input placeholder="Nom Prénom" value={newUser.full_name} onChange={(e) => setNewUser({...newUser, full_name: e.target.value})} required />
          </div>
          <div className="grid gap-2">
            <Label>Email Professionnel</Label>
            <Input type="email" placeholder="utilisateur@laposte.cd" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Mot de Passe</Label>
            <Input type="password" placeholder="••••••••" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} required />
          </div>
          <div className="grid gap-2">
            <Label>Confirmer Mot de Passe</Label>
            <Input type="password" placeholder="••••••••" value={newUser.password_confirmation} onChange={(e) => setNewUser({...newUser, password_confirmation: e.target.value})} required />
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Agence d'Affectation</Label>
          <Select onValueChange={(val) => setNewUser({...newUser, agency_id: val})} required>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner l'agence..." />
            </SelectTrigger>
            <SelectContent>
              {agencies.map((agency) => (
                <SelectItem key={agency.id} value={agency.id}>
                  {agency.city?.name} - {agency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Rôle</Label>
          <Select onValueChange={(val) => setNewUser({...newUser, role_id: val})} required>
            <SelectTrigger>
              <SelectValue placeholder="Choisir un rôle..." />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={String(role.id)}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Création...' : 'Ajouter l\'utilisateur'}
        </Button>
      </DialogFooter>
    </form>
  );
}