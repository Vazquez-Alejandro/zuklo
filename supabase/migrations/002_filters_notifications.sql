-- Zuklo Database Schema
-- Properties, Filters, Device Tokens, Notifications

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
  
  -- Location
  address TEXT,
  full_address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  zip TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  
  -- Features
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
  
  -- Restrictions
  furnished BOOLEAN,
  pet_friendly BOOLEAN,
  pet_types TEXT[] DEFAULT '{}',
  min_contract_months INTEGER,
  allowed_for_students BOOLEAN,
  allowed_for_pets BOOLEAN,
  
  -- Amenities
  amenities TEXT[] DEFAULT '{}',
  
  -- Media
  images TEXT[] DEFAULT '{}',
  main_image TEXT,
  
  -- Landlord
  landlord_name TEXT,
  landlord_phone TEXT,
  landlord_email TEXT,
  landlord_type TEXT DEFAULT 'owner',
  
  -- Timestamps
  published_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  parsed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Deduplication
  content_hash TEXT NOT NULL
);

-- Unique constraint for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_dedup 
  ON properties (portal, portal_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_url_dedup 
  ON properties (url);

-- Search indexes
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties (city);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties (price);
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms ON properties (bedrooms);
CREATE INDEX IF NOT EXISTS idx_properties_portal ON properties (portal);
CREATE INDEX IF NOT EXISTS idx_properties_country ON properties (country);
CREATE INDEX IF NOT EXISTS idx_properties_created ON properties (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties (lat, lng);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_properties_search 
  ON properties USING GIN (
    to_tsvector('spanish', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(address, ''))
  );

-- =============================================
-- USER FILTERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_filters (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  -- Price range
  price_min NUMERIC,
  price_max NUMERIC,
  price_currency TEXT,
  
  -- Expenses
  expenses_max NUMERIC,
  
  -- Location
  cities TEXT[] DEFAULT '{}',
  states TEXT[] DEFAULT '{}',
  filter_country TEXT,
  radius_km NUMERIC,
  center_lat DOUBLE PRECISION,
  center_lng DOUBLE PRECISION,
  
  -- Features
  min_bedrooms INTEGER,
  max_bedrooms INTEGER,
  min_bathrooms INTEGER,
  max_bathrooms INTEGER,
  min_area NUMERIC,
  max_area NUMERIC,
  area_unit TEXT,
  min_parking_spaces INTEGER,
  
  -- Restrictions
  pet_friendly BOOLEAN,
  furnished BOOLEAN,
  min_contract_months INTEGER,
  
  -- Portals
  portals TEXT[] DEFAULT '{}',
  
  -- Keywords
  keywords TEXT[] DEFAULT '{}',
  exclude_keywords TEXT[] DEFAULT '{}',
  
  -- Notification settings
  notification_enabled BOOLEAN DEFAULT true,
  notification_method TEXT DEFAULT 'push',
  
  -- Timestamps
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for properties
CREATE TRIGGER trigger_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger for user_filters
CREATE TRIGGER trigger_filters_updated_at
  BEFORE UPDATE ON user_filters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================
-- VIEWS
-- =============================================

-- Recent properties view
CREATE OR REPLACE VIEW recent_properties AS
SELECT 
  id,
  portal,
  title,
  price,
  currency,
  expenses,
  city,
  state,
  country,
  bedrooms,
  bathrooms,
  area,
  area_unit,
  amenities,
  main_image,
  pet_friendly,
  furnished,
  published_at,
  scraped_at
FROM properties
WHERE scraped_at > NOW() - INTERVAL '7 days'
ORDER BY scraped_at DESC;

-- Active filters with match stats
CREATE OR REPLACE VIEW active_filters_summary AS
SELECT 
  f.id,
  f.user_id,
  f.name,
  f.price_min,
  f.price_max,
  f.cities,
  f.notification_enabled,
  COUNT(n.id) as total_notifications,
  MAX(n.created_at) as last_notification
FROM user_filters f
LEFT JOIN notification_logs n ON f.id = n.filter_id
WHERE f.is_active = true
GROUP BY f.id;
