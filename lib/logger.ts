

// --- Configuration Globale ---
// Si tu veux logger depuis un Server Component, il faudrait une autre fonction qui utilise le client Supabase serveur
// et appelle directement l'API Route ou la RPC. Pour le moment, ces fonctions sont pour le Client Component.

// Fonction pour logger des événements généraux (CREATE, UPDATE, DELETE, etc.)
export const logAuditEvent = async (
  event_type: string, // Ex: 'CREATE_SHIPMENT', 'UPDATE_PROFILE', 'DELETE_AGENCY'
  target_record_id: string | null, // L'ID de l'enregistrement affecté (colis, utilisateur, etc.)
  actor_profile_id: string | null, // L'ID du profil de celui qui effectue l'action (admin, agent)
  details: Record<string, any> = {} // Détails de l'action (ex: anciennes/nouvelles valeurs)
) => {
  try {
    // On ne peut pas logguer l'IP/UserAgent côté client directement pour le logger, 
    // car l'API Route le fera côté serveur. On peut passer l'ID utilisateur si disponible.
    const logData = {
      event_type,
      target_record_id,
      user_profile_id: actor_profile_id, // Qui a initié l'action
      user_id: details.created_by_userId || details.updated_by_userId || null, // ID Auth si disponible dans les détails
      details,
    };

    const response = await fetch('/api/audit/log', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // IMPORTANT: Transmettre l'ID utilisateur si possible depuis le contexte client
        // Pour le moment, l'API Route récupère l'utilisateur via le cookie de session.
      },
      body: JSON.stringify(logData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Échec du log d'audit pour l'événement:", event_type, errorData);
      // On ne toast pas ici pour ne pas surcharger l'UI avec des erreurs de logs secondaires.
    }
  } catch (error) {
    console.error("Erreur réseau lors du log d'audit:", error);
  }
};

// Fonction pour logger les événements d'authentification (LOGIN, LOGOUT, ACCESS_DENIED)
export const logAuthEvent = async (
  event_type: string, // Ex: 'LOGIN', 'LOGOUT', 'ACCESS_DENIED'
  userId: string | null, // ID Supabase Auth de l'utilisateur
  userProfileId: string | undefined | null, // ID du profil de l'utilisateur
  details: Record<string, any> = {} // Détails (ex: requested_path, ip)
) => {
  try {
    const logData = {
      event_type,
      target_record_id: null, // Pas de cible spécifique pour les événements auth
      user_profile_id: userProfileId,
      user_id: userId,
      details,
    };

    const response = await fetch('/api/audit/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Échec du log d'audit d'authentification:", event_type, errorData);
    }
  } catch (error) {
    console.error("Erreur réseau lors du log d'audit d'authentification:", error);
  }
};