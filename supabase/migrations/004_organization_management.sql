-- Swayleo Organization Management v0.0.3
-- Run this AFTER 003_saved_emails.sql in your Supabase SQL Editor

-- ============================================
-- UPDATE ORGANIZATIONS TABLE
-- ============================================
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Generate slugs for existing orgs
UPDATE organizations 
SET slug = LOWER(REPLACE(name, ' ', '-')) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL;

-- Make slug required going forward
ALTER TABLE organizations ALTER COLUMN slug SET NOT NULL;

-- ============================================
-- ORGANIZATION MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);

-- ============================================
-- INVITATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, email)
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================
-- UPDATE PROFILES TABLE
-- ============================================
-- Remove org_id from profiles (now using organization_members)
-- Keep for backward compatibility but will migrate to members table

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get user's primary organization (first one they're a member of)
CREATE OR REPLACE FUNCTION auth.user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM organization_members 
  WHERE user_id = auth.uid() 
  ORDER BY joined_at ASC 
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if user is member of an org
CREATE OR REPLACE FUNCTION is_org_member(check_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM organization_members 
    WHERE org_id = check_org_id AND user_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if user is admin/owner of an org
CREATE OR REPLACE FUNCTION is_org_admin(check_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM organization_members 
    WHERE org_id = check_org_id 
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Get user's role in an org
CREATE OR REPLACE FUNCTION get_org_role(check_org_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM organization_members 
  WHERE org_id = check_org_id AND user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- ORGANIZATION CREATION FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION create_organization(
  org_name TEXT,
  org_slug TEXT DEFAULT NULL
)
RETURNS organizations AS $$
DECLARE
  new_org organizations;
  final_slug TEXT;
BEGIN
  -- Generate slug if not provided
  IF org_slug IS NULL THEN
    final_slug := LOWER(REGEXP_REPLACE(org_name, '[^a-zA-Z0-9]', '-', 'g'));
    -- Add random suffix to ensure uniqueness
    final_slug := final_slug || '-' || SUBSTRING(gen_random_uuid()::text, 1, 8);
  ELSE
    final_slug := org_slug;
  END IF;

  -- Create organization
  INSERT INTO organizations (name, slug)
  VALUES (org_name, final_slug)
  RETURNING * INTO new_org;

  -- Add creator as owner
  INSERT INTO organization_members (org_id, user_id, role)
  VALUES (new_org.id, auth.uid(), 'owner');

  -- Update user's profile with org_id (for backward compatibility)
  UPDATE profiles SET org_id = new_org.id WHERE id = auth.uid();

  RETURN new_org;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INVITATION ACCEPTANCE FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION accept_invitation(invite_token TEXT)
RETURNS organization_members AS $$
DECLARE
  invite invitations;
  new_member organization_members;
BEGIN
  -- Find valid invitation
  SELECT * INTO invite FROM invitations 
  WHERE token = invite_token 
  AND accepted_at IS NULL 
  AND expires_at > now();

  IF invite IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  -- Check if email matches current user
  IF invite.email != (SELECT email FROM auth.users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Invitation was sent to a different email address';
  END IF;

  -- Add user to organization
  INSERT INTO organization_members (org_id, user_id, role, invited_by, invited_at)
  VALUES (invite.org_id, auth.uid(), invite.role, invite.invited_by, invite.created_at)
  ON CONFLICT (org_id, user_id) DO UPDATE SET role = EXCLUDED.role
  RETURNING * INTO new_member;

  -- Mark invitation as accepted
  UPDATE invitations SET accepted_at = now() WHERE id = invite.id;

  -- Update user's profile with org_id (for backward compatibility)
  UPDATE profiles SET org_id = invite.org_id WHERE id = auth.uid() AND org_id IS NULL;

  RETURN new_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Organization members policies
CREATE POLICY "Users can view members of their orgs"
  ON organization_members FOR SELECT
  USING (is_org_member(org_id));

CREATE POLICY "Admins can add members to their orgs"
  ON organization_members FOR INSERT
  WITH CHECK (is_org_admin(org_id));

CREATE POLICY "Admins can update members in their orgs"
  ON organization_members FOR UPDATE
  USING (is_org_admin(org_id));

CREATE POLICY "Admins can remove members from their orgs"
  ON organization_members FOR DELETE
  USING (is_org_admin(org_id) AND user_id != auth.uid()); -- Can't remove yourself

-- Invitations policies
CREATE POLICY "Users can view invitations for their orgs"
  ON invitations FOR SELECT
  USING (is_org_member(org_id) OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (is_org_admin(org_id));

CREATE POLICY "Admins can delete invitations"
  ON invitations FOR DELETE
  USING (is_org_admin(org_id));

-- Audit logs policies
CREATE POLICY "Members can view audit logs for their orgs"
  ON audit_logs FOR SELECT
  USING (is_org_member(org_id));

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (is_org_member(org_id));

-- Update organizations policy
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (is_org_member(id));

CREATE POLICY "Admins can update their organizations"
  ON organizations FOR UPDATE
  USING (is_org_admin(id));

-- ============================================
-- MIGRATE EXISTING DATA
-- ============================================
-- Move existing profile org_id relationships to organization_members
INSERT INTO organization_members (org_id, user_id, role, joined_at)
SELECT org_id, id, 
  CASE WHEN role = 'admin' THEN 'admin' ELSE 'member' END,
  created_at
FROM profiles 
WHERE org_id IS NOT NULL
ON CONFLICT (org_id, user_id) DO NOTHING;

-- Make first member of each org the owner
UPDATE organization_members om
SET role = 'owner'
WHERE om.id IN (
  SELECT DISTINCT ON (org_id) id 
  FROM organization_members 
  ORDER BY org_id, joined_at ASC
);
