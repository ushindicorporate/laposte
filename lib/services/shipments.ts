// actions/shipments.ts
'use server';

import { 
  CreateShipmentInput, 
  UpdateShipmentStatusInput,
  ShipmentSearchFilters,
  Shipment,
  ShipmentType,
  ShipmentStatus
} from '@/lib/types/shipments';
import { createClient } from '../supabase/server';

const supabase = await createClient();

export class ShipmentService {
  
  /**
   * Générer un numéro de suivi unique (point 74)
   */
  static generateTrackingNumber(): string {
    const prefix = 'RDC';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Générer une partie aléatoire
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    return `${prefix}${year}${month}${day}${random}`;
  }
  
  /**
   * Calculer le prix d'un envoi (point 81)
   */
  static async calculatePrice(
    serviceId: string,
    weightKg: number,
    declaredValue: number = 0,
    originAgencyId?: string,
    destinationAgencyId?: string
  ): Promise<{
    basePrice: number;
    weightPrice: number;
    insurancePrice: number;
    totalPrice: number;
    insuranceAmount: number;
  }> {
    try {
      // Récupérer le service
      const { data: service, error: serviceError } = await supabase
        .from('shipment_services')
        .select('*')
        .eq('id', serviceId)
        .single();
      
      if (serviceError) throw serviceError;
      if (!service) throw new Error('Service non trouvé');
      
      // Calculer le prix de base
      let basePrice = service.base_price;
      
      // Calculer le prix selon le poids
      let weightPrice = 0;
      if (service.price_per_kg && weightKg > 0) {
        weightPrice = service.price_per_kg * weightKg;
      }
      
      // Calculer l'assurance
      let insurancePrice = 0;
      let insuranceAmount = 0;
      if (service.has_insurance && declaredValue > 0) {
        insurancePrice = declaredValue * (service.insurance_rate / 100);
        insuranceAmount = declaredValue;
      }
      
      // Vérifier les tarifs spécifiques
      if (originAgencyId && destinationAgencyId) {
        const { data: tariff, error: tariffError } = await supabase
          .from('tariffs')
          .select('*')
          .eq('service_id', serviceId)
          .eq('origin_agency_id', originAgencyId)
          .eq('destination_agency_id', destinationAgencyId)
          .eq('is_active', true)
          .gte('min_weight_kg', weightKg)
          .lte('max_weight_kg', weightKg)
          .single();
        
        if (!tariffError && tariff) {
          basePrice = tariff.base_price;
          if (tariff.price_per_kg) {
            weightPrice = tariff.price_per_kg * weightKg;
          }
        }
      }
      
      const totalPrice = basePrice + weightPrice + insurancePrice;
      
      return {
        basePrice,
        weightPrice,
        insurancePrice,
        totalPrice,
        insuranceAmount
      };
      
    } catch (error) {
      console.error('Erreur calcul prix:', error);
      throw error;
    }
  }
  
  /**
   * Créer un nouvel envoi (points 75-84)
   */
  static async createShipment(
    input: CreateShipmentInput,
    userId: string
  ): Promise<Shipment> {
    try {
      // Vérifier que l'utilisateur a les permissions
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('agency_id')
        .eq('id', userId)
        .single();
      
      if (!userProfile?.agency_id && input.origin_agency_id !== userProfile?.agency_id) {
        throw new Error('Vous devez être associé à l\'agence d\'origine pour créer un envoi');
      }
      
      // Générer le numéro de suivi
      const trackingNumber = this.generateTrackingNumber();
      
      // Vérifier que le numéro n'existe pas déjà
      const { data: existing } = await supabase
        .from('shipments')
        .select('id')
        .eq('tracking_number', trackingNumber)
        .single();
      
      if (existing) {
        // Régénérer si collision (très rare)
        return this.createShipment(input, userId);
      }
      
      // Calculer le prix
      const weightKg = input.weight_kg || 1;
      const declaredValue = input.declared_value || 0;
      const priceData = await this.calculatePrice(
        input.service_id,
        weightKg,
        declaredValue,
        input.origin_agency_id,
        input.destination_agency_id
      );
      
      // Créer l'envoi
      const shipmentData = {
        tracking_number: trackingNumber,
        customer_id: input.customer_id || null,
        service_id: input.service_id,
        
        sender_name: input.sender_name,
        sender_phone: input.sender_phone,
        sender_address: input.sender_address || null,
        
        recipient_name: input.recipient_name,
        recipient_phone: input.recipient_phone,
        recipient_address: input.recipient_address || null,
        
        origin_agency_id: input.origin_agency_id,
        destination_agency_id: input.destination_agency_id,
        current_agency_id: input.origin_agency_id, // Commence à l'agence d'origine
        reference: input.reference || null,
        
        type: input.type,
        weight_kg: weightKg,
        dimensions: input.dimensions || null,
        package_count: input.package_count || 1,
        declared_value: declaredValue,
        
        insurance_amount: priceData.insuranceAmount,
        insurance_rate: priceData.insurancePrice > 0 ? 0.1 : 0, // 10% par défaut
        
        requires_signature: input.requires_signature || false,
        is_fragile: input.is_fragile || false,
        is_perishable: input.is_perishable || false,
        is_dangerous: input.is_dangerous || false,
        special_instructions: input.special_instructions || null,
        
        price: priceData.totalPrice,
        status: 'CREATED' as ShipmentStatus,
        
        created_by: userId
      };
      
      const { data: shipment, error: shipmentError } = await supabase
        .from('shipments')
        .insert([shipmentData])
        .select(`
          *,
          service:shipment_services(*),
          origin_agency:agencies(*),
          destination_agency:agencies(*)
        `)
        .single();
      
      if (shipmentError) throw shipmentError;
      
      // Créer les articles si présents
      if (input.items && input.items.length > 0) {
        const itemsData = input.items.map(item => ({
          shipment_id: shipment.id,
          description: item.description,
          package_type: item.package_type || 'PACKAGE',
          quantity: item.quantity || 1,
          weight_kg: item.weight_kg || null,
          length_cm: item.length_cm || null,
          width_cm: item.width_cm || null,
          height_cm: item.height_cm || null,
          declared_value: item.declared_value || null,
          is_fragile: item.is_fragile || false,
          is_perishable: item.is_perishable || false,
          is_dangerous: item.is_dangerous || false,
          special_instructions: item.special_instructions || null
        }));
        
        const { error: itemsError } = await supabase
          .from('shipment_items')
          .insert(itemsData);
        
        if (itemsError) throw itemsError;
      }
      
      // Créer l'historique de statut initial
      await this.createStatusHistory(
        shipment.id,
        'CREATED',
        null,
        input.origin_agency_id,
        userId,
        'Envoi créé'
      );
      
      // Logger dans l'audit
      await supabase
        .from('audit_logs')
        .insert([{
          user_id: userId,
          event_type: 'SHIPMENT_CREATED',
          target_table: 'shipments',
          target_record_id: shipment.id,
          details: {
            tracking_number: trackingNumber,
            price: priceData.totalPrice,
            service: input.service_id
          }
        }]);
      
      return shipment;
      
    } catch (error) {
      console.error('Erreur création envoi:', error);
      throw error;
    }
  }
  
  /**
   * Mettre à jour le statut d'un envoi (point 94)
   */
  static async updateShipmentStatus(
    shipmentId: string,
    input: UpdateShipmentStatusInput,
    userId: string
  ): Promise<void> {
    try {
      // Récupérer l'envoi actuel
      const { data: shipment, error: shipmentError } = await supabase
        .from('shipments')
        .select('status, current_agency_id')
        .eq('id', shipmentId)
        .single();
      
      if (shipmentError) throw shipmentError;
      
      // Vérifier les transitions autorisées
      const isValidTransition = this.validateStatusTransition(
        shipment.status,
        input.status
      );
      
      if (!isValidTransition) {
        throw new Error(`Transition de statut non autorisée: ${shipment.status} -> ${input.status}`);
      }
      
      // Mettre à jour l'envoi
      const updateData: any = {
        status: input.status,
        updated_at: new Date().toISOString()
      };
      
      // Mettre à jour l'agence courante si spécifiée
      if (input.location_agency_id) {
        updateData.current_agency_id = input.location_agency_id;
      }
      
      // Mettre à jour la date de livraison si nécessaire
      if (input.status === 'DELIVERED') {
        updateData.actual_delivery_date = new Date().toISOString();
      }
      
      const { error: updateError } = await supabase
        .from('shipments')
        .update(updateData)
        .eq('id', shipmentId);
      
      if (updateError) throw updateError;
      
      // Créer l'entrée dans l'historique
      await this.createStatusHistory(
        shipmentId,
        input.status,
        shipment.status,
        input.location_agency_id || shipment.current_agency_id,
        userId,
        input.notes
      );
      
      // Créer un événement de tracking
      await supabase
        .from('tracking_events')
        .insert([{
          shipment_id: shipmentId,
          status: input.status,
          location_agency_id: input.location_agency_id || shipment.current_agency_id,
          scanned_by: userId,
          description: input.notes || `Statut mis à jour: ${input.status}`
        }]);
      
      // Logger dans l'audit
      await supabase
        .from('audit_logs')
        .insert([{
          user_id: userId,
          event_type: 'SHIPMENT_STATUS_UPDATED',
          target_table: 'shipments',
          target_record_id: shipmentId,
          details: {
            previous_status: shipment.status,
            new_status: input.status,
            notes: input.notes
          }
        }]);
      
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      throw error;
    }
  }
  
  /**
   * Valider une transition de statut (point 95)
   */
  static validateStatusTransition(
    currentStatus: ShipmentStatus,
    newStatus: ShipmentStatus
  ): boolean {
    const allowedTransitions: Record<ShipmentStatus, ShipmentStatus[]> = {
      CREATED: ['RECEIVED', 'CANCELLED', 'ON_HOLD'],
      RECEIVED: ['IN_TRANSIT', 'CANCELLED', 'ON_HOLD'],
      IN_TRANSIT: ['ARRIVED_AT_DESTINATION', 'ON_HOLD'],
      ARRIVED_AT_DESTINATION: ['OUT_FOR_DELIVERY', 'ON_HOLD'],
      OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED_DELIVERY', 'RETURNED'],
      DELIVERED: [], // État final
      FAILED_DELIVERY: ['OUT_FOR_DELIVERY', 'RETURNED', 'ON_HOLD'],
      RETURNED: ['IN_TRANSIT', 'CANCELLED'],
      CANCELLED: [], // État final
      ON_HOLD: ['RECEIVED', 'IN_TRANSIT', 'ARRIVED_AT_DESTINATION', 'OUT_FOR_DELIVERY']
    };
    
    return allowedTransitions[currentStatus]?.includes(newStatus) || false;
  }
  
  /**
   * Créer une entrée dans l'historique des statuts
   */
  private static async createStatusHistory(
    shipmentId: string,
    status: ShipmentStatus,
    previousStatus: ShipmentStatus | null,
    agencyId: string | null,
    userId: string | null,
    notes?: string
  ): Promise<void> {
    await supabase
      .from('shipment_status_history')
      .insert([{
        shipment_id: shipmentId,
        status,
        previous_status: previousStatus,
        location_agency_id: agencyId,
        scanned_by: userId,
        notes,
        event_timestamp: new Date().toISOString()
      }]);
  }
  
  /**
   * Rechercher des envois avec filtres (point 85)
   */
  static async searchShipments(
    filters: ShipmentSearchFilters
  ): Promise<{
    shipments: Shipment[];
    total_count: number;
    page: number;
    total_pages: number;
  }> {
    try {
      const {
        tracking_number,
        customer_id,
        customer_name,
        sender_phone,
        recipient_phone,
        status,
        type,
        origin_agency_id,
        destination_agency_id,
        current_agency_id,
        created_start,
        created_end,
        estimated_delivery_start,
        estimated_delivery_end,
        has_payment,
        sort_by = 'created_at',
        sort_order = 'desc',
        page = 1,
        limit = 20
      } = filters;
      
      const offset = (page - 1) * limit;
      
      // Construction de la requête
      let query = supabase
        .from('shipments')
        .select(`
          *,
          service:shipment_services(*),
          origin_agency:agencies(*),
          destination_agency:agencies(*),
          current_agency:agencies(*),
          customer:customers(*),
          items:shipment_items(*),
          status_history:shipment_status_history(
            *,
            location_agency:agencies(*),
            scanned_by:users(
              id,
              email,
              profiles:profiles(full_name)
            )
          ),
          tracking_events:tracking_events(
            *,
            location_agency:agencies(*),
            scanned_by:users(
              id,
              email,
              profiles:profiles(full_name)
            )
          )
        `, { count: 'exact' });
      
      // Appliquer les filtres
      if (tracking_number) {
        query = query.ilike('tracking_number', `%${tracking_number}%`);
      }
      
      if (customer_id) {
        query = query.eq('customer_id', customer_id);
      }
      
      if (customer_name) {
        query = query.ilike('customer.name', `%${customer_name}%`);
      }
      
      if (sender_phone) {
        query = query.ilike('sender_phone', `%${sender_phone}%`);
      }
      
      if (recipient_phone) {
        query = query.ilike('recipient_phone', `%${recipient_phone}%`);
      }
      
      if (status) {
        if (Array.isArray(status)) {
          query = query.in('status', status);
        } else {
          query = query.eq('status', status);
        }
      }
      
      if (type) {
        if (Array.isArray(type)) {
          query = query.in('type', type);
        } else {
          query = query.eq('type', type);
        }
      }
      
      if (origin_agency_id) {
        query = query.eq('origin_agency_id', origin_agency_id);
      }
      
      if (destination_agency_id) {
        query = query.eq('destination_agency_id', destination_agency_id);
      }
      
      if (current_agency_id) {
        query = query.eq('current_agency_id', current_agency_id);
      }
      
      if (created_start) {
        query = query.gte('created_at', created_start);
      }
      
      if (created_end) {
        query = query.lte('created_at', created_end);
      }
      
      if (estimated_delivery_start) {
        query = query.gte('estimated_delivery_date', estimated_delivery_start);
      }
      
      if (estimated_delivery_end) {
        query = query.lte('estimated_delivery_date', estimated_delivery_end);
      }
      
      if (has_payment !== undefined) {
        if (has_payment) {
          query = query.not('payment_method', 'is', null);
        } else {
          query = query.is('payment_method', null);
        }
      }
      
      // Tri
      query = query.order(sort_by, { ascending: sort_order === 'asc' });
      
      // Pagination
      query = query.range(offset, offset + limit - 1);
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Erreur recherche envois:', error);
        throw error;
      }
      
      const total_pages = Math.ceil((count || 0) / limit);
      
      return {
        shipments: data || [],
        total_count: count || 0,
        page,
        total_pages
      };
      
    } catch (error) {
      console.error('Erreur recherche envois:', error);
      throw error;
    }
  }
  
  /**
   * Obtenir les statistiques des envois
   */
  static async getShipmentStats(
    agencyId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    total: number;
    by_status: Record<ShipmentStatus, number>;
    by_type: Record<ShipmentType, number>;
    revenue: number;
    avg_delivery_time: number;
    delivery_rate: number;
  }> {
    try {
      let query = supabase
        .from('shipments')
        .select('status, type, price, created_at, actual_delivery_date');
      
      if (agencyId) {
        query = query.or(`origin_agency_id.eq.${agencyId},destination_agency_id.eq.${agencyId}`);
      }
      
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      
      if (endDate) {
        query = query.lte('created_at', endDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const stats = {
        total: 0,
        by_status: {} as Record<ShipmentStatus, number>,
        by_type: {} as Record<ShipmentType, number>,
        revenue: 0,
        avg_delivery_time: 0,
        delivery_rate: 0
      };
      
      if (!data) return stats;
      
      stats.total = data.length;
      
      // Calculer les statistiques
      let totalDeliveryTime = 0;
      let deliveredCount = 0;
      let deliveryTimes: number[] = [];
      
      data.forEach(shipment => {
        // Par statut
        stats.by_status[shipment.status] = (stats.by_status[shipment.status] || 0) + 1;
        
        // Par type
        stats.by_type[shipment.type] = (stats.by_type[shipment.type] || 0) + 1;
        
        // Revenue
        stats.revenue += shipment.price || 0;
        
        // Temps de livraison
        if (shipment.status === 'DELIVERED' && shipment.actual_delivery_date) {
          const created = new Date(shipment.created_at);
          const delivered = new Date(shipment.actual_delivery_date);
          const deliveryTime = Math.floor((delivered.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          
          deliveryTimes.push(deliveryTime);
          totalDeliveryTime += deliveryTime;
          deliveredCount++;
        }
      });
      
      // Taux de livraison
      stats.delivery_rate = stats.total > 0 
        ? (deliveredCount / stats.total) * 100 
        : 0;
      
      // Temps moyen de livraison
      stats.avg_delivery_time = deliveredCount > 0 
        ? totalDeliveryTime / deliveredCount 
        : 0;
      
      return stats;
      
    } catch (error) {
      console.error('Erreur statistiques envois:', error);
      throw error;
    }
  }
}