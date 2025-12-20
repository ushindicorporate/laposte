import {
  type CookieOptions,
  createServerClient,
} from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

// Ajout d'une fonction pour récupérer les rôles et l'agence de l'utilisateur
async function getUserProfileAndRoles(supabase: any, userId: string) {
  if (!userId) return null;

  const { data, error } = await supabase.rpc('get_user_auth_data', { user_id_param: userId });

  if (error || !data) {
    console.error("Erreur lors de l'appel RPC get_user_auth_data:", error);
    return null;
  }
  
  // La donnée retournée par la RPC est un tableau, même pour un seul résultat
  const profileData = data[0]; // On prend le premier élément

  if (!profileData) return null;

  // La RPC retourne déjà les rôles en JSONB, donc on n'a pas besoin de mapper
  // Il faut juste s'assurer que les clés correspondent à ce que le layout attend
  return {
    id: profileData.profile_id,
    full_name: profileData.full_name,
    agency: profileData.agency_name ? {
      id: null, // On n'a pas retourné l'ID de l'agence dans la RPC, si besoin, il faut l'ajouter
      name: profileData.agency_name,
      city: profileData.agency_city,
      region: profileData.agency_region
    } : null,
    roles: profileData.roles || [] // Les rôles sont déjà un array JSONB
  };
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  let userProfile = null;
  if (user) {
    userProfile = await getUserProfileAndRoles(supabase, user.id);
  }

  // --- LOGIQUE DE REDIRECTION ET DE PROTECTION ---

  // 1. Routes publiques (login, etc.)
  if (pathname === '/login') {
    if (user) { // Si déjà authentifié, rediriger vers le dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Sinon, laisser accéder à la page de login
    return response; 
  }

  // 2. Routes protégées (/dashboard/*)
  if (pathname.startsWith('/dashboard')) {
    // Si pas d'utilisateur OU si l'utilisateur n'a pas de profil OU pas de rôles
    if (!user || !userProfile || !userProfile.roles || userProfile.roles.length === 0) {
      // Rediriger vers la page de login
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  if (pathname === '/' && user && userProfile && userProfile.roles && userProfile.roles.length > 0) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // --- STOCKAGE DES INFOS UTILISATEUR DANS LES HEADERS ---
  if (userProfile && user) {
    response.headers.set('X-User-Id', user.id);
    response.headers.set('X-User-Profile', JSON.stringify(userProfile));
  } else if (user) {
     response.headers.set('X-User-Id', user.id); // Au moins l'ID
  }

  return response;
}

// Ton matcher reste le même
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}