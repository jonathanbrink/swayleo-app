-- Swayleo User Setup v0.0.1
-- Run this AFTER 001_initial_schema.sql in your Supabase SQL Editor

-- ============================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    'account_manager'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- STORAGE BUCKET & POLICIES
-- Run these commands in Supabase Dashboard
-- ============================================

-- Step 1: Create the bucket via Dashboard or this SQL:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'moodboards', 
  'moodboards', 
  false,
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Storage policies for moodboards bucket
CREATE POLICY "Authenticated users can upload to their org folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'moodboards' AND
    (storage.foldername(name))[1] = (SELECT org_id::text FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view their org files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'moodboards' AND
    (storage.foldername(name))[1] = (SELECT org_id::text FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete their org files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'moodboards' AND
    (storage.foldername(name))[1] = (SELECT org_id::text FROM profiles WHERE id = auth.uid())
  );

-- ============================================
-- DEMO ORGANIZATION (for first-time setup)
-- ============================================
-- Uncomment and run to create a demo organization:

-- INSERT INTO organizations (name) VALUES ('Demo Agency');

-- After a user signs up, link them to the org:
-- UPDATE profiles 
-- SET org_id = (SELECT id FROM organizations WHERE name = 'Demo Agency')
-- WHERE id = 'USER_UUID_HERE';
