// C'est un Server Component par défaut
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server' // Client Supabase serveur
import { redirect } from 'next/navigation' // Pour la redirection

// Composants UI pour la page d'accueil
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

// --- Fonction utilitaire côté serveur pour obtenir les données utilisateur ---
async function getUserDataFromServer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profileDataArray } = await supabase.rpc('get_user_auth_data', { user_id_param: user.id });
  const profileData = profileDataArray?.[0];

  if (!profileData) return { user, userProfile: null };

  const roles = profileData.roles || [];
  const agency = profileData.agency_name ? {
    id: null, name: profileData.agency_name, city: profileData.agency_city, region: profileData.agency_region
  } : null;

  return {
    user: { id: user.id },
    userProfile: {
      id: profileData.profile_id,
      full_name: profileData.full_name,
      agency: agency,
      roles: roles
    }
  };
}

// La page d'accueil est un Server Component
export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userData = user ? await getUserDataFromServer() : null;

  // Si l'utilisateur est connecté et a un profil valide, rediriger vers le dashboard
  if (user && userData?.userProfile) {
    redirect('/dashboard');
  }

  // Si l'utilisateur n'est pas connecté, afficher la page d'accueil standard
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      
      <Card className="w-full max-w-md text-center shadow-lg border-t-4 border-t-primary">
        <CardHeader className="flex flex-col items-center space-y-2 pb-6 pt-8">
          <div className="relative w-24 h-24 mb-4">
            <Image src="/logo.png" alt="Logo La Poste RDC" fill className="object-contain" priority />
          </div>
          <h1 className="text-3xl font-bold text-primary">Bienvenue à la Poste RDC</h1>
          <CardDescription>
            Votre portail pour une gestion postale efficace.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <p className="text-muted-foreground mb-4">
            Accédez au système de gestion pour suivre les courriers, gérer les agences et optimiser les opérations.
          </p>
          <Link href="/login">
            <Button className="w-full bg-primary hover:bg-blue-700 text-white font-bold h-10 text-md transition-all">
              Se connecter
            </Button>
          </Link>
        </CardContent>
      </Card>
      
      {/* Footer légal */}
      <div className="absolute bottom-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} La Poste RDC. Système sécurisé.
      </div>
    </div>
  )
}