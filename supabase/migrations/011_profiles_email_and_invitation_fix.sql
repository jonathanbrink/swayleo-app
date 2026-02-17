-- Swayleo Migration 011: Add email to profiles + Fix invitation email comparison
-- Run in Supabase SQL Editor

-- ============================================
-- 1. ADD EMAIL COLUMN TO PROFILES
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Populate email from auth.users for all existing profiles
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND p.email IS NULL;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================
-- 2. UPDATE handle_new_user() TO INCLUDE EMAIL
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'account_manager'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. FIX accept_invitation() CASE-SENSITIVE EMAIL
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

  -- Check if email matches current user (case-insensitive)
  IF LOWER(invite.email) != LOWER((SELECT email FROM auth.users WHERE id = auth.uid())) THEN
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
-- 4. UPDATE PROFILES RLS TO ALLOW EMAIL READS
-- ============================================
-- Ensure org members can see each other's profiles (including email)
-- This is needed for the team members page
DROP POLICY IF EXISTS "Users can view profiles in their org" ON profiles;
CREATE POLICY "Users can view profiles in their org"
  ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR org_id IN (
      SELECT org_id FROM organization_members WHERE user_id = auth.uid()
    )
    OR id IN (
      SELECT om2.user_id FROM organization_members om1
      JOIN organization_members om2 ON om1.org_id = om2.org_id
      WHERE om1.user_id = auth.uid()
    )
  );
