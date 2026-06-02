-- Zuklo Database Schema
-- Properties table with deduplication support

CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  portal TEXT NOT NULL,
  portal_id TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Location
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  zip TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  
  -- Features
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  area NUMERIC DEFAULT 0,
  area_unit TEXT DEFAULT 'sqft',
  parking_spaces INTEGER,
  furnished BOOLEAN,
  pet_friendly BOOLEAN,
  
  -- Media
  images TEXT[] DEFAULT '{}',
  
  -- Landlord
  landlord_name TEXT,
  landlord_phone TEXT,
  landlord_email TEXT,
  
  -- Timestamps
  published_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_properties_search 
  ON properties USING GIN (
    to_tsvector('spanish', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(address, ''))
  );

-- Scraping jobs log
CREATE TABLE IF NOT EXISTS scraping_jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  portal TEXT,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  total_properties INTEGER DEFAULT 0,
  new_properties INTEGER DEFAULT 0,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs (status);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_created ON scraping_jobs (created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- View for recent properties
CREATE OR REPLACE VIEW recent_properties AS
SELECT 
  id,
  portal,
  title,
  price,
  currency,
  city,
  state,
  country,
  bedrooms,
  bathrooms,
  area,
  area_unit,
  images[1] as main_image,
  published_at,
  scraped_at
FROM properties
WHERE scraped_at > NOW() - INTERVAL '7 days'
ORDER BY scraped_at DESC;
