-- Zuklo Database Schema
-- Filters, Device Tokens, Notifications + extra property columns

-- =============================================
-- ADD NEW COLUMNS TO PROPERTIES
-- =============================================
ALTER TABLE properties ADD COLUMN IF NOT EXISTS expenses NUMERIC DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_per_sqm NUMERIC DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS full_address TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_rooms INTEGER DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS covered_area NUMERIC DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS land_area NUMERIC DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS parking_spaces INTEGER DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS floor INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_floors INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS year_built INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pet_types TEXT[] DEFAULT '{}';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS min_contract_months INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS allowed_for_students BOOLEAN;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS allowed_for_pets BOOLEAN;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS main_image TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS landlord_type TEXT DEFAULT 'owner';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS parsed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Location index
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties (lat, lng);

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
-- TRIGGERS
-- =============================================

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
