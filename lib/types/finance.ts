// lib/types/finance.ts
export type PaymentMethod = 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CREDIT';
export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIAL' | 'FAILED' | 'REFUNDED';
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface Tariff {
  id: string;
  code: string;
  name: string;
  description: string | null;
  service_type: string;
  min_weight_kg: number;
  max_weight_kg: number | null;
  base_price: number;
  price_per_kg: number | null;
  price_per_cm3: number | null;
  insurance_rate: number;
  handling_fee: number;
  delivery_fee: number;
  effective_date: string;
  expiration_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricingRule {
  id: string;
  name: string;
  description: string | null;
  rule_type: 'WEIGHT' | 'DISTANCE' | 'SERVICE' | 'SPECIAL';
  condition_field: string;
  operator: string;
  value_from: number | null;
  value_to: number | null;
  action_type: 'ADD' | 'MULTIPLY' | 'PERCENTAGE' | 'FIXED';
  action_value: number;
  priority: number;
  effective_date: string;
  expiration_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  shipment_id: string | null;
  customer_id: string | null;
  invoice_id: string | null;
  amount: number;
  currency: string;
  paid_amount: number;
  discount_amount: number;
  tax_amount: number;
  payment_method: PaymentMethod;
  payment_reference: string | null;
  status: PaymentStatus;
  payment_date: string | null;
  due_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations
  shipment?: {
    id: string;
    tracking_number: string;
  };
  customer?: {
    id: string;
    name: string;
  };
  invoice?: {
    id: string;
    invoice_number: string;
  };
  created_by_user?: {
    id: string;
    email: string;
    profiles?: {
      full_name: string;
    };
  };
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  agency_id: string | null;
  period_start: string | null;
  period_end: string | null;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: InvoiceStatus;
  notes: string | null;
  terms: string | null;
  pdf_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations
  customer?: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
  };
  agency?: {
    id: string;
    name: string;
  };
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  shipment_id: string | null;
  created_at: string;
  
  // Relations
  shipment?: {
    id: string;
    tracking_number: string;
  };
}

export interface AgencyDailyReport {
  id: string;
  agency_id: string;
  report_date: string;
  shipments_count: number;
  delivered_count: number;
  failed_count: number;
  pending_count: number;
  total_revenue: number;
  cash_revenue: number;
  mobile_money_revenue: number;
  bank_transfer_revenue: number;
  credit_revenue: number;
  total_expenses: number;
  operational_expenses: number;
  personnel_expenses: number;
  other_expenses: number;
  notes: string | null;
  generated_by: string | null;
  generated_at: string;
  
  // Relations
  agency?: {
    id: string;
    name: string;
    code: string;
  };
}

// Types pour le calcul des prix
export interface PriceCalculationInput {
  weight_kg: number;
  volume_cm3?: number;
  distance_km?: number;
  service_type: string;
  declared_value?: number;
  origin_city_id?: string;
  destination_city_id?: string;
  customer_id?: string;
  has_insurance?: boolean;
  requires_signature?: boolean;
}

export interface PriceCalculationResult {
  base_price: number;
  weight_price: number;
  volume_price: number;
  distance_price: number;
  insurance_price: number;
  handling_fee: number;
  delivery_fee: number;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  breakdown: Array<{
    description: string;
    amount: number;
  }>;
}