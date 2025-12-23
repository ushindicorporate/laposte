'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ActionResponse } from '@/lib/types/database';
import { Customer, CustomerFormData, CustomerSearchFilters, CustomerSearchResult, CustomerSearchStats, CustomerSuggestion, CustomerWithRelations } from '@/lib/types/customers';
import { customerSchema } from '@/lib/validations/customer';

const supabase = await createClient();

// Récupérer tous les clients avec relations
export async function getCustomers(): Promise<ActionResponse<CustomerWithRelations[]>> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        addresses:customer_addresses (
          *,
          city:city_id (
            id,
            name,
            regions!inner (
              id,
              name
            )
          )
        ),
        created_by_user:created_by (
          id,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data as CustomerWithRelations[] };
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return { success: false, error: error.message };
  }
}

// Récupérer un client par ID
export async function getCustomerById(id: string): Promise<ActionResponse<CustomerWithRelations>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        addresses:customer_addresses (
          *,
          city:city_id (
            id,
            name,
            regions!inner (
              id,
              name
            )
          )
        ),
        created_by_user:created_by (
          id,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { success: true, data: data as CustomerWithRelations };
  } catch (error: any) {
    console.error('Error fetching customer:', error);
    return { success: false, error: error.message };
  }
}

// Générer un code client unique
async function generateCustomerCode(): Promise<string> {
  const supabase = await createClient();
  
  // Récupérer le dernier code
  const { data } = await supabase
    .from('customers')
    .select('customer_code')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  let nextNumber = 1;
  if (data?.customer_code) {
    // Extraire le numéro du code existant
    const match = data.customer_code.match(/CLIENT-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    } else {
      // Compter tous les clients
      const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
      
      nextNumber = (count || 0) + 1;
    }
  }

  return `CLIENT-${nextNumber.toString().padStart(5, '0')}`;
}

// Créer un nouveau client
export async function createCustomer(formData: CustomerFormData): Promise<ActionResponse<Customer>> {
  try {
    // Valider avec Zod
    const validatedData = customerSchema.parse(formData);
    
    const supabase = await createClient();
    
    // Vérifier l'utilisateur
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    // Générer le code client
    const customerCode = await generateCustomerCode();

    // Préparer les données du client
    const customerData = {
      ...validatedData,
      customer_code: customerCode,
      company_name: validatedData.company_name || null,
      email: validatedData.email || null,
      tax_id: validatedData.tax_id || null,
      id_type: validatedData.id_type || null,
      id_number: validatedData.id_number || null,
      notes: validatedData.notes || null,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Créer le client
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();

    if (customerError) throw customerError;

    // Créer les adresses si fournies
    if (validatedData.addresses && validatedData.addresses.length > 0) {
      const addressesData = validatedData.addresses.map(address => ({
        ...address,
        customer_id: customer.id,
        address_line2: address.address_line2 || null,
        city_id: address.city_id || null,
        postal_code: address.postal_code || null,
        latitude: address.latitude || null,
        longitude: address.longitude || null,
        notes: address.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: addressesError } = await supabase
        .from('customer_addresses')
        .insert(addressesData);

      if (addressesError) throw addressesError;
    }

    // Audit log
    try {
      await supabase.from('audit_logs').insert([{
        user_id: user.id,
        event_type: 'CUSTOMER_CREATED',
        target_table: 'customers',
        target_record_id: customer.id,
        details: customerData,
      }]);
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError);
    }

    revalidatePath('/dashboard/crm');
    return { success: true, data: customer as Customer };
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return { 
      success: false, 
      error: error.message || 'Erreur lors de la création du client' 
    };
  }
}

// Mettre à jour un client
export async function updateCustomer(id: string, formData: Partial<CustomerFormData>): Promise<ActionResponse<Customer>> {
  try {
    // Valider avec Zod (partial)
    const validatedData = customerSchema.partial().parse(formData);
    
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    // Vérifier si le client existe
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingCustomer) {
      throw new Error('Client non trouvé.');
    }

    // Préparer les données de mise à jour
    const updateData: Partial<Customer> = {};
    
    Object.keys(validatedData).forEach(key => {
      if (key !== 'addresses') {
        const value = (validatedData as any)[key];
        if (value === '' || value === null || value === undefined) {
          (updateData as any)[key] = null;
        } else {
          (updateData as any)[key] = value;
        }
      }
    });

    updateData.updated_by = user.id;
    updateData.updated_at = new Date().toISOString();

    // Mettre à jour le client
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (customerError) throw customerError;

    // Mettre à jour les adresses si fournies
    if (validatedData.addresses !== undefined) {
      // Supprimer les anciennes adresses
      const { error: deleteError } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('customer_id', id);

      if (deleteError) throw deleteError;

      // Ajouter les nouvelles adresses
      if (validatedData.addresses && validatedData.addresses.length > 0) {
        const addressesData = validatedData.addresses.map(address => ({
          ...address,
          customer_id: id,
          address_line2: address.address_line2 || null,
          city_id: address.city_id || null,
          postal_code: address.postal_code || null,
          latitude: address.latitude || null,
          longitude: address.longitude || null,
          notes: address.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        const { error: addressesError } = await supabase
          .from('customer_addresses')
          .insert(addressesData);

        if (addressesError) throw addressesError;
      }
    }

    // Audit log
    try {
      await supabase.from('audit_logs').insert([{
        user_id: user.id,
        event_type: 'CUSTOMER_UPDATED',
        target_table: 'customers',
        target_record_id: id,
        details: updateData,
      }]);
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError);
    }

    revalidatePath('/dashboard/crm');
    revalidatePath(`/dashboard/crm/${id}`);
    return { success: true, data: customer as Customer };
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return { 
      success: false, 
      error: error.message || 'Erreur lors de la mise à jour du client' 
    };
  }
}

// Basculer le statut d'un client
export async function toggleCustomerStatus(id: string, isActive: boolean): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { error } = await supabase
      .from('customers')
      .update({ 
        is_active: isActive,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    // Audit log
    try {
      await supabase.from('audit_logs').insert([{
        user_id: user.id,
        event_type: 'CUSTOMER_STATUS_CHANGED',
        target_table: 'customers',
        target_record_id: id,
        details: { is_active: isActive },
      }]);
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError);
    }

    revalidatePath('/dashboard/crm');
    return { success: true };
  } catch (error: any) {
    console.error('Error toggling customer status:', error);
    return { 
      success: false, 
      error: error.message || 'Erreur lors du changement de statut' 
    };
  }
}

// Supprimer un client
export async function deleteCustomer(id: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    // Vérifier si le client a des envois
    const { count: shipmentsCount } = await supabase
      .from('shipments')
      .select('*', { count: 'exact', head: true })
      .or(`sender_phone.eq.${id},recipient_phone.eq.${id}`);

    if (shipmentsCount && shipmentsCount > 0) {
      throw new Error('Impossible de supprimer : des envois sont associés à ce client.');
    }

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Audit log
    try {
      await supabase.from('audit_logs').insert([{
        user_id: user.id,
        event_type: 'CUSTOMER_DELETED',
        target_table: 'customers',
        target_record_id: id,
      }]);
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError);
    }

    revalidatePath('/dashboard/crm');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return { 
      success: false, 
      error: error.message || 'Erreur lors de la suppression du client' 
    };
  }
}

// Statistiques des clients
export interface CustomerStats {
  total: number;
  active: number;
  particulier: number;
  entreprise: number;
  withAddress: number;
  byMonth: Array<{
    month: string;
    count: number;
  }>;
}

// Récupérer les statistiques des clients
export async function getCustomerStats(): Promise<ActionResponse<CustomerStats>> {
  try {
    const supabase = await createClient();
    
    // Récupérer tous les clients
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at');

    if (error) throw error;

    const stats: CustomerStats = {
      total: customers.length,
      active: customers.filter(c => c.is_active).length,
      particulier: customers.filter(c => c.customer_type === 'PARTICULIER').length,
      entreprise: customers.filter(c => c.customer_type === 'ENTREPRISE').length,
      withAddress: 0, // À calculer plus tard
      byMonth: []
    };

    // Calculer par mois
    const monthCounts: Record<string, number> = {};
    customers.forEach(customer => {
      const month = new Date(customer.created_at).toLocaleDateString('fr-FR', { 
        month: 'short', 
        year: 'numeric' 
      });
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });

    stats.byMonth = Object.entries(monthCounts).map(([month, count]) => ({
      month,
      count
    })).sort((a, b) => {
      const dateA = new Date(`01 ${a.month}`);
      const dateB = new Date(`01 ${b.month}`);
      return dateA.getTime() - dateB.getTime();
    });

    return { success: true, data: stats };
  } catch (error: any) {
    console.error('Error fetching customer stats:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Recherche avancée de clients avec filtres
 */
export async function searchCustomers(filters: CustomerSearchFilters): Promise<CustomerSearchResult> {
  try {
    const {
      query = '',
      type = 'all',
      agency_id,
      city_id,
      region_id,
      created_start,
      created_end,
      has_shipments,
      sort_by = 'created_at',
      sort_order = 'desc',
      page = 1,
      limit = 20
    } = filters;

    const offset = (page - 1) * limit;

    // Construction de la requête de base
    let queryBuilder = supabase
      .from('customers')
      .select(`
        *,
        addresses:customer_addresses(
          *,
          city:cities(
            id,
            name,
            region_id,
            regions(
              id,
              name
            )
          )
        ),
        shipments:shipments(
          id,
          created_at,
          status
        )
      `, { count: 'exact' });

    // Filtre par texte (nom, email, téléphone)
    if (query.trim()) {
      const searchQuery = `%${query.trim()}%`;
      queryBuilder = queryBuilder.or(
        `name.ilike.${searchQuery},email.ilike.${searchQuery},phone.ilike.${searchQuery}`
      );
    }

    // Filtre par type
    if (type !== 'all') {
      queryBuilder = queryBuilder.eq('type', type);
    }

    // Filtre par agence (via les envois)
    if (agency_id) {
      queryBuilder = queryBuilder.contains('shipments', { origin_agency_id: agency_id });
    }

    // Filtre par date de création
    if (created_start) {
      queryBuilder = queryBuilder.gte('created_at', created_start);
    }
    if (created_end) {
      queryBuilder = queryBuilder.lte('created_at', created_end);
    }

    // Filtre par présence d'envois
    if (has_shipments !== undefined) {
      if (has_shipments) {
        queryBuilder = queryBuilder.not('shipments', 'is', null);
      } else {
        queryBuilder = queryBuilder.is('shipments', null);
      }
    }

    // Tri
    if (sort_by === 'shipment_count') {
      // Tri par nombre d'envois nécessite une sous-requête
      queryBuilder = queryBuilder.order('created_at', { ascending: sort_order === 'asc' });
    } else {
      queryBuilder = queryBuilder.order(sort_by, { ascending: sort_order === 'asc' });
    }

    // Pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      console.error('Erreur recherche clients:', error);
      throw new Error(`Erreur recherche: ${error.message}`);
    }

    // Post-traitement pour le tri par nombre d'envois
    let customers = data || [];
    if (sort_by === 'shipment_count') {
      customers.sort((a, b) => {
        const countA = a.shipments?.length || 0;
        const countB = b.shipments?.length || 0;
        return sort_order === 'asc' ? countA - countB : countB - countA;
      });
    }

    // Filtre par ville/région (post-traitement car relation indirecte)
    if (city_id || region_id) {
      customers = customers.filter(customer => {
        const addresses = customer.addresses || [];
        if (city_id) {
          return addresses.some(addr => addr.city_id === city_id);
        }
        if (region_id) {
          return addresses.some(addr => addr.city?.regions?.id === region_id);
        }
        return true;
      });
    }

    const total_count = customers.length;
    const total_pages = Math.ceil((count || 0) / limit);

    return {
      customers,
      total_count: count || 0,
      page,
      total_pages,
      filters
    };

  } catch (error) {
    console.error('Erreur recherche clients:', error);
    throw error;
  }
}

/**
 * Recherche rapide pour suggestions (autocomplete)
 */
export async function searchCustomerSuggestions(query: string): Promise<CustomerSuggestion[]> {
  try {
    if (!query.trim() || query.length < 2) {
      return [];
    }

    const searchQuery = `%${query.trim()}%`;

    const { data, error } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        phone,
        email,
        type,
        shipments:shipments(
          id,
          created_at
        )
      `)
      .or(`name.ilike.${searchQuery},phone.ilike.${searchQuery},email.ilike.${searchQuery}`)
      .limit(10);

    if (error) {
      console.error('Erreur suggestions clients:', error);
      return [];
    }

    return (data || []).map(customer => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      type: customer.type,
      last_shipment_date: customer.shipments?.length > 0 
        ? customer.shipments.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]?.created_at 
        : null,
      shipment_count: customer.shipments?.length || 0
    }));

  } catch (error) {
    console.error('Erreur suggestions clients:', error);
    return [];
  }
}

/**
 * Obtenir les statistiques de recherche
 */
export async function getCustomerSearchStats(filters?: CustomerSearchFilters): Promise<CustomerSearchStats> {
  try {
    // Compter tous les clients
    const { count: total } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    // Compter par type
    const { count: particuliers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'PARTICULIER');

    const { count: entreprises } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'ENTREPRISE');

    // Clients des 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count: last30Days } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Ville la plus fréquente
    const { data: cityData } = await supabase
      .from('customer_addresses')
      .select(`
        city:cities(
          name
        )
      `)
      .limit(1);

    // Région la plus fréquente
    const { data: regionData } = await supabase
      .from('customer_addresses')
      .select(`
        city:cities(
          regions(
            name
          )
        )
      `)
      .limit(1);

    // Nombre moyen d'envois par client
    const { data: shipmentsData } = await supabase
      .from('shipments')
      .select('customer_id');

    const uniqueCustomers = new Set(shipmentsData?.map(s => s.customer_id) || []);
    const avgShipments = shipmentsData?.length && total 
      ? shipmentsData.length / total 
      : 0;

    return {
      total_customers: total || 0,
      total_particuliers: particuliers || 0,
      total_entreprises: entreprises || 0,
      avg_shipments_per_customer: parseFloat(avgShipments.toFixed(2)),
      top_city: cityData?.[0]?.city?.name || null,
      top_region: regionData?.[0]?.city?.regions?.name || null,
      last_30_days_new: last30Days || 0
    };

  } catch (error) {
    console.error('Erreur stats clients:', error);
    return {
      total_customers: 0,
      total_particuliers: 0,
      total_entreprises: 0,
      avg_shipments_per_customer: 0,
      top_city: null,
      top_region: null,
      last_30_days_new: 0
    };
  }
}

/**
 * Export des clients en CSV
 */
export async function exportCustomersToCSV(filters: CustomerSearchFilters): Promise<string> {
  try {
    const result = await searchCustomers({ ...filters, limit: 10000 });
    
    const headers = [
      'ID',
      'Type',
      'Nom',
      'Email',
      'Téléphone',
      'Adresse',
      'Numéro Fiscal',
      'Date Création',
      'Nombre Envois',
      'Dernier Envoi'
    ];

    const rows = result.customers.map(customer => {
      const lastShipment = customer.shipments?.length > 0
        ? new Date(customer.shipments.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]?.created_at).toLocaleDateString('fr-FR')
        : '';

      return [
        customer.id,
        customer.type,
        `"${customer.name.replace(/"/g, '""')}"`,
        customer.email || '',
        customer.phone,
        `"${customer.address?.replace(/"/g, '""') || ''}"`,
        customer.tax_id || '',
        new Date(customer.created_at).toLocaleDateString('fr-FR'),
        customer.shipments?.length || 0,
        lastShipment
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');

  } catch (error) {
    console.error('Erreur export CSV:', error);
    throw new Error('Erreur lors de l\'export CSV');
  }
}