import {
  type CookieOptions,
  createServerClient,
} from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Astuce Supabase : Il faut setter les cookies sur la requête ET la réponse
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 2. Vérification de l'utilisateur
  // IMPORTANT: getUser() valide le token JWT côté serveur. C'est sûr.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // 3. LOGIQUE DE PROTECTION DES ROUTES

  // A. Si l'utilisateur n'est PAS connecté
  if (!user) {
    // Il essaie d'accéder au dashboard -> Redirection Login
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      url.pathname = '/login'
      // On garde l'URL d'origine pour rediriger après login (UX Pro)
      url.searchParams.set('next', request.nextUrl.pathname) 
      return NextResponse.redirect(url)
    }
  }

  // B. Si l'utilisateur EST connecté
  if (user) {
    // Il essaie d'aller sur Login ou Home -> Redirection Dashboard
    if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/') {
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // C. Injection de l'ID User (léger) pour les logs serveur éventuels
  if (user) {
    response.headers.set('x-user-id', user.id)
  }

  return response
}

// Ton matcher reste le même
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}