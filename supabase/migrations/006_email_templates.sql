-- Swayleo Email Template Library v0.0.5
-- Run this AFTER 005_analytics.sql in your Supabase SQL Editor

-- ============================================
-- EMAIL TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  email_type TEXT NOT NULL,
  
  -- Template configuration
  tone TEXT DEFAULT 'default' CHECK (tone IN ('default', 'more_casual', 'more_formal', 'more_urgent', 'more_playful')),
  max_length TEXT DEFAULT 'medium' CHECK (max_length IN ('short', 'medium', 'long')),
  include_emoji BOOLEAN DEFAULT true,
  subject_line_count INTEGER DEFAULT 3 CHECK (subject_line_count BETWEEN 1 AND 10),
  variation_count INTEGER DEFAULT 2 CHECK (variation_count BETWEEN 1 AND 5),
  
  -- Custom prompt additions
  custom_instructions TEXT,
  example_subject_lines JSONB DEFAULT '[]'::jsonb,
  example_cta TEXT,
  
  -- Metadata
  is_shared BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_org ON email_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(email_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_created_by ON email_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_email_templates_shared ON email_templates(is_shared) WHERE is_shared = true;

-- Add updated_at trigger
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Users can view their own templates and shared templates in their org
CREATE POLICY "Users can view own and shared templates"
  ON email_templates FOR SELECT
  USING (
    is_org_member(org_id) AND 
    (created_by = auth.uid() OR is_shared = true)
  );

-- Users can create templates in their org
CREATE POLICY "Users can create templates"
  ON email_templates FOR INSERT
  WITH CHECK (
    is_org_member(org_id) AND 
    created_by = auth.uid()
  );

-- Users can update their own templates, admins can update any
CREATE POLICY "Users can update own templates"
  ON email_templates FOR UPDATE
  USING (
    is_org_member(org_id) AND 
    (created_by = auth.uid() OR is_org_admin(org_id))
  );

-- Users can delete their own templates, admins can delete any
CREATE POLICY "Users can delete own templates"
  ON email_templates FOR DELETE
  USING (
    is_org_member(org_id) AND 
    (created_by = auth.uid() OR is_org_admin(org_id))
  );

-- ============================================
-- TEMPLATE FUNCTIONS
-- ============================================

-- Increment use count when template is used
CREATE OR REPLACE FUNCTION increment_template_use(template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE email_templates 
  SET use_count = use_count + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get popular templates for an org
CREATE OR REPLACE FUNCTION get_popular_templates(org_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_agg(t)
    FROM (
      SELECT 
        et.*,
        p.full_name as creator_name
      FROM email_templates et
      LEFT JOIN profiles p ON p.id = et.created_by
      WHERE et.org_id = org_uuid
      AND (et.created_by = auth.uid() OR et.is_shared = true)
      ORDER BY et.use_count DESC, et.created_at DESC
      LIMIT limit_count
    ) t
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- AUDIT TRIGGER FOR TEMPLATES
-- ============================================
CREATE OR REPLACE FUNCTION log_template_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (org_id, user_id, action, entity_type, entity_id, metadata)
    VALUES (NEW.org_id, auth.uid(), 'created', 'template', NEW.id, jsonb_build_object('name', NEW.name));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (org_id, user_id, action, entity_type, entity_id, metadata)
    VALUES (OLD.org_id, auth.uid(), 'deleted', 'template', OLD.id, jsonb_build_object('name', OLD.name));
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_email_templates ON email_templates;
CREATE TRIGGER audit_email_templates
  AFTER INSERT OR DELETE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION log_template_activity();
