// lib/logger.ts
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

// Liste stricte des événements possibles pour standardiser le reporting
export type AuditEventType = 
  // AUTH
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'PASSWORD_RESET'
  | 'UPDATE_ROUTE'
  | 'CREATE_ROUTE'
  | 'DELETE_ROUTE'
  | 'CREATE_CUSTOMER'
  | 'UPDATE_CUSTOMER'
  | 'DELETE_CUSTOMER'
  // ORGANISATION
  | 'CREATE_REGION' | 'UPDATE_REGION'
  | 'CREATE_CITY' | 'UPDATE_CITY'
  | 'CREATE_AGENCY' | 'UPDATE_AGENCY'
  // OPÉRATIONS COLIS
  | 'CREATE_SHIPMENT' 
  | 'UPDATE_SHIPMENT_STATUS'
  | 'PRINT_LABEL'
  // SÉCURITÉ
  | 'VIEW_SENSITIVE_DATA' 
  | 'CHANGE_USER_ROLE'
  | 'SYSTEM_ERROR';

interface LogParams {
  userId?: string;
  userProfileId?: string; // Optionnel, si dispo dans le contexte
  eventType: AuditEventType;
  details: Record<string, any>;
  targetTable?: string;
  targetId?: string;
}

/**
 * Enregistre une action critique dans la base de données.
 * Ne jette jamais d'erreur pour ne pas bloquer le flux métier (fail-safe).
 */
export async function logAuditEvent({
  userId,
  userProfileId,
  eventType,
  details,
  targetTable,
  targetId
}: LogParams) {
  try {
    const supabase = await createClient();
    const headersList = await headers();
    
    // Récupération sécurisée de l'IP (derrière proxy/Vercel/Cloudflare)
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // Si userProfileId n'est pas fourni mais qu'on a userId, on suppose souvent que c'est le même ID
    // dans une architecture Supabase standard (profiles.id = auth.users.id)
    const finalProfileId = userProfileId || userId;

    const { error } = await supabase.from('audit_logs').insert({
      user_id: userId,
      user_profile_id: finalProfileId,
      event_type: eventType,
      target_table: targetTable,
      target_record_id: targetId,
      details: details,
      ip_address: ip,
      user_agent: userAgent,
      // event_timestamp est géré par défaut par la DB (now())
    });

    if (error) {
      console.error('[AUDIT_LOG_ERROR] DB Insert Failed:', error.message);
    }
  } catch (err) {
    // Filet de sécurité ultime : on log dans la console serveur si tout explose
    console.error('[AUDIT_LOG_CRITICAL] System Error:', err);
  }
}