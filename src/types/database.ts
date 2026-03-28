// ============================================================================
// Quotr — Supabase Database Types
// Generated from the database schema. Keep in sync with migrations.
// ============================================================================

// ---------------------------------------------------------------------------
// Row types (one per table)
// ---------------------------------------------------------------------------

export interface Company {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  website: string | null;
  kvk_number: string | null;
  btw_number: string | null;
  iban: string | null;
  logo_url: string | null;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  city: string | null;
  country: string;
  settings: Record<string, unknown>;
  subscription_plan: string;
  subscription_status: string;
  trial_ends_at: string | null;
  mollie_customer_id: string | null;
  mollie_subscription_id: string | null;
  next_quote_number: number;
  next_invoice_number: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  company_id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
  phone: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  unit_price: number;
  unit: string;
  tax_rate: number;
  category: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone: string | null;
  contact_person: string | null;
  kvk_number: string | null;
  btw_number: string | null;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  city: string | null;
  country: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  company_id: string;
  client_id: string;
  user_id: string;
  quote_number: string;
  status: string;
  title: string;
  introduction: string | null;
  conclusion: string | null;
  subtotal: number;
  tax_amount: number;
  total: number;
  discount_type: string | null;
  discount_value: number | null;
  valid_until: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  public_token: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface QuoteLine {
  id: string;
  quote_id: string;
  service_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  subtotal: number;
  sort_order: number;
  created_at: string;
}

export interface QuoteEvent {
  id: string;
  quote_id: string;
  user_id: string | null;
  event_type: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Invoice {
  id: string;
  company_id: string;
  client_id: string;
  quote_id: string | null;
  user_id: string;
  invoice_number: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  due_date: string;
  paid_at: string | null;
  sent_at: string | null;
  public_token: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLine {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  subtotal: number;
  sort_order: number;
  created_at: string;
}

export interface Appointment {
  id: string;
  company_id: string;
  client_id: string | null;
  user_id: string;
  quote_id: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  status: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  public_token: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AvailabilitySlot {
  id: string;
  company_id: string;
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export interface BillingEvent {
  id: string;
  company_id: string;
  event_type: string;
  amount: number;
  currency: string;
  mollie_payment_id: string | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Insert / Update helpers (optional fields for create & partial for update)
// ---------------------------------------------------------------------------

export type CompanyInsert = Omit<Company, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type CompanyUpdate = Partial<CompanyInsert>;

export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type UserUpdate = Partial<UserInsert>;

export type ServiceInsert = Omit<Service, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type ServiceUpdate = Partial<ServiceInsert>;

export type ClientInsert = Omit<Client, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type ClientUpdate = Partial<ClientInsert>;

export type QuoteInsert = Omit<Quote, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type QuoteUpdate = Partial<QuoteInsert>;

export type QuoteLineInsert = Omit<QuoteLine, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};
export type QuoteLineUpdate = Partial<QuoteLineInsert>;

export type QuoteEventInsert = Omit<QuoteEvent, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};
export type QuoteEventUpdate = Partial<QuoteEventInsert>;

export type InvoiceInsert = Omit<Invoice, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type InvoiceUpdate = Partial<InvoiceInsert>;

export type InvoiceLineInsert = Omit<InvoiceLine, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};
export type InvoiceLineUpdate = Partial<InvoiceLineInsert>;

export type AppointmentInsert = Omit<Appointment, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};
export type AppointmentUpdate = Partial<AppointmentInsert>;

export type AvailabilitySlotInsert = Omit<AvailabilitySlot, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};
export type AvailabilitySlotUpdate = Partial<AvailabilitySlotInsert>;

export type BillingEventInsert = Omit<BillingEvent, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};
export type BillingEventUpdate = Partial<BillingEventInsert>;

// ---------------------------------------------------------------------------
// Database type — used to type the Supabase client
// ---------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Company;
        Insert: CompanyInsert;
        Update: CompanyUpdate;
      };
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      services: {
        Row: Service;
        Insert: ServiceInsert;
        Update: ServiceUpdate;
      };
      clients: {
        Row: Client;
        Insert: ClientInsert;
        Update: ClientUpdate;
      };
      quotes: {
        Row: Quote;
        Insert: QuoteInsert;
        Update: QuoteUpdate;
      };
      quote_lines: {
        Row: QuoteLine;
        Insert: QuoteLineInsert;
        Update: QuoteLineUpdate;
      };
      quote_events: {
        Row: QuoteEvent;
        Insert: QuoteEventInsert;
        Update: QuoteEventUpdate;
      };
      invoices: {
        Row: Invoice;
        Insert: InvoiceInsert;
        Update: InvoiceUpdate;
      };
      invoice_lines: {
        Row: InvoiceLine;
        Insert: InvoiceLineInsert;
        Update: InvoiceLineUpdate;
      };
      appointments: {
        Row: Appointment;
        Insert: AppointmentInsert;
        Update: AppointmentUpdate;
      };
      availability_slots: {
        Row: AvailabilitySlot;
        Insert: AvailabilitySlotInsert;
        Update: AvailabilitySlotUpdate;
      };
      billing_events: {
        Row: BillingEvent;
        Insert: BillingEventInsert;
        Update: BillingEventUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
