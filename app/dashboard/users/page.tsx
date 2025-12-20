// C'est un Server Component par défaut
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server' // Utilise le client serveur
import { type User } from '@supabase/supabase-js' // Type pour l'utilisateur Auth

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

import { UserPlus } from 'lucide-react'
import { AgencyInfo, AgencyOption, UserProfile, UserRowData } from '@/lib/types/user'
import UserCreationForm from '@/components/users/UserCreationForm'
import UsersTable from '@/components/users/UsersTable'

// --- Fonctions utilitaires côté serveur ---

// Fonction pour récupérer les données utilisateur (profil, rôles, agence) via RPC
async function getUserDataFromServer(supabase: any): Promise<{ user: User; userProfile: UserProfile | null } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Appel à la RPC pour récupérer les données enrichies
  const { data: profileDataArray, error: rpcError } = await supabase.rpc('get_user_auth_data', { user_id_param: user.id });
  
  if (rpcError) {
    console.error("Erreur RPC get_user_auth_data:", rpcError);
    return { user, userProfile: null }; // Retourne l'utilisateur mais sans profil si RPC échoue
  }

  const profileData = profileDataArray?.[0]; // La RPC retourne un tableau

  if (!profileData) {
    // Si l'utilisateur existe mais n'a pas de profil ou de rôles (cas anormal)
    return { user, userProfile: null }; 
  }
  
  const roles = profileData.roles || [];
  const agency = profileData.agency_name ? {
    id: null, // L'ID de l'agence n'est pas retourné par la RPC, à ajouter si besoin
    name: profileData.agency_name,
    city: profileData.agency_city,
    region: profileData.agency_region
  } : null;

  return {
    user,
    userProfile: {
      id: profileData.profile_id,
      full_name: profileData.full_name,
      agency: agency,
      roles: roles
    }
  };
}

// La page principale est un Server Component
export default async function UsersPage() {
  const supabase = await createClient(); // Initialiser le client Supabase côté serveur

  // 1. Vérification d'authentification et des rôles CÔTÉ SERVEUR
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login'); // Redirige si pas connecté
  }

  const userData = await getUserDataFromServer(supabase); // Récupère profil et rôles
  
  // Redirige si l'utilisateur n'a pas le rôle SUPER_ADMIN
  if (!userData?.userProfile?.roles?.includes('SUPER_ADMIN')) {
    redirect('/dashboard');
  }

  // 2. Charger les données nécessaires POUR LE FORMULAIRE ET LA LISTE INITIALE (côté serveur)
  const [
    { data: agencies },
    { data: roles },
    { data: users }
  ] = await Promise.all([
    supabase.from('agencies').select('id, name, cities(name)').order('name'),
    supabase.from('roles').select('id, name').order('name'),
    supabase.from('profiles').select(`
      id, full_name, email, agency_id,
      agencies(name, cities(name)),
      user_roles(role_id, roles(name))
    `).order('created_at', { ascending: false })
  ]);

  // Gérer les erreurs de chargement de données
  if (!agencies || !roles || !users) {
    console.error("Erreur chargement données utilisateurs:", { agencies, roles, users });
    return <div className="p-8 text-red-500">Erreur lors du chargement des données utilisateurs.</div>;
  }

  // 3. Rendu de la page : Le Server Component passe les données aux Client Components
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground">Ajoutez et gérez les comptes des agents et managers.</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-blue-700 text-white gap-2">
              <UserPlus size={18} /> Nouvel Utilisateur
            </Button>
          </DialogTrigger>
          {/* Le DialogContent reçoit le Client Component du formulaire */}
          <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
            <UserCreationForm 
              agencies={(agencies as unknown as AgencyOption[]) || []} 
              roles={roles || []} 
              onCreateSuccess={() => { 
                // Pour rafraîchir la liste après création, il faudrait soit :
                // 1. Utiliser un state lifting et passer une fonction de refresh au parent.
                // 2. Utiliser un contexte global pour le refresh.
                // 3. Utiliser une librairie de cache comme SWR ou React Query.
                // Pour ce démo, on va simuler un refresh en rechargeant la page après un délai.
                toast.success("Utilisateur créé. Rafraîchissement dans 2 secondes...");
                setTimeout(() => window.location.reload(), 2000); 
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Le tableau des utilisateurs est un Client Component qui reçoit les données */}
      <UsersTable 
        initialUsers={(users as unknown as UserRowData[]) || []} 
        agencies={(agencies as unknown as AgencyOption[]) || []} 
        roles={roles || []} 
      />
    </div>
  );
}