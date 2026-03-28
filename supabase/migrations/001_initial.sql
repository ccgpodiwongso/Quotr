-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Companies (tenants)
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  kvk_number text,
  btw_number text,
  address text,
  city text,
  postcode text,
  country text DEFAULT 'NL',
  iban text,
  logo_url text,
  email text,
  phone text,
  website text,
  plan text DEFAULT 'trial' CHECK (plan IN ('trial', 'pro', 'cancelled')),
  trial_ends_at timestamptz DEFAULT now() + interval '14 days',
  mollie_customer_id text,
  mollie_subscription_id text,
  referral_source text,
  locale text DEFAULT 'nl' CHECK (locale IN ('nl', 'en')),
  invoice_payment_terms text DEFAULT 'Betaling binnen 14 dagen',
  invoice_due_days int DEFAULT 14,
  invoice_footer text,
  invoice_next_number int DEFAULT 1,
  quote_next_number int DEFAULT 1,
  quote_valid_days int DEFAULT 30,
  tax_export_pin text,
  created_at timestamptz DEFAULT now()
);

-- Users
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  company_id uuid REFERENCES companies(id) NOT NULL,
  email text NOT NULL,
  full_name text,
  role text DEFAULT 'owner' CHECK (role IN ('owner', 'member')),
  locale text DEFAULT 'nl',
  created_at timestamptz DEFAULT now()
);

-- Services
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) NOT NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  price_type text DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'hourly')),
  vat_rate numeric(4,2) DEFAULT 21.00,
  is_archived boolean DEFAULT false,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Clients
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  company_name text,
  address text,
  city text,
  postcode text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Quotes
CREATE TABLE quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) NOT NULL,
  created_by uuid REFERENCES users(id),
  client_id uuid REFERENCES clients(id),
  quote_number text NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'lost')),
  client_name text NOT NULL,
  client_email text,
  subtotal numeric(10,2) DEFAULT 0,
  vat_total numeric(10,2) DEFAULT 0,
  discount_amount numeric(10,2) DEFAULT 0,
  total numeric(10,2) DEFAULT 0,
  notes text,
  valid_until date,
  payment_terms text,
  deposit_note text,
  followup_date date,
  share_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  ai_talking_point text,
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  accepted_at timestamptz
);

-- Quote lines
CREATE TABLE quote_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES quotes(id) ON DELETE CASCADE NOT NULL,
  service_id uuid REFERENCES services(id),
  description text NOT NULL,
  quantity numeric(10,2) DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  vat_rate numeric(4,2) DEFAULT 21.00,
  total numeric(10,2) NOT NULL,
  sort_order int DEFAULT 0
);

-- Quote events
CREATE TABLE quote_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES quotes(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  actor text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Invoices
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) NOT NULL,
  quote_id uuid REFERENCES quotes(id),
  client_id uuid REFERENCES clients(id),
  invoice_number text NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  client_name text NOT NULL,
  client_email text,
  subtotal numeric(10,2) DEFAULT 0,
  vat_total numeric(10,2) DEFAULT 0,
  total numeric(10,2) DEFAULT 0,
  issued_date date DEFAULT CURRENT_DATE,
  due_date date,
  paid_date date,
  mollie_payment_id text,
  mollie_payment_url text,
  notes text,
  share_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz DEFAULT now()
);

-- Invoice lines
CREATE TABLE invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  quantity numeric(10,2) DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  vat_rate numeric(4,2) DEFAULT 21.00,
  total numeric(10,2) NOT NULL,
  sort_order int DEFAULT 0
);

-- Appointments
CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) NOT NULL,
  client_id uuid REFERENCES clients(id),
  quote_id uuid REFERENCES quotes(id),
  title text NOT NULL,
  description text,
  type text DEFAULT 'meeting' CHECK (type IN ('meeting', 'call', 'deadline', 'followup', 'other')),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  location text,
  meeting_url text,
  is_booked_externally boolean DEFAULT false,
  client_name text,
  client_email text,
  created_at timestamptz DEFAULT now()
);

-- Availability slots
CREATE TABLE availability_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) NOT NULL,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true
);

-- Billing events
CREATE TABLE billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) NOT NULL,
  event_type text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- Company policy: users see their own company
CREATE POLICY "Users see own company" ON companies
  FOR ALL USING (id = (SELECT company_id FROM users WHERE id = auth.uid()));

-- Users policy
CREATE POLICY "Users see own company users" ON users
  FOR ALL USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

-- Standard company_id policies for main tables
CREATE POLICY "Users see own company services" ON services
  FOR ALL USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users see own company clients" ON clients
  FOR ALL USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users see own company quotes" ON quotes
  FOR ALL USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users see own company invoices" ON invoices
  FOR ALL USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users see own company appointments" ON appointments
  FOR ALL USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users see own company availability" ON availability_slots
  FOR ALL USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users see own company billing" ON billing_events
  FOR ALL USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

-- Chain through parent for line items and events
CREATE POLICY "Users see own quote lines" ON quote_lines
  FOR ALL USING (
    quote_id IN (SELECT id FROM quotes WHERE company_id = (SELECT company_id FROM users WHERE id = auth.uid()))
  );

CREATE POLICY "Users see own quote events" ON quote_events
  FOR ALL USING (
    quote_id IN (SELECT id FROM quotes WHERE company_id = (SELECT company_id FROM users WHERE id = auth.uid()))
  );

CREATE POLICY "Users see own invoice lines" ON invoice_lines
  FOR ALL USING (
    invoice_id IN (SELECT id FROM invoices WHERE company_id = (SELECT company_id FROM users WHERE id = auth.uid()))
  );

-- Indexes
CREATE INDEX idx_quotes_company_status ON quotes(company_id, status);
CREATE INDEX idx_quotes_share_token ON quotes(share_token);
CREATE INDEX idx_invoices_company_status ON invoices(company_id, status);
CREATE INDEX idx_invoices_share_token ON invoices(share_token);
CREATE INDEX idx_appointments_company_start ON appointments(company_id, start_time);
CREATE INDEX idx_clients_company ON clients(company_id);
CREATE INDEX idx_services_company ON services(company_id);
