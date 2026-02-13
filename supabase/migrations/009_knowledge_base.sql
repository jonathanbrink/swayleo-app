-- Swayleo Knowledge Base v0.0.9
-- Run this AFTER 008_client_portal.sql in your Supabase SQL Editor

-- ============================================
-- KNOWLEDGE ENTRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('product', 'faq', 'competitor', 'persona', 'campaign_result', 'general')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_url TEXT,
  source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'web_research', 'import', 'campaign_result')),
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_entries_brand ON knowledge_entries(brand_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_category ON knowledge_entries(brand_id, category);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_source ON knowledge_entries(source_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_active ON knowledge_entries(brand_id, is_active);

-- Add updated_at trigger
CREATE TRIGGER update_knowledge_entries_updated_at
  BEFORE UPDATE ON knowledge_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE knowledge_entries ENABLE ROW LEVEL SECURITY;

-- Org members can view knowledge entries for their brands
CREATE POLICY "Org members can view knowledge entries"
  ON knowledge_entries FOR SELECT
  USING (
    brand_id IN (
      SELECT id FROM brands WHERE org_id IN (
        SELECT org_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

-- Org members can create knowledge entries for their brands
CREATE POLICY "Org members can create knowledge entries"
  ON knowledge_entries FOR INSERT
  WITH CHECK (
    brand_id IN (
      SELECT id FROM brands WHERE org_id IN (
        SELECT org_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

-- Org members can update knowledge entries for their brands
CREATE POLICY "Org members can update knowledge entries"
  ON knowledge_entries FOR UPDATE
  USING (
    brand_id IN (
      SELECT id FROM brands WHERE org_id IN (
        SELECT org_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

-- Org members can delete knowledge entries for their brands
CREATE POLICY "Org members can delete knowledge entries"
  ON knowledge_entries FOR DELETE
  USING (
    brand_id IN (
      SELECT id FROM brands WHERE org_id IN (
        SELECT org_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================
-- AUDIT LOGGING TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION log_knowledge_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (org_id, user_id, action, entity_type, entity_id, metadata)
    SELECT b.org_id, auth.uid(), 'created', 'knowledge_entry', NEW.id,
           jsonb_build_object('title', NEW.title, 'category', NEW.category)
    FROM brands b WHERE b.id = NEW.brand_id;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (org_id, user_id, action, entity_type, entity_id, metadata)
    SELECT b.org_id, auth.uid(), 'deleted', 'knowledge_entry', OLD.id,
           jsonb_build_object('title', OLD.title, 'category', OLD.category)
    FROM brands b WHERE b.id = OLD.brand_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_knowledge_entries
  AFTER INSERT OR DELETE ON knowledge_entries
  FOR EACH ROW
  EXECUTE FUNCTION log_knowledge_activity();

-- ============================================
-- ADD KB LIMITS TO PLAN_LIMITS TABLE
-- ============================================
ALTER TABLE plan_limits ADD COLUMN IF NOT EXISTS kb_entries_per_brand INTEGER DEFAULT 10;

UPDATE plan_limits SET kb_entries_per_brand = 10 WHERE tier = 'free';
UPDATE plan_limits SET kb_entries_per_brand = 10 WHERE tier = 'starter';
UPDATE plan_limits SET kb_entries_per_brand = 100 WHERE tier = 'professional';
UPDATE plan_limits SET kb_entries_per_brand = -1 WHERE tier = 'agency';

-- ============================================
-- KB ENTRY LIMIT ENFORCEMENT
-- ============================================
CREATE OR REPLACE FUNCTION check_kb_entries_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_entries INTEGER;
  brand_org_id UUID;
BEGIN
  -- Get the org_id for this brand
  SELECT org_id INTO brand_org_id FROM brands WHERE id = NEW.brand_id;

  -- Get current count for this brand
  SELECT COUNT(*) INTO current_count
  FROM knowledge_entries
  WHERE brand_id = NEW.brand_id AND is_active = true;

  -- Get the limit for this org's plan
  SELECT pl.kb_entries_per_brand INTO max_entries
  FROM subscriptions s
  JOIN plan_limits pl ON pl.tier = s.tier
  WHERE s.org_id = brand_org_id;

  -- -1 means unlimited
  IF max_entries >= 0 AND current_count >= max_entries THEN
    RAISE EXCEPTION 'Knowledge base entry limit reached (% of % allowed)', current_count, max_entries;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_kb_entries_limit
  BEFORE INSERT ON knowledge_entries
  FOR EACH ROW
  EXECUTE FUNCTION check_kb_entries_limit();
