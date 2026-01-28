-- Swayleo Client Portal v0.0.8
-- Run this AFTER 007_billing_usage.sql in your Supabase SQL Editor

-- ============================================
-- CLIENT ACCESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS client_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  access_level TEXT NOT NULL DEFAULT 'view' CHECK (access_level IN ('view', 'review', 'approve')),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ, -- NULL = never expires
  last_accessed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(brand_id, email)
);

CREATE INDEX IF NOT EXISTS idx_client_access_brand ON client_access(brand_id);
CREATE INDEX IF NOT EXISTS idx_client_access_email ON client_access(email);
CREATE INDEX IF NOT EXISTS idx_client_access_token ON client_access(token);

-- ============================================
-- EMAIL APPROVALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  saved_email_id UUID NOT NULL REFERENCES saved_emails(id) ON DELETE CASCADE,
  client_access_id UUID NOT NULL REFERENCES client_access(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested')),
  feedback TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(saved_email_id, client_access_id)
);

CREATE INDEX IF NOT EXISTS idx_email_approvals_email ON email_approvals(saved_email_id);
CREATE INDEX IF NOT EXISTS idx_email_approvals_client ON email_approvals(client_access_id);
CREATE INDEX IF NOT EXISTS idx_email_approvals_status ON email_approvals(status);

-- Add updated_at trigger
CREATE TRIGGER update_email_approvals_updated_at
  BEFORE UPDATE ON email_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ADD APPROVAL STATUS TO SAVED EMAILS
-- ============================================
ALTER TABLE saved_emails 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'draft' 
CHECK (approval_status IN ('draft', 'pending', 'approved', 'rejected', 'revision_requested'));

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE client_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_approvals ENABLE ROW LEVEL SECURITY;

-- Client access policies (org members can manage)
CREATE POLICY "Org members can view client access"
  ON client_access FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brands b 
      WHERE b.id = client_access.brand_id 
      AND is_org_member(b.org_id)
    )
  );

CREATE POLICY "Org members can create client access"
  ON client_access FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM brands b 
      WHERE b.id = client_access.brand_id 
      AND is_org_member(b.org_id)
    )
  );

CREATE POLICY "Org members can update client access"
  ON client_access FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM brands b 
      WHERE b.id = client_access.brand_id 
      AND is_org_member(b.org_id)
    )
  );

CREATE POLICY "Org members can delete client access"
  ON client_access FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM brands b 
      WHERE b.id = client_access.brand_id 
      AND is_org_member(b.org_id)
    )
  );

-- Email approval policies
CREATE POLICY "Org members can view approvals"
  ON email_approvals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM saved_emails se
      JOIN brands b ON b.id = se.brand_id
      WHERE se.id = email_approvals.saved_email_id
      AND is_org_member(b.org_id)
    )
  );

CREATE POLICY "Clients can view their approvals"
  ON email_approvals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_access ca
      WHERE ca.id = email_approvals.client_access_id
    )
  );

CREATE POLICY "Clients can update their approvals"
  ON email_approvals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM client_access ca
      WHERE ca.id = email_approvals.client_access_id
    )
  );

-- ============================================
-- CLIENT PORTAL FUNCTIONS
-- ============================================

-- Validate client token and get access
CREATE OR REPLACE FUNCTION validate_client_token(access_token TEXT)
RETURNS JSON AS $$
DECLARE
  client_record RECORD;
BEGIN
  SELECT 
    ca.*,
    b.name as brand_name,
    b.org_id
  INTO client_record
  FROM client_access ca
  JOIN brands b ON b.id = ca.brand_id
  WHERE ca.token = access_token
  AND (ca.expires_at IS NULL OR ca.expires_at > now());
  
  IF client_record IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Update last accessed
  UPDATE client_access SET last_accessed_at = now() WHERE token = access_token;
  
  RETURN json_build_object(
    'id', client_record.id,
    'brand_id', client_record.brand_id,
    'brand_name', client_record.brand_name,
    'email', client_record.email,
    'name', client_record.name,
    'access_level', client_record.access_level
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get brand for client portal (limited data)
CREATE OR REPLACE FUNCTION get_client_brand(access_token TEXT)
RETURNS JSON AS $$
DECLARE
  client_data JSON;
  brand_data JSON;
BEGIN
  -- Validate token first
  client_data := validate_client_token(access_token);
  IF client_data IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT json_build_object(
    'id', b.id,
    'name', b.name,
    'website_url', b.website_url,
    'vertical', b.vertical,
    'brand_kit', CASE WHEN bk.brand_id IS NOT NULL THEN
      json_build_object(
        'brand_identity', json_build_object(
          'values_themes', bk.brand_identity->>'values_themes',
          'brand_story', bk.brand_identity->>'brand_story'
        ),
        'brand_voice', json_build_object(
          'voice_description', bk.brand_voice->>'voice_description'
        ),
        'is_complete', bk.is_complete
      )
    ELSE NULL END
  ) INTO brand_data
  FROM brands b
  LEFT JOIN brand_kits bk ON bk.brand_id = b.id
  WHERE b.id = (client_data->>'brand_id')::uuid;
  
  RETURN brand_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get emails for client portal
CREATE OR REPLACE FUNCTION get_client_emails(access_token TEXT)
RETURNS JSON AS $$
DECLARE
  client_data JSON;
  emails_data JSON;
BEGIN
  -- Validate token first
  client_data := validate_client_token(access_token);
  IF client_data IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT json_agg(e) INTO emails_data
  FROM (
    SELECT 
      se.id,
      se.name,
      se.email_type,
      se.subject_line,
      se.preview_text,
      se.body_content,
      se.cta_text,
      se.status,
      se.approval_status,
      se.created_at,
      (
        SELECT json_build_object(
          'id', ea.id,
          'status', ea.status,
          'feedback', ea.feedback,
          'approved_at', ea.approved_at,
          'updated_at', ea.updated_at
        )
        FROM email_approvals ea
        WHERE ea.saved_email_id = se.id
        AND ea.client_access_id = (client_data->>'id')::uuid
      ) as approval
    FROM saved_emails se
    WHERE se.brand_id = (client_data->>'brand_id')::uuid
    AND se.status != 'draft' -- Only show non-draft emails
    ORDER BY se.created_at DESC
  ) e;
  
  RETURN COALESCE(emails_data, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Submit email approval
CREATE OR REPLACE FUNCTION submit_email_approval(
  access_token TEXT,
  email_id UUID,
  approval_status TEXT,
  approval_feedback TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  client_data JSON;
  access_level TEXT;
  approval_record RECORD;
BEGIN
  -- Validate token
  client_data := validate_client_token(access_token);
  IF client_data IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired access token';
  END IF;
  
  -- Check access level
  access_level := client_data->>'access_level';
  IF access_level != 'approve' THEN
    RAISE EXCEPTION 'You do not have permission to approve emails';
  END IF;
  
  -- Validate email belongs to this brand
  IF NOT EXISTS (
    SELECT 1 FROM saved_emails 
    WHERE id = email_id 
    AND brand_id = (client_data->>'brand_id')::uuid
  ) THEN
    RAISE EXCEPTION 'Email not found';
  END IF;
  
  -- Upsert approval
  INSERT INTO email_approvals (saved_email_id, client_access_id, status, feedback, approved_at)
  VALUES (
    email_id,
    (client_data->>'id')::uuid,
    approval_status,
    approval_feedback,
    CASE WHEN approval_status = 'approved' THEN now() ELSE NULL END
  )
  ON CONFLICT (saved_email_id, client_access_id) 
  DO UPDATE SET
    status = approval_status,
    feedback = approval_feedback,
    approved_at = CASE WHEN approval_status = 'approved' THEN now() ELSE NULL END,
    updated_at = now()
  RETURNING * INTO approval_record;
  
  -- Update saved_email approval status
  UPDATE saved_emails 
  SET approval_status = approval_status
  WHERE id = email_id;
  
  RETURN json_build_object(
    'id', approval_record.id,
    'status', approval_record.status,
    'feedback', approval_record.feedback,
    'approved_at', approval_record.approved_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- AUDIT LOGGING FOR CLIENT ACTIONS
-- ============================================
CREATE OR REPLACE FUNCTION log_approval_activity()
RETURNS TRIGGER AS $$
DECLARE
  brand_org_id UUID;
BEGIN
  -- Get org_id from the brand
  SELECT b.org_id INTO brand_org_id
  FROM saved_emails se
  JOIN brands b ON b.id = se.brand_id
  WHERE se.id = NEW.saved_email_id;
  
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    INSERT INTO audit_logs (org_id, user_id, action, entity_type, entity_id, metadata)
    VALUES (
      brand_org_id,
      NULL, -- Client actions don't have user_id
      CASE 
        WHEN NEW.status = 'approved' THEN 'approved'
        WHEN NEW.status = 'rejected' THEN 'rejected'
        WHEN NEW.status = 'revision_requested' THEN 'revision_requested'
        ELSE 'reviewed'
      END,
      'email',
      NEW.saved_email_id,
      jsonb_build_object('client_access_id', NEW.client_access_id, 'feedback', NEW.feedback)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_email_approvals ON email_approvals;
CREATE TRIGGER audit_email_approvals
  AFTER INSERT OR UPDATE ON email_approvals
  FOR EACH ROW EXECUTE FUNCTION log_approval_activity();
