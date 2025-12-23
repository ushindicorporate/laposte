// actions/delivery.ts
'use server';

import { Supabase as supabase } from '@/lib/supabase/server';
import { CreateDeliveryAttemptInput } from '@/lib/types/delivery';

/**
 * Créer une tentative de livraison (Point 101)
 */
export async function createDeliveryAttempt(
  input: CreateDeliveryAttemptInput,
  userId: string
) {
  try {
    // Vérifier si c'est la première tentative
    const { data: existingAttempts, error: countError } = await supabase
      .from('delivery_attempts')
      .select('attempt_number')
      .eq('shipment_id', input.shipment_id)
      .order('attempt_number', { ascending: false })
      .limit(1);
    
    if (countError) throw countError;
    
    const attemptNumber = existingAttempts && existingAttempts.length > 0 
      ? existingAttempts[0].attempt_number + 1 
      : 1;
    
    // Créer la tentative
    const { data, error } = await supabase
      .from('delivery_attempts')
      .insert([{
        shipment_id: input.shipment_id,
        attempt_number: attemptNumber,
        attempted_by: userId,
        status: input.status,
        failure_reason: input.failure_reason || null,
        recipient_name: input.recipient_name || null,
        recipient_relationship: input.recipient_relationship || null,
        recipient_id_type: input.recipient_id_type || null,
        recipient_id_number: input.recipient_id_number || null,
        proof_urls: input.proof_urls || [],
        notes: input.notes || null,
        latitude: input.latitude || null,
        longitude: input.longitude || null,
        attempted_at: new Date().toISOString()
      }])
      .select(`
        *,
        attempted_by:users(id, email, profiles(full_name))
      `)
      .single();
    
    if (error) throw error;
    
    // Mettre à jour le statut de l'envoi
    let shipmentStatus = 'OUT_FOR_DELIVERY';
    if (input.status === 'SUCCESS') {
      shipmentStatus = 'DELIVERED';
    } else if (input.status === 'FAILED') {
      shipmentStatus = 'FAILED_DELIVERY';
    }
    
    await supabase
      .from('shipments')
      .update({ 
        status: shipmentStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', input.shipment_id);
    
    // Créer un événement de tracking
    await supabase
      .from('tracking_events')
      .insert([{
        shipment_id: input.shipment_id,
        status: shipmentStatus,
        description: `Tentative de livraison #${attemptNumber}: ${input.status === 'SUCCESS' ? 'Livré avec succès' : 'Échec'}`,
        scanned_by: userId,
        created_at: new Date().toISOString()
      }]);
    
    return { success: true, data };
  } catch (error) {
    console.error('Erreur création tentative livraison:', error);
    return { success: false, error };
  }
}

/**
 * Récupérer les tentatives de livraison d'un envoi
 */
export async function getDeliveryAttempts(shipmentId: string) {
  try {
    const { data, error } = await supabase
      .from('delivery_attempts')
      .select(`
        *,
        attempted_by:users(id, email, profiles(full_name))
      `)
      .eq('shipment_id', shipmentId)
      .order('attempt_number', { ascending: false });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Erreur récupération tentatives:', error);
    return { success: false, error, data: [] };
  }
}

/**
 * Marquer un envoi comme retourné (Point 106)
 */
export async function markAsReturned(shipmentId: string, userId: string) {
  try {
    // Mettre à jour le statut de l'envoi
    const { error: updateError } = await supabase
      .from('shipments')
      .update({ 
        status: 'RETURNED',
        updated_at: new Date().toISOString()
      })
      .eq('id', shipmentId);
    
    if (updateError) throw updateError;
    
    // Créer un événement de tracking
    await supabase
      .from('tracking_events')
      .insert([{
        shipment_id: shipmentId,
        status: 'RETURNED',
        description: 'Colis retourné à l\'expéditeur',
        scanned_by: userId,
        created_at: new Date().toISOString()
      }]);
    
    return { success: true };
  } catch (error) {
    console.error('Erreur marquage retourné:', error);
    return { success: false, error };
  }
}