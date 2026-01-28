-- Swayleo Database Schema v0.0.1
-- Run this in your Supabase SQL Editor

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ORGANIZATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id),
  full_name TEXT,
  role TEXT DEFAULT 'account_manager' CHECK (role IN ('account_manager', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- BRANDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website_url TEXT,
  vertical TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brands_org ON brands(org_id);
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);

-- ============================================
-- BRAND KITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS brand_kits (
  brand_id UUID PRIMARY KEY REFERENCES brands(id) ON DELETE CASCADE,
  brand_identity JSONB DEFAULT '{
    "values_themes": "",
    "brand_story": "",
    "desired_feeling": "",
    "cultural_influences": ""
  }'::jsonb,
  product_differentiation JSONB DEFAULT '{
    "unique_aspects": "",
    "best_sellers": "",
    "features_to_emphasize": ""
  }'::jsonb,
  customer_audience JSONB DEFAULT '{
    "ideal_customer": "",
    "day_to_day": "",
    "brands_they_buy": ""
  }'::jsonb,
  brand_voice JSONB DEFAULT '{
    "voice_description": "",
    "words_to_avoid": "",
    "reference_brands": ""
  }'::jsonb,
  marketing_strategy JSONB DEFAULT '{
    "competitors": "",
    "planned_launches": "",
    "has_review_platform": false,
    "review_platform": "",
    "welcome_incentives": "",
    "international_shipping": false,
    "return_policy": ""
  }'::jsonb,
  design_preferences JSONB DEFAULT '{
    "brands_liked_visually": "",
    "design_elements": "",
    "moodboard_link": ""
  }'::jsonb,
  is_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- MOODBOARD ASSETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS moodboard_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moodboard_brand ON moodboard_assets(brand_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get user's org_id from JWT
CREATE OR REPLACE FUNCTION auth.org_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (SELECT org_id FROM profiles WHERE id = auth.uid()),
    NULL
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to automatically create brand_kit when brand is created
CREATE OR REPLACE FUNCTION create_brand_kit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO brand_kits (brand_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_brand_created
  AFTER INSERT ON brands
  FOR EACH ROW
  EXECUTE FUNCTION create_brand_kit();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_brand_kits_updated_at
  BEFORE UPDATE ON brand_kits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE moodboard_assets ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (id = auth.org_id());

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Brands policies
CREATE POLICY "Users can view brands in their org"
  ON brands FOR SELECT
  USING (org_id = auth.org_id());

CREATE POLICY "Users can create brands in their org"
  ON brands FOR INSERT
  WITH CHECK (org_id = auth.org_id());

CREATE POLICY "Users can update brands in their org"
  ON brands FOR UPDATE
  USING (org_id = auth.org_id());

CREATE POLICY "Users can delete brands in their org"
  ON brands FOR DELETE
  USING (org_id = auth.org_id());

-- Brand kits policies
CREATE POLICY "Users can view brand kits in their org"
  ON brand_kits FOR SELECT
  USING (brand_id IN (SELECT id FROM brands WHERE org_id = auth.org_id()));

CREATE POLICY "Users can update brand kits in their org"
  ON brand_kits FOR UPDATE
  USING (brand_id IN (SELECT id FROM brands WHERE org_id = auth.org_id()));

-- Moodboard assets policies
CREATE POLICY "Users can view moodboard assets in their org"
  ON moodboard_assets FOR SELECT
  USING (brand_id IN (SELECT id FROM brands WHERE org_id = auth.org_id()));

CREATE POLICY "Users can create moodboard assets in their org"
  ON moodboard_assets FOR INSERT
  WITH CHECK (brand_id IN (SELECT id FROM brands WHERE org_id = auth.org_id()));

CREATE POLICY "Users can delete moodboard assets in their org"
  ON moodboard_assets FOR DELETE
  USING (brand_id IN (SELECT id FROM brands WHERE org_id = auth.org_id()));

-- ============================================
-- STORAGE BUCKET
-- ============================================
-- Run this separately in Supabase Dashboard > Storage

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('moodboards', 'moodboards', false);

-- Storage policies (run in SQL editor)
-- CREATE POLICY "Users can upload to their org folder"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'moodboards' AND
--     (storage.foldername(name))[1] = auth.org_id()::text
--   );

-- CREATE POLICY "Users can view their org files"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'moodboards' AND
--     (storage.foldername(name))[1] = auth.org_id()::text
--   );

-- CREATE POLICY "Users can delete their org files"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'moodboards' AND
--     (storage.foldername(name))[1] = auth.org_id()::text
--   );
