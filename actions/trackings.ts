// actions/tracking.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { CreateTrackingEventInput } from '@/lib/types/tracking';

const supabase = await createClient();

export async function createTrackingEvent(
  input: CreateTrackingEventInput,
  userId: string
) {
  try {
    const { data, error } = await supabase
      .from('tracking_events')
      .insert([{
        shipment_id: input.shipment_id,
        status: input.status,
        location_agency_id: input.location_agency_id || null,
        description: input.description || null,
        scanned_by: userId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erreur création événement tracking:', error);
    return { success: false, error };
  }
}

export async function getShipmentTrackingEvents(shipmentId: string) {
  try {
    const { data, error } = await supabase
      .from('tracking_events')
      .select(`
        *,
        location_agency:agencies(id, name, code),
        scanned_by:users(id, email, profiles(full_name))
      `)
      .eq('shipment_id', shipmentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erreur récupération événements:', error);
    return { success: false, error, data: [] };
  }
}