// actions/pricing.ts
'use server';

import { Supabase as supabase } from '@/lib/supabase/server';
import { 
  PriceCalculationInput, 
  PriceCalculationResult,
  PricingRule 
} from '@/lib/types/finance';

/**
 * Calculer le prix d'un envoi (Point 112)
 */
export async function calculatePrice(
  input: PriceCalculationInput
): Promise<PriceCalculationResult> {
  try {
    const breakdown: Array<{ description: string; amount: number }> = [];
    let total = 0;
    
    // 1. Trouver le tarif de base
    const { data: tariffs, error: tariffError } = await supabase
      .from('tariffs')
      .select('*')
      .eq('service_type', input.service_type)
      .eq('is_active', true)
      .lte('min_weight_kg', input.weight_kg)
      .or(`max_weight_kg.is.null,max_weight_kg.gte.${input.weight_kg}`)
      .order('base_price')
      .limit(1);
    
    if (tariffError) throw tariffError;
    
    const baseTariff = tariffs?.[0];
    
    if (!baseTariff) {
      throw new Error('Aucun tarif disponible pour ce service');
    }
    
    // 2. Prix de base
    const basePrice = baseTariff.base_price;
    breakdown.push({ description: `Tarif ${baseTariff.name}`, amount: basePrice });
    total += basePrice;
    
    // 3. Prix selon le poids
    let weightPrice = 0;
    if (baseTariff.price_per_kg && input.weight_kg > 0) {
      weightPrice = baseTariff.price_per_kg * input.weight_kg;
      if (weightPrice > 0) {
        breakdown.push({ 
          description: `Suppl. poids (${input.weight_kg}kg)`, 
          amount: weightPrice 
        });
        total += weightPrice;
      }
    }
    
    // 4. Prix selon le volume
    let volumePrice = 0;
    if (baseTariff.price_per_cm3 && input.volume_cm3 && input.volume_cm3 > 0) {
      volumePrice = baseTariff.price_per_cm3 * input.volume_cm3;
      if (volumePrice > 0) {
        breakdown.push({ 
          description: `Suppl. volume (${input.volume_cm3}cm³)`, 
          amount: volumePrice 
        });
        total += volumePrice;
      }
    }
    
    // 5. Assurance
    let insurancePrice = 0;
    if (input.has_insurance && input.declared_value && input.declared_value > 0) {
      insurancePrice = input.declared_value * (baseTariff.insurance_rate / 100);
      if (insurancePrice > 0) {
        breakdown.push({ 
          description: `Assurance (${baseTariff.insurance_rate}%)`, 
          amount: insurancePrice 
        });
        total += insurancePrice;
      }
    }
    
    // 6. Frais de traitement
    if (baseTariff.handling_fee > 0) {
      breakdown.push({ 
        description: 'Frais de traitement', 
        amount: baseTariff.handling_fee 
      });
      total += baseTariff.handling_fee;
    }
    
    // 7. Frais de livraison
    if (baseTariff.delivery_fee > 0) {
      breakdown.push({ 
        description: 'Frais de livraison', 
        amount: baseTariff.delivery_fee 
      });
      total += baseTariff.delivery_fee;
    }
    
    // 8. Appliquer les règles de prix (Point 109)
    const { data: rules, error: rulesError } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('is_active', true)
      .lte('effective_date', new Date().toISOString().split('T')[0])
      .or(`expiration_date.is.null,expiration_date.gte.${new Date().toISOString().split('T')[0]}`)
      .order('priority', { ascending: false });
    
    if (!rulesError && rules) {
      // Appliquer les règles dans l'ordre de priorité
      rules.forEach((rule: PricingRule) => {
        if (applyRule(rule, input, total)) {
          const ruleAmount = calculateRuleAmount(rule, total);
          if (ruleAmount !== 0) {
            const description = rule.action_type === 'PERCENTAGE' && rule.action_value < 0
              ? `Remise: ${rule.name}`
              : `Suppl.: ${rule.name}`;
            
            breakdown.push({ 
              description, 
              amount: ruleAmount 
            });
            total += ruleAmount;
          }
        }
      });
    }
    
    // 9. Taxe (16% par défaut)
    const taxRate = 0.16; // 16% de TVA
    const taxAmount = total * taxRate;
    breakdown.push({ description: 'TVA (16%)', amount: taxAmount });
    total += taxAmount;
    
    return {
      base_price: basePrice,
      weight_price: weightPrice,
      volume_price: volumePrice,
      distance_price: 0, // À implémenter si nécessaire
      insurance_price: insurancePrice,
      handling_fee: baseTariff.handling_fee,
      delivery_fee: baseTariff.delivery_fee,
      subtotal: total - taxAmount,
      tax_amount: taxAmount,
      total_amount: Math.round(total),
      breakdown
    };
    
  } catch (error) {
    console.error('Erreur calcul prix:', error);
    throw error;
  }
}

// Helper pour appliquer une règle
function applyRule(rule: PricingRule, input: PriceCalculationInput, currentTotal: number): boolean {
  const conditionValue = getConditionValue(rule.condition_field, input, currentTotal);
  
  if (conditionValue === null) return false;
  
  switch (rule.operator) {
    case '=':
      return conditionValue === rule.value_from;
    case '>':
      return conditionValue > (rule.value_from || 0);
    case '<':
      return conditionValue < (rule.value_from || 0);
    case '>=':
      return conditionValue >= (rule.value_from || 0);
    case '<=':
      return conditionValue <= (rule.value_from || 0);
    case 'BETWEEN':
      return conditionValue >= (rule.value_from || 0) && 
             conditionValue <= (rule.value_to || Infinity);
    default:
      return false;
  }
}

// Helper pour obtenir la valeur de condition
function getConditionValue(field: string, input: PriceCalculationInput, currentTotal: number): number | null {
  switch (field) {
    case 'weight_kg':
      return input.weight_kg;
    case 'volume_cm3':
      return input.volume_cm3 || 0;
    case 'distance_km':
      return input.distance_km || 0;
    case 'has_insurance':
      return input.has_insurance ? 1 : 0;
    case 'requires_signature':
      return input.requires_signature ? 1 : 0;
    case 'total_amount':
      return currentTotal;
    default:
      return null;
  }
}

// Helper pour calculer le montant de la règle
function calculateRuleAmount(rule: PricingRule, currentTotal: number): number {
  switch (rule.action_type) {
    case 'ADD':
      return rule.action_value;
    case 'MULTIPLY':
      return currentTotal * rule.action_value;
    case 'PERCENTAGE':
      return currentTotal * (rule.action_value / 100);
    case 'FIXED':
      return rule.action_value;
    default:
      return 0;
  }
}

/**
 * Créer un paiement (Point 115)
 */
export async function createPayment(
  shipmentId: string,
  amount: number,
  paymentMethod: string,
  userId: string
) {
  try {
    // Récupérer l'envoi
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('id, customer_id, price')
      .eq('id', shipmentId)
      .single();
    
    if (shipmentError) throw shipmentError;
    
    // Générer une référence de paiement
    const paymentReference = `PAY-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    
    // Créer le paiement
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([{
        shipment_id: shipmentId,
        customer_id: shipment.customer_id,
        amount: amount,
        paid_amount: amount,
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        status: 'PAID',
        payment_date: new Date().toISOString(),
        created_by: userId
      }])
      .select()
      .single();
    
    if (paymentError) throw paymentError;
    
    // Mettre à jour l'envoi
    await supabase
      .from('shipments')
      .update({ 
        is_paid: true,
        payment_method: paymentMethod,
        updated_at: new Date().toISOString()
      })
      .eq('id', shipmentId);
    
    return { success: true, data: payment };
  } catch (error) {
    console.error('Erreur création paiement:', error);
    return { success: false, error };
  }
}

/**
 * Générer une facture (Point 117)
 */
export async function generateInvoice(
  customerId: string,
  periodStart: string,
  periodEnd: string,
  userId: string
) {
  try {
    // Récupérer les envois non facturés pour cette période
    const { data: shipments, error: shipmentsError } = await supabase
      .from('shipments')
      .select('id, tracking_number, price, created_at')
      .eq('customer_id', customerId)
      .eq('is_paid', true)
      .is('invoice_id', null)
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd);
    
    if (shipmentsError) throw shipmentsError;
    
    if (!shipments || shipments.length === 0) {
      throw new Error('Aucun envoi à facturer pour cette période');
    }
    
    // Générer un numéro de facture
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Calculer le total
    const subtotal = shipments.reduce((sum, shipment) => sum + (shipment.price || 0), 0);
    const taxRate = 0.16;
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;
    
    // Créer la facture
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([{
        invoice_number: invoiceNumber,
        customer_id: customerId,
        period_start: periodStart,
        period_end: periodEnd,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: 'SENT',
        created_by: userId
      }])
      .select()
      .single();
    
    if (invoiceError) throw invoiceError;
    
    // Créer les lignes de facture
    const invoiceItems = shipments.map(shipment => ({
      invoice_id: invoice.id,
      description: `Envoi ${shipment.tracking_number}`,
      quantity: 1,
      unit_price: shipment.price || 0,
      shipment_id: shipment.id
    }));
    
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems);
    
    if (itemsError) throw itemsError;
    
    // Mettre à jour les envois avec l'ID de facture
    const shipmentIds = shipments.map(s => s.id);
    await supabase
      .from('shipments')
      .update({ invoice_id: invoice.id })
      .in('id', shipmentIds);
    
    return { success: true, data: invoice };
  } catch (error) {
    console.error('Erreur génération facture:', error);
    return { success: false, error };
  }
}