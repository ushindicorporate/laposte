import { type NextRequest, NextResponse } from 'next/server'

// Cette API Route est juste un proxy pour que le composant client (layout)
// puisse lire les headers que le middleware Supabase a ajoutés à la requête.
export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id')
  const userProfileJson = request.headers.get('X-User-Profile')

  if (!userId) {
    // Si pas d'ID utilisateur, c'est que la session est invalide ou inexistante.
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let userProfile = null;
  if (userProfileJson) {
    try {
      userProfile = JSON.parse(userProfileJson);
    } catch (e) {
      console.error("Erreur parsing X-User-Profile header:", e);
      // On continue sans le profil si le JSON est invalide, mais on log l'erreur.
    }
  }

  return NextResponse.json({ user: { id: userId }, userProfile })
}