// /actions/audit.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export type AuditEvent = {
  eventType: string;
  targetTable?: string;
  targetRecordId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
};

export async function logAuditEvent(event: AuditEvent) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Récupérer l'IP et User-Agent
  const headers = await cookies();
  const ipAddress = headers.get('x-forwarded-for') || 'unknown';
  const userAgent = headers.get('user-agent') || 'unknown';
  
  const { error } = await supabase
    .from('audit_logs')
    .insert({
      user_id: user?.id || null,
      event_type: event.eventType,
      target_table: event.targetTable,
      target_record_id: event.targetRecordId,
      details: event.details || {},
      ip_address: event.ipAddress || ipAddress,
      user_agent: event.userAgent || userAgent,
    });
  
  if (error) {
    console.error('Erreur audit log:', error);
  }
}