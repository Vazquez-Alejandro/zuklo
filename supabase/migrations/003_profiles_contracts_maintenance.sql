-- Zuklo Database Schema
-- Properties, Filters, Device Tokens, Notifications, Profiles, Contracts, Maintenance

-- =============================================
-- PROPERTIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  portal TEXT NOT NULL,
  portal_id TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  expenses NUMERIC DEFAULT 0,
  price_per_sqm NUMERIC DEFAULT 0,
  address TEXT,
  full_address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  zip TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  total_rooms INTEGER DEFAULT 0,
  area NUMERIC DEFAULT 0,
  area_unit TEXT DEFAULT 'sqft',
  covered_area NUMERIC DEFAULT 0,
  land_area NUMERIC DEFAULT 0,
  parking_spaces INTEGER DEFAULT 0,
  floor INTEGER,
  total_floors INTEGER,
  year_built INTEGER,
  furnished BOOLEAN,
  pet_friendly BOOLEAN,
  pet_types TEXT[] DEFAULT '{}',
  min_contract_months INTEGER,
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  main_image TEXT,
  landlord_name TEXT,
  landlord_phone TEXT,
  landlord_email TEXT,
  landlord_type TEXT DEFAULT 'owner',
  published_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  parsed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  content_hash TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_dedup ON properties (portal, portal_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_url_dedup ON properties (url);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties (city);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties (price);
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms ON properties (bedrooms);
CREATE INDEX IF NOT EXISTS idx_properties_portal ON properties (portal);
CREATE INDEX IF NOT EXISTS idx_properties_country ON properties (country);
CREATE INDEX IF NOT EXISTS idx_properties_created ON properties (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties (lat, lng);

-- =============================================
-- USER FILTERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_filters (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  price_min NUMERIC,
  price_max NUMERIC,
  price_currency TEXT,
  expenses_max NUMERIC,
  cities TEXT[] DEFAULT '{}',
  states TEXT[] DEFAULT '{}',
  filter_country TEXT,
  radius_km NUMERIC,
  center_lat DOUBLE PRECISION,
  center_lng DOUBLE PRECISION,
  min_bedrooms INTEGER,
  max_bedrooms INTEGER,
  min_bathrooms INTEGER,
  max_bathrooms INTEGER,
  min_area NUMERIC,
  max_area NUMERIC,
  area_unit TEXT,
  min_parking_spaces INTEGER,
  pet_friendly BOOLEAN,
  furnished BOOLEAN,
  min_contract_months INTEGER,
  portals TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  exclude_keywords TEXT[] DEFAULT '{}',
  notification_enabled BOOLEAN DEFAULT true,
  notification_method TEXT DEFAULT 'push',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_filters_user ON user_filters (user_id);
CREATE INDEX IF NOT EXISTS idx_filters_active ON user_filters (is_active) WHERE is_active = true;

-- =============================================
-- DEVICE TOKENS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS device_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  platform TEXT DEFAULT 'web',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tokens_user ON device_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_active ON device_tokens (is_active) WHERE is_active = true;

-- =============================================
-- NOTIFICATION LOG TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS notification_logs (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id),
  filter_id TEXT NOT NULL REFERENCES user_filters(id),
  filter_name TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_property ON notification_logs (property_id);
CREATE INDEX IF NOT EXISTS idx_notifications_filter ON notification_logs (filter_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notification_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notification_logs (status);

-- =============================================
-- TENANT PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tenant_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  
  -- Personal Info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dni TEXT NOT NULL,
  cuil TEXT,
  date_of_birth DATE,
  nationality TEXT,
  marital_status TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  current_address TEXT,
  
  -- Employment
  employment_situation TEXT,
  company_name TEXT,
  position TEXT,
  seniority TEXT,
  monthly_income NUMERIC DEFAULT 0,
  payslip_available BOOLEAN DEFAULT false,
  contract_type TEXT,
  work_address TEXT,
  work_phone TEXT,
  
  -- Income
  primary_income NUMERIC DEFAULT 0,
  secondary_income NUMERIC DEFAULT 0,
  total_income NUMERIC DEFAULT 0,
  income_source TEXT,
  bank_statements BOOLEAN DEFAULT false,
  tax_returns BOOLEAN DEFAULT false,
  
  -- Guarantor
  has_guarantor BOOLEAN DEFAULT false,
  guarantor_name TEXT,
  guarantor_dni TEXT,
  guarantor_phone TEXT,
  guarantor_email TEXT,
  guarantor_relationship TEXT,
  guarantor_address TEXT,
  guarantor_company TEXT,
  guarantor_monthly_income NUMERIC DEFAULT 0,
  guarantor_is_corporate BOOLEAN DEFAULT false,
  guarantor_corporate_name TEXT,
  guarantor_corporate_cuit TEXT,
  
  -- Co-habitants (JSON array)
  co_habitants JSONB DEFAULT '[]',
  
  -- Pets (JSON array)
  pets JSONB DEFAULT '[]',
  
  -- References (JSON array)
  references JSONB DEFAULT '[]',
  
  -- Rental History (JSON array)
  rental_history JSONB DEFAULT '[]',
  
  -- Documents (URLs)
  dni_front TEXT,
  dni_back TEXT,
  proof_of_income TEXT,
  proof_of_address TEXT,
  criminal_record TEXT,
  credit_report TEXT,
  
  -- Metadata
  completed_at TIMESTAMPTZ,
  is_verified BOOLEAN DEFAULT false,
  verification_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user ON tenant_profiles (user_id);

-- =============================================
-- CONTRACTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  property_id TEXT,
  
  -- Landlord
  landlord_name TEXT NOT NULL,
  landlord_dni TEXT,
  landlord_phone TEXT,
  landlord_email TEXT,
  
  -- Property
  property_address TEXT,
  property_city TEXT,
  property_province TEXT,
  property_country TEXT,
  property_surface NUMERIC,
  property_rooms INTEGER,
  
  -- Financials
  monthly_rent NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ARS',
  deposit NUMERIC DEFAULT 0,
  expenses NUMERIC DEFAULT 0,
  expenses_due_day INTEGER DEFAULT 1,
  rent_due_day INTEGER DEFAULT 1,
  payment_method TEXT,
  bank_account TEXT,
  
  -- Terms
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_months INTEGER NOT NULL,
  renewal_type TEXT DEFAULT 'automatic',
  notice_period_days INTEGER DEFAULT 30,
  early_termination_penalty NUMERIC DEFAULT 0,
  
  -- Indexation
  indexation_type TEXT DEFAULT 'ipc',
  custom_percentage NUMERIC,
  base_index_value NUMERIC,
  base_index_date DATE,
  last_adjustment_date DATE,
  next_adjustment_date DATE,
  
  -- Adjustments (JSON array)
  adjustments JSONB DEFAULT '[]',
  
  -- Status
  status TEXT DEFAULT 'pending',
  
  -- Metadata
  signed_at TIMESTAMPTZ,
  contract_document_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_user ON contracts (user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts (status);
CREATE INDEX IF NOT EXISTS idx_contracts_dates ON contracts (start_date, end_date);

-- =============================================
-- MAINTENANCE EXPENSES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS maintenance_expenses (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES contracts(id),
  user_id TEXT NOT NULL,
  
  -- Category
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT NOT NULL,
  
  -- Amount
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ARS',
  expense_date DATE NOT NULL,
  
  -- Provider
  provider_name TEXT,
  provider_phone TEXT,
  provider_email TEXT,
  provider_company TEXT,
  provider_invoice_number TEXT,
  
  -- Photos (JSON array of URLs)
  photos JSONB DEFAULT '[]',
  invoice_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  reimbursed_at TIMESTAMPTZ,
  
  -- Recurring
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_contract ON maintenance_expenses (contract_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_user ON maintenance_expenses (user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_expenses (status);
CREATE INDEX IF NOT EXISTS idx_maintenance_category ON maintenance_expenses (category);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON maintenance_expenses (expense_date DESC);

-- =============================================
-- SCRAPING JOBS LOG TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS scraping_jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  portal TEXT,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  total_properties INTEGER DEFAULT 0,
  new_properties INTEGER DEFAULT 0,
  matched_filters INTEGER DEFAULT 0,
  notifications_sent INTEGER DEFAULT 0,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs (status);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_created ON scraping_jobs (created_at DESC);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_filters_updated_at
  BEFORE UPDATE ON user_filters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON tenant_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_maintenance_updated_at
  BEFORE UPDATE ON maintenance_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
