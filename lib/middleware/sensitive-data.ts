// middleware/sensitive-data.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Routes protégées nécessitant des permissions spéciales
const SENSITIVE_ROUTES = [
  '/dashboard/crm',
  '/dashboard/crm/[id]',
  '/api/customers/export',
  '/api/customers/[id]'
];

// Rôles avec accès complet
const FULL_ACCESS_ROLES = ['superadmin', 'admin', 'regional_manager'];

export async function sensitiveDataMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Vérifier si la route nécessite une protection
  const isSensitiveRoute = SENSITIVE_ROUTES.some(route => {
    if (route.includes('[id]')) {
      const pattern = route.replace('[id]', '[^/]+');
      return new RegExp(`^${pattern}$`).test(pathname);
    }
    return pathname.startsWith(route);
  });
  
  if (!isSensitiveRoute) {
    return NextResponse.next();
  }
  
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Vérifier les rôles de l'utilisateur
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id);
    
    if (rolesError) {
      console.error('Erreur vérification rôles:', rolesError);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    const userRoleNames = userRoles?.map(ur => ur.roles?.name).filter(Boolean) || [];
    
    // Vérifier si l'utilisateur a un rôle avec accès complet
    const hasFullAccess = userRoleNames.some(role => 
      FULL_ACCESS_ROLES.includes(role as string)
    );
    
    if (!hasFullAccess) {
      // Pour les exports et APIs, restreindre l'accès
      if (pathname.includes('/api/') || pathname.includes('/export')) {
        return NextResponse.json(
          { error: 'Accès non autorisé aux données sensibles' },
          { status: 403 }
        );
      }
      
      // Ajouter un header pour indiquer l'accès restreint
      const response = NextResponse.next();
      response.headers.set('X-Data-Access', 'restricted');
      return response;
    }
    
    // Accès complet
    const response = NextResponse.next();
    response.headers.set('X-Data-Access', 'full');
    return response;
    
  } catch (error) {
    console.error('Erreur middleware données sensibles:', error);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
}