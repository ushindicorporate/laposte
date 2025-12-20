// src/app/api/audit/log/route.ts
import { createClient } from '@/lib/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';

// Fonction utilitaire pour obtenir l'IP du client (prend en compte les proxys comme Vercel)
function getClientIp(requestHeaders: Headers): string {
  const forwardedFor = requestHeaders.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]; // Prend la première IP si plusieurs proxies
  }
  return requestHeaders.get('x-real-ip') || 'unknown';
}

export async function POST(request: NextRequest) {
  const supabase = await createClient(); // Client Supabase serveur
  
  // Récupérer l'utilisateur connecté via le middleware (qui a mis les headers)
  const userId = request.headers.get('X-User-Id');
  const userProfileJson = request.headers.get('X-User-Profile');
  const userProfileId = userProfileJson ? JSON.parse(userProfileJson)?.id : null;

  // Récupérer les données envoyées dans le body de la requête POST
  const body = await request.json();
  const { event_type, target_table, target_record_id, details } = body;

  // Récupérer l'IP et le User-Agent depuis les headers de la requête entrante
  const ip_address = getClientIp(request.headers);
  const user_agent = request.headers.get('user-agent') || 'unknown';

  // Validation des champs requis pour le log
  if (!event_type) {
    return NextResponse.json({ error: 'event_type est requis' }, { status: 400 });
  }

  // Préparer les arguments pour la RPC
  const rpcArgs = {
    p_event_type: event_type,
    p_target_table: target_table || null, // Doit être NULL si non applicable
    p_target_record_id: target_record_id || null,
    p_details: details || {}, // Assure que c'est un objet JSONB
    p_user_id: userId || null,
    p_user_profile_id: userProfileId || null,
    p_ip_address: ip_address,
    p_user_agent: user_agent
  };

  // Appel de la fonction RPC
  const { error } = await supabase.rpc('log_audit_event', rpcArgs);

  if (error) {
    console.error("Erreur lors de l'appel RPC log_audit_event:", error);
    return NextResponse.json({ error: 'Erreur lors de l\'écriture du log' }, { status: 500 });
  }

  // Succès
  return NextResponse.json({ success: true }, { status: 201 });
}