// lib/services/data-masking.ts
'use server';

import { Supabase } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { 
  FieldType, 
  MaskPattern, 
  UserMaskingPermissions, 
  MaskingOptions,
  SensitiveField,
  MaskingPermission
} from '@/lib/types/masking';

const supabase = await Supabase;

export class DataMaskingService {
  
  /**
   * Récupérer les permissions de masquage d'un utilisateur
   */
  static async getUserMaskingPermissions(userId: string): Promise<UserMaskingPermissions> {
    try {
      // Récupérer les rôles de l'utilisateur
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', userId);
        
      if (rolesError) throw rolesError;
      
      const roleIds = userRoles?.map(ur => ur.role_id) || [];
      
      if (roleIds.length === 0) {
        return {
          userId,
          roleIds: [],
          permissions: {}
        };
      }
      
      // Récupérer les permissions de masquage
      const { data: permissions, error: permError } = await supabase
        .from('masking_permissions')
        .select(`
          *,
          sensitive_field:sensitive_fields(*),
          role:roles(id, name)
        `)
        .in('role_id', roleIds);
        
      if (permError) throw permError;
      
      // Organiser les permissions par champ
      const permissionsMap: UserMaskingPermissions['permissions'] = {};
      
      (permissions || []).forEach((perm: any) => {
        const fieldKey = `${perm.sensitive_field.table_name}.${perm.sensitive_field.field_name}`;
        
        if (!permissionsMap[fieldKey]) {
          permissionsMap[fieldKey] = {
            canViewFull: perm.can_view_full,
            canViewPartial: perm.can_view_partial,
            canEdit: perm.can_edit
          };
        } else {
          // Si l'utilisateur a plusieurs rôles, prendre la permission la plus permissive
          permissionsMap[fieldKey] = {
            canViewFull: permissionsMap[fieldKey].canViewFull || perm.can_view_full,
            canViewPartial: permissionsMap[fieldKey].canViewPartial || perm.can_view_partial,
            canEdit: permissionsMap[fieldKey].canEdit || perm.can_edit
          };
        }
      });
      
      return {
        userId,
        roleIds,
        permissions: permissionsMap
      };
      
    } catch (error) {
      console.error('Erreur récupération permissions masquage:', error);
      return {
        userId,
        roleIds: [],
        permissions: {}
      };
    }
  }
  
  /**
   * Masquer une valeur selon son type et les permissions
   */
  static maskValue(
    value: string | null | undefined,
    fieldType: FieldType,
    maskPattern: MaskPattern,
    userPermissions: UserMaskingPermissions | null,
    fieldKey: string
  ): string {
    if (!value) return '';
    
    const fieldPermission = userPermissions?.permissions[fieldKey];
    const canViewFull = fieldPermission?.canViewFull || false;
    const canViewPartial = fieldPermission?.canViewPartial || true;
    
    // Si l'utilisateur peut voir les données complètes
    if (canViewFull) {
      return value;
    }
    
    // Si l'utilisateur ne peut voir que partiellement
    if (canViewPartial) {
      switch (fieldType) {
        case 'PHONE':
          return this.maskPhone(value);
        case 'EMAIL':
          return this.maskEmail(value);
        case 'ADDRESS':
          return this.maskAddress(value);
        case 'TAX_ID':
          return this.maskTaxId(value);
        case 'PERSONAL_ID':
          return this.maskPersonalId(value);
        default:
          return this.maskGeneric(value);
      }
    }
    
    // Si l'utilisateur ne peut rien voir
    return '••••••••';
  }
  
  /**
   * Masquer un numéro de téléphone
   */
  static maskPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length <= 4) return '••••';
    
    // Garder les 4 derniers chiffres
    const visiblePart = cleaned.slice(-4);
    const maskedPart = '•'.repeat(Math.max(0, cleaned.length - 4));
    return `${maskedPart}${visiblePart}`;
  }
  
  /**
   * Masquer un email
   */
  static maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return '••••@••••';
    
    // Garder le premier et dernier caractère du local part
    const firstChar = localPart[0];
    const lastChar = localPart[localPart.length - 1];
    const maskedLocal = `${firstChar}•••${lastChar}`;
    
    // Masquer une partie du domaine
    const [domainName, tld] = domain.split('.');
    if (!domainName || !tld) return `${maskedLocal}@••••`;
    
    const maskedDomain = `${domainName[0]}•••${domainName[domainName.length - 1] || ''}`;
    return `${maskedLocal}@${maskedDomain}.${tld}`;
  }
  
  /**
   * Masquer une adresse
   */
  static maskAddress(address: string): string {
    const parts = address.split(',');
    if (parts.length === 0) return '••••••••';
    
    // Garder la ville (dernière partie) visible
    const city = parts[parts.length - 1].trim();
    const maskedParts = parts.slice(0, -1).map(part => {
      const words = part.trim().split(' ');
      return words.map(word => {
        if (word.length <= 2) return word;
        return word[0] + '•'.repeat(word.length - 1);
      }).join(' ');
    });
    
    return [...maskedParts, city].join(', ');
  }
  
  /**
   * Masquer un numéro fiscal
   */
  static maskTaxId(taxId: string): string {
    if (taxId.length <= 4) return '••••';
    return '••••' + taxId.slice(-4);
  }
  
  /**
   * Masquer un ID personnel
   */
  static maskPersonalId(personalId: string): string {
    if (personalId.length <= 3) return '•••';
    return personalId.slice(0, 3) + '•'.repeat(Math.max(0, personalId.length - 3));
  }
  
  /**
   * Masquer générique
   */
  static maskGeneric(value: string): string {
    if (value.length <= 3) return '•••';
    return value.slice(0, 2) + '•'.repeat(Math.max(0, value.length - 4)) + value.slice(-2);
  }
  
  /**
   * Logger l'accès aux données sensibles
   */
  static async logSensitiveDataAccess(
    userId: string,
    customerId: string | null,
    sensitiveFieldId: string | null,
    accessType: 'VIEW' | 'EDIT' | 'EXPORT' | 'API'
  ): Promise<void> {
    try {
      const headersList = await headers();
      const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
      const userAgent = headersList.get('user-agent') || 'unknown';
      
      await supabase
        .from('sensitive_data_access_logs')
        .insert([{
          user_id: userId,
          customer_id: customerId,
          sensitive_field_id: sensitiveFieldId,
          access_type: accessType,
          ip_address: ipAddress,
          user_agent: userAgent
        }]);
    } catch (error) {
      console.error('Erreur logging accès données sensibles:', error);
      // Ne pas propager l'erreur pour ne pas perturber le flux principal
    }
  }
  
  /**
   * Masquer un objet client complet
   */
  static async maskCustomerData(
    customer: any,
    userPermissions: UserMaskingPermissions | null,
    options: MaskingOptions = {}
  ): Promise<any> {
    const maskedCustomer = { ...customer };
    const userId = userPermissions?.userId;
    
    // Champs sensibles des clients
    const sensitiveFields = [
      { field: 'phone', type: 'PHONE' as FieldType, key: 'customers.phone' },
      { field: 'email', type: 'EMAIL' as FieldType, key: 'customers.email' },
      { field: 'address', type: 'ADDRESS' as FieldType, key: 'customers.address' },
      { field: 'tax_id', type: 'TAX_ID' as FieldType, key: 'customers.tax_id' },
    ];
    
    // Logger l'accès si configuré
    if (options.logAccess && userId && customer.id) {
      for (const sf of sensitiveFields) {
        if (customer[sf.field]) {
          await this.logSensitiveDataAccess(userId, customer.id, null, 'VIEW');
          break;
        }
      }
    }
    
    // Appliquer le masquage
    for (const sf of sensitiveFields) {
      if (maskedCustomer[sf.field] !== undefined && maskedCustomer[sf.field] !== null) {
        maskedCustomer[sf.field] = this.maskValue(
          maskedCustomer[sf.field],
          sf.type,
          'partial',
          userPermissions,
          sf.key
        );
      }
    }
    
    // Masquer les adresses si présentes
    if (maskedCustomer.addresses && Array.isArray(maskedCustomer.addresses)) {
      maskedCustomer.addresses = await Promise.all(
        maskedCustomer.addresses.map((addr: any) => 
          this.maskCustomerAddress(addr, userPermissions, { ...options, customerId: customer.id })
        )
      );
    }
    
    return maskedCustomer;
  }
  
  /**
   * Masquer une adresse client
   */
  static async maskCustomerAddress(
    address: any,
    userPermissions: UserMaskingPermissions | null,
    options: MaskingOptions & { customerId?: string } = {}
  ): Promise<any> {
    const maskedAddress = { ...address };
    const userId = userPermissions?.userId;
    
    // Champs sensibles des adresses
    const sensitiveFields = [
      { field: 'address_line1', type: 'ADDRESS' as FieldType, key: 'customer_addresses.address_line1' },
      { field: 'address_line2', type: 'ADDRESS' as FieldType, key: 'customer_addresses.address_line2' },
      { field: 'postal_code', type: 'ADDRESS' as FieldType, key: 'customer_addresses.postal_code' },
    ];
    
    // Logger l'accès si configuré
    if (options.logAccess && userId && options.customerId) {
      for (const sf of sensitiveFields) {
        if (address[sf.field]) {
          await this.logSensitiveDataAccess(userId, options.customerId, null, 'VIEW');
          break;
        }
      }
    }
    
    // Appliquer le masquage
    for (const sf of sensitiveFields) {
      if (maskedAddress[sf.field] !== undefined && maskedAddress[sf.field] !== null) {
        maskedAddress[sf.field] = this.maskValue(
          maskedAddress[sf.field],
          sf.type,
          'partial',
          userPermissions,
          sf.key
        );
      }
    }
    
    return maskedAddress;
  }
  
  /**
   * Vérifier si un utilisateur peut éditer un champ
   */
  static canEditField(
    userPermissions: UserMaskingPermissions | null,
    fieldKey: string
  ): boolean {
    const permission = userPermissions?.permissions[fieldKey];
    return permission?.canEdit || false;
  }
  
  /**
   * Obtenir les statistiques d'accès aux données sensibles
   */
  static async getAccessStats(
    startDate?: string,
    endDate?: string
  ): Promise<{
    totalAccesses: number;
    accessesByType: Record<string, number>;
    topUsers: Array<{ userId: string; userName: string; accessCount: number }>;
    topFields: Array<{ fieldName: string; accessCount: number }>;
  }> {
    try {
      let query = supabase
        .from('sensitive_data_access_logs')
        .select(`
          *,
          user:users(
            id,
            email,
            profiles:profiles(full_name)
          ),
          sensitive_field:sensitive_fields(field_name)
        `);
      
      if (startDate) {
        query = query.gte('accessed_at', startDate);
      }
      if (endDate) {
        query = query.lte('accessed_at', endDate);
      }
      
      const { data: logs, error } = await query;
      
      if (error) throw error;
      
      const accessesByType: Record<string, number> = {};
      const userAccessCount: Record<string, number> = {};
      const fieldAccessCount: Record<string, number> = {};
      
      logs?.forEach(log => {
        // Par type d'accès
        accessesByType[log.access_type] = (accessesByType[log.access_type] || 0) + 1;
        
        // Par utilisateur
        const userId = log.user_id;
        userAccessCount[userId] = (userAccessCount[userId] || 0) + 1;
        
        // Par champ
        if (log.sensitive_field?.field_name) {
          const fieldName = log.sensitive_field.field_name;
          fieldAccessCount[fieldName] = (fieldAccessCount[fieldName] || 0) + 1;
        }
      });
      
      // Trier les utilisateurs par nombre d'accès
      const topUsers = Object.entries(userAccessCount)
        .map(([userId, accessCount]) => {
          const user = logs?.find(l => l.user_id === userId)?.user;
          return {
            userId,
            userName: user?.profiles?.full_name || user?.email || userId,
            accessCount
          };
        })
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, 10);
      
      // Trier les champs par nombre d'accès
      const topFields = Object.entries(fieldAccessCount)
        .map(([fieldName, accessCount]) => ({ fieldName, accessCount }))
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, 10);
      
      return {
        totalAccesses: logs?.length || 0,
        accessesByType,
        topUsers,
        topFields
      };
      
    } catch (error) {
      console.error('Erreur statistiques accès:', error);
      return {
        totalAccesses: 0,
        accessesByType: {},
        topUsers: [],
        topFields: []
      };
    }
  }
}