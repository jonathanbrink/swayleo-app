-- Swayleo Saved Emails v0.0.2
-- Run this AFTER 002_user_setup.sql in your Supabase SQL Editor

-- ============================================
-- SAVED EMAILS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS saved_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  name TEXT NOT NULL,
  subject_line TEXT NOT NULL,
  preview_text TEXT,
  body_content TEXT NOT NULL,
  cta_text TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'exported')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_emails_brand ON saved_emails(brand_id);
CREATE INDEX IF NOT EXISTS idx_saved_emails_status ON saved_emails(status);

-- Add updated_at trigger
CREATE TRIGGER update_saved_emails_updated_at
  BEFORE UPDATE ON saved_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE saved_emails ENABLE ROW LEVEL SECURITY;

-- Saved emails policies (access via brand's org)
CREATE POLICY "Users can view saved emails in their org"
  ON saved_emails FOR SELECT
  USING (brand_id IN (SELECT id FROM brands WHERE org_id = auth.org_id()));

CREATE POLICY "Users can create saved emails in their org"
  ON saved_emails FOR INSERT
  WITH CHECK (brand_id IN (SELECT id FROM brands WHERE org_id = auth.org_id()));

CREATE POLICY "Users can update saved emails in their org"
  ON saved_emails FOR UPDATE
  USING (brand_id IN (SELECT id FROM brands WHERE org_id = auth.org_id()));

CREATE POLICY "Users can delete saved emails in their org"
  ON saved_emails FOR DELETE
  USING (brand_id IN (SELECT id FROM brands WHERE org_id = auth.org_id()));

-- ============================================
-- GENERATION LOGS TABLE (Optional - for tracking usage)
-- ============================================
CREATE TABLE IF NOT EXISTS generation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  email_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generation_logs_brand ON generation_logs(brand_id);
CREATE INDEX IF NOT EXISTS idx_generation_logs_created ON generation_logs(created_at);

ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view generation logs in their org"
  ON generation_logs FOR SELECT
  USING (brand_id IN (SELECT id FROM brands WHERE org_id = auth.org_id()));

CREATE POLICY "Users can create generation logs in their org"
  ON generation_logs FOR INSERT
  WITH CHECK (brand_id IN (SELECT id FROM brands WHERE org_id = auth.org_id()));
