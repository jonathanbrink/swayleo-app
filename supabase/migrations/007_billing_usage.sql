-- Swayleo Billing & Usage v0.0.7
-- Run this AFTER 006_email_templates.sql in your Supabase SQL Editor

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'professional', 'agency')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_customer_id);

-- Add updated_at trigger
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- USAGE RECORDS TABLE (Monthly snapshots)
-- ============================================
CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  emails_generated INTEGER DEFAULT 0,
  tokens_used BIGINT DEFAULT 0,
  brands_count INTEGER DEFAULT 0,
  members_count INTEGER DEFAULT 0,
  templates_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_usage_records_org ON usage_records(org_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_period ON usage_records(period_start, period_end);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Users can view their org subscription"
  ON subscriptions FOR SELECT
  USING (is_org_member(org_id));

CREATE POLICY "Only system can modify subscriptions"
  ON subscriptions FOR ALL
  USING (false); -- Managed via webhooks/admin only

-- Usage records policies
CREATE POLICY "Users can view their org usage"
  ON usage_records FOR SELECT
  USING (is_org_member(org_id));

-- ============================================
-- PLAN LIMITS (Stored in DB for flexibility)
-- ============================================
CREATE TABLE IF NOT EXISTS plan_limits (
  tier TEXT PRIMARY KEY,
  brands INTEGER NOT NULL,
  emails_per_month INTEGER NOT NULL,
  team_members INTEGER NOT NULL,
  templates INTEGER NOT NULL,
  api_access BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  custom_branding BOOLEAN DEFAULT false,
  advanced_analytics BOOLEAN DEFAULT false
);

-- Insert default limits (-1 = unlimited)
INSERT INTO plan_limits (tier, brands, emails_per_month, team_members, templates, api_access, priority_support, custom_branding, advanced_analytics)
VALUES 
  ('free', 1, 10, 1, 3, false, false, false, false),
  ('starter', 5, 100, 3, 20, false, false, false, false),
  ('professional', 25, 500, 10, 100, true, true, false, true),
  ('agency', -1, -1, -1, -1, true, true, true, true)
ON CONFLICT (tier) DO UPDATE SET
  brands = EXCLUDED.brands,
  emails_per_month = EXCLUDED.emails_per_month,
  team_members = EXCLUDED.team_members,
  templates = EXCLUDED.templates,
  api_access = EXCLUDED.api_access,
  priority_support = EXCLUDED.priority_support,
  custom_branding = EXCLUDED.custom_branding,
  advanced_analytics = EXCLUDED.advanced_analytics;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get current usage for an org
CREATE OR REPLACE FUNCTION get_current_usage(org_uuid UUID)
RETURNS JSON AS $$
DECLARE
  period_start_date DATE;
  result JSON;
BEGIN
  -- Get current billing period start (first of current month)
  period_start_date := date_trunc('month', CURRENT_DATE)::date;
  
  SELECT json_build_object(
    'emailsGenerated', COALESCE((
      SELECT COUNT(*) FROM saved_emails se
      JOIN brands b ON b.id = se.brand_id
      WHERE b.org_id = org_uuid
      AND se.created_at >= period_start_date
    ), 0),
    'tokensUsed', COALESCE((
      SELECT SUM(prompt_tokens + COALESCE(completion_tokens, 0))
      FROM generation_logs gl
      JOIN brands b ON b.id = gl.brand_id
      WHERE b.org_id = org_uuid
      AND gl.created_at >= period_start_date
    ), 0),
    'brandsCount', (SELECT COUNT(*) FROM brands WHERE org_id = org_uuid),
    'membersCount', (SELECT COUNT(*) FROM organization_members WHERE org_id = org_uuid),
    'templatesCount', (SELECT COUNT(*) FROM email_templates WHERE org_id = org_uuid)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get plan limits for an org
CREATE OR REPLACE FUNCTION get_org_limits(org_uuid UUID)
RETURNS JSON AS $$
DECLARE
  org_tier TEXT;
  result JSON;
BEGIN
  -- Get org's subscription tier
  SELECT COALESCE(s.tier, 'free') INTO org_tier
  FROM organizations o
  LEFT JOIN subscriptions s ON s.org_id = o.id
  WHERE o.id = org_uuid;
  
  SELECT json_build_object(
    'tier', org_tier,
    'brands', brands,
    'emailsPerMonth', emails_per_month,
    'teamMembers', team_members,
    'templates', templates,
    'apiAccess', api_access,
    'prioritySupport', priority_support,
    'customBranding', custom_branding,
    'advancedAnalytics', advanced_analytics
  ) INTO result
  FROM plan_limits
  WHERE tier = org_tier;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if org is within limits for a specific resource
CREATE OR REPLACE FUNCTION check_limit(org_uuid UUID, resource_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  org_tier TEXT;
  current_count INTEGER;
  limit_value INTEGER;
BEGIN
  -- Get org's subscription tier
  SELECT COALESCE(s.tier, 'free') INTO org_tier
  FROM organizations o
  LEFT JOIN subscriptions s ON s.org_id = o.id
  WHERE o.id = org_uuid;
  
  -- Get the limit for this resource
  CASE resource_type
    WHEN 'brands' THEN
      SELECT brands INTO limit_value FROM plan_limits WHERE tier = org_tier;
      SELECT COUNT(*) INTO current_count FROM brands WHERE org_id = org_uuid;
    WHEN 'members' THEN
      SELECT team_members INTO limit_value FROM plan_limits WHERE tier = org_tier;
      SELECT COUNT(*) INTO current_count FROM organization_members WHERE org_id = org_uuid;
    WHEN 'templates' THEN
      SELECT templates INTO limit_value FROM plan_limits WHERE tier = org_tier;
      SELECT COUNT(*) INTO current_count FROM email_templates WHERE org_id = org_uuid;
    WHEN 'emails' THEN
      SELECT emails_per_month INTO limit_value FROM plan_limits WHERE tier = org_tier;
      SELECT COUNT(*) INTO current_count 
      FROM saved_emails se
      JOIN brands b ON b.id = se.brand_id
      WHERE b.org_id = org_uuid
      AND se.created_at >= date_trunc('month', CURRENT_DATE);
    ELSE
      RETURN true;
  END CASE;
  
  -- -1 means unlimited
  IF limit_value = -1 THEN
    RETURN true;
  END IF;
  
  RETURN current_count < limit_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- AUTO-CREATE SUBSCRIPTION FOR NEW ORGS
-- ============================================
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (org_id, tier, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_subscription_on_org ON organizations;
CREATE TRIGGER create_subscription_on_org
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_default_subscription();

-- Create subscriptions for existing orgs
INSERT INTO subscriptions (org_id, tier, status)
SELECT id, 'free', 'active' FROM organizations
WHERE id NOT IN (SELECT org_id FROM subscriptions)
ON CONFLICT DO NOTHING;

-- ============================================
-- USAGE LIMIT ENFORCEMENT (Optional - can be enforced in app)
-- ============================================

-- Check brands limit before insert
CREATE OR REPLACE FUNCTION check_brands_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT check_limit(NEW.org_id, 'brands') THEN
    RAISE EXCEPTION 'Brand limit reached for your plan. Please upgrade to add more brands.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_brands_limit ON brands;
CREATE TRIGGER enforce_brands_limit
  BEFORE INSERT ON brands
  FOR EACH ROW
  EXECUTE FUNCTION check_brands_limit();

-- Check members limit before insert
CREATE OR REPLACE FUNCTION check_members_limit()
RETURNS TRIGGER AS $$
DECLARE
  org_uuid UUID;
BEGIN
  org_uuid := NEW.org_id;
  IF NOT check_limit(org_uuid, 'members') THEN
    RAISE EXCEPTION 'Team member limit reached for your plan. Please upgrade to add more members.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_members_limit ON organization_members;
CREATE TRIGGER enforce_members_limit
  BEFORE INSERT ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION check_members_limit();

-- Check templates limit before insert
CREATE OR REPLACE FUNCTION check_templates_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT check_limit(NEW.org_id, 'templates') THEN
    RAISE EXCEPTION 'Template limit reached for your plan. Please upgrade to create more templates.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_templates_limit ON email_templates;
CREATE TRIGGER enforce_templates_limit
  BEFORE INSERT ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION check_templates_limit();
