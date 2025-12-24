// app/api/user/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  // 1. On initialise le client Supabase Server (qui lit les cookies automatiquement)
  const supabase = await createClient();

  // 2. On récupère l'utilisateur authentifié
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ user: null, userProfile: null }, { status: 401 });
  }

  // 3. On récupère le profil complet avec les jointures (Rôles, Agence, Ville)
  // Note: On utilise les relations Foreign Keys définies dans la DB
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      *,
      agency:agencies (
        id,
        name,
        code,
        city:cities (name)
      ),
      user_roles (
        role:roles (code)
      )
    `)
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
    // On renvoie quand même le user auth, mais sans profil
    return NextResponse.json({ user, userProfile: null });
  }

  // 4. Transformation des données pour le frontend
  // La DB renvoie : user_roles: [{ role: { code: 'ADMIN' } }]
  // Le Front veut : roles: ['ADMIN']
  const formattedRoles = profile.user_roles
    // @ts-ignore (Supabase types complexité)
    ?.map((ur: any) => ur.role?.code)
    .filter(Boolean) || [];

  // On construit l'objet userProfile propre
  const userProfile = {
    ...profile,
    roles: formattedRoles,
    // On nettoie l'objet user_roles brut qui ne sert plus
    user_roles: undefined 
  };

  return NextResponse.json({
    user,
    userProfile
  });
}