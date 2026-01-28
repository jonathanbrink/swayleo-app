-- Swayleo Analytics v0.0.4
-- Run this AFTER 004_organization_management.sql in your Supabase SQL Editor

-- ============================================
-- ANALYTICS VIEWS
-- ============================================

-- Dashboard stats for an organization
CREATE OR REPLACE FUNCTION get_dashboard_stats(org_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalBrands', (SELECT COUNT(*) FROM brands WHERE org_id = org_uuid),
    'completedKits', (
      SELECT COUNT(*) FROM brand_kits bk
      JOIN brands b ON b.id = bk.brand_id
      WHERE b.org_id = org_uuid AND bk.is_complete = true
    ),
    'totalEmails', (
      SELECT COUNT(*) FROM saved_emails se
      JOIN brands b ON b.id = se.brand_id
      WHERE b.org_id = org_uuid
    ),
    'emailsThisMonth', (
      SELECT COUNT(*) FROM saved_emails se
      JOIN brands b ON b.id = se.brand_id
      WHERE b.org_id = org_uuid
      AND se.created_at >= date_trunc('month', CURRENT_DATE)
    ),
    'tokensUsed', (
      SELECT COALESCE(SUM(prompt_tokens + COALESCE(completion_tokens, 0)), 0)
      FROM generation_logs gl
      JOIN brands b ON b.id = gl.brand_id
      WHERE b.org_id = org_uuid
    ),
    'tokensThisMonth', (
      SELECT COALESCE(SUM(prompt_tokens + COALESCE(completion_tokens, 0)), 0)
      FROM generation_logs gl
      JOIN brands b ON b.id = gl.brand_id
      WHERE b.org_id = org_uuid
      AND gl.created_at >= date_trunc('month', CURRENT_DATE)
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Brand stats for an organization
CREATE OR REPLACE FUNCTION get_brand_stats(org_uuid UUID)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_agg(brand_stat)
    FROM (
      SELECT 
        b.id,
        b.name,
        CASE 
          WHEN bk.is_complete THEN 100
          ELSE (
            -- Calculate progress based on filled fields
            (CASE WHEN bk.brand_identity->>'values_themes' != '' THEN 1 ELSE 0 END +
             CASE WHEN bk.brand_identity->>'brand_story' != '' THEN 1 ELSE 0 END +
             CASE WHEN bk.brand_identity->>'desired_feeling' != '' THEN 1 ELSE 0 END +
             CASE WHEN bk.product_differentiation->>'unique_aspects' != '' THEN 1 ELSE 0 END +
             CASE WHEN bk.product_differentiation->>'best_sellers' != '' THEN 1 ELSE 0 END +
             CASE WHEN bk.customer_audience->>'ideal_customer' != '' THEN 1 ELSE 0 END +
             CASE WHEN bk.customer_audience->>'day_to_day' != '' THEN 1 ELSE 0 END +
             CASE WHEN bk.brand_voice->>'voice_description' != '' THEN 1 ELSE 0 END +
             CASE WHEN bk.brand_voice->>'words_to_avoid' != '' THEN 1 ELSE 0 END +
             CASE WHEN bk.marketing_strategy->>'competitors' != '' THEN 1 ELSE 0 END
            ) * 10
          END
        END as "kitProgress",
        (SELECT COUNT(*) FROM saved_emails WHERE brand_id = b.id) as "emailCount",
        GREATEST(
          b.updated_at,
          bk.updated_at,
          (SELECT MAX(created_at) FROM saved_emails WHERE brand_id = b.id)
        ) as "lastActivity"
      FROM brands b
      LEFT JOIN brand_kits bk ON bk.brand_id = b.id
      WHERE b.org_id = org_uuid
      ORDER BY "lastActivity" DESC NULLS LAST
    ) brand_stat
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Email type distribution
CREATE OR REPLACE FUNCTION get_email_type_stats(org_uuid UUID, days_ago INTEGER DEFAULT NULL)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_agg(type_stat)
    FROM (
      SELECT 
        se.email_type as "emailType",
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0), 1) as percentage
      FROM saved_emails se
      JOIN brands b ON b.id = se.brand_id
      WHERE b.org_id = org_uuid
      AND (days_ago IS NULL OR se.created_at >= CURRENT_DATE - days_ago)
      GROUP BY se.email_type
      ORDER BY count DESC
    ) type_stat
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generation activity over time
CREATE OR REPLACE FUNCTION get_generation_activity(org_uuid UUID, days_ago INTEGER DEFAULT 30)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_agg(activity ORDER BY date)
    FROM (
      SELECT 
        d.date::date as date,
        COALESCE(COUNT(gl.id), 0) as count,
        COALESCE(SUM(gl.prompt_tokens + COALESCE(gl.completion_tokens, 0)), 0) as tokens
      FROM generate_series(
        CURRENT_DATE - days_ago,
        CURRENT_DATE,
        '1 day'::interval
      ) d(date)
      LEFT JOIN generation_logs gl ON 
        gl.created_at::date = d.date::date
        AND gl.brand_id IN (SELECT id FROM brands WHERE org_id = org_uuid)
      GROUP BY d.date
    ) activity
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Provider usage stats
CREATE OR REPLACE FUNCTION get_provider_usage(org_uuid UUID, days_ago INTEGER DEFAULT NULL)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_agg(provider_stat)
    FROM (
      SELECT 
        gl.provider,
        COUNT(*) as count,
        SUM(gl.prompt_tokens + COALESCE(gl.completion_tokens, 0)) as tokens,
        ROUND(
          SUM(
            CASE gl.provider
              WHEN 'anthropic' THEN (gl.prompt_tokens * 0.003 + COALESCE(gl.completion_tokens, 0) * 0.015) / 1000
              WHEN 'openai' THEN (gl.prompt_tokens * 0.0025 + COALESCE(gl.completion_tokens, 0) * 0.01) / 1000
              WHEN 'deepseek' THEN (gl.prompt_tokens * 0.00014 + COALESCE(gl.completion_tokens, 0) * 0.00028) / 1000
              ELSE 0
            END
          )::numeric, 2
        ) as "estimatedCost"
      FROM generation_logs gl
      JOIN brands b ON b.id = gl.brand_id
      WHERE b.org_id = org_uuid
      AND (days_ago IS NULL OR gl.created_at >= CURRENT_DATE - days_ago)
      GROUP BY gl.provider
      ORDER BY count DESC
    ) provider_stat
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recent team activity
CREATE OR REPLACE FUNCTION get_team_activity(org_uuid UUID, limit_count INTEGER DEFAULT 20)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_agg(activity)
    FROM (
      SELECT 
        al.id,
        al.user_id as "userId",
        p.full_name as "userName",
        al.action,
        al.entity_type as "entityType",
        al.metadata->>'name' as "entityName",
        al.created_at as "createdAt"
      FROM audit_logs al
      LEFT JOIN profiles p ON p.id = al.user_id
      WHERE al.org_id = org_uuid
      ORDER BY al.created_at DESC
      LIMIT limit_count
    ) activity
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- AUDIT LOG TRIGGERS
-- ============================================

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
DECLARE
  org_uuid UUID;
  action_name TEXT;
  entity_name TEXT;
BEGIN
  -- Determine action
  IF TG_OP = 'INSERT' THEN
    action_name := 'created';
  ELSIF TG_OP = 'UPDATE' THEN
    action_name := 'updated';
  ELSIF TG_OP = 'DELETE' THEN
    action_name := 'deleted';
  END IF;

  -- Get org_id and entity name based on table
  IF TG_TABLE_NAME = 'brands' THEN
    IF TG_OP = 'DELETE' THEN
      org_uuid := OLD.org_id;
      entity_name := OLD.name;
    ELSE
      org_uuid := NEW.org_id;
      entity_name := NEW.name;
    END IF;
  ELSIF TG_TABLE_NAME = 'saved_emails' THEN
    IF TG_OP = 'DELETE' THEN
      SELECT b.org_id, OLD.name INTO org_uuid, entity_name
      FROM brands b WHERE b.id = OLD.brand_id;
    ELSE
      SELECT b.org_id, NEW.name INTO org_uuid, entity_name
      FROM brands b WHERE b.id = NEW.brand_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'brand_kits' THEN
    IF TG_OP = 'DELETE' THEN
      SELECT b.org_id, b.name INTO org_uuid, entity_name
      FROM brands b WHERE b.id = OLD.brand_id;
    ELSE
      SELECT b.org_id, b.name INTO org_uuid, entity_name
      FROM brands b WHERE b.id = NEW.brand_id;
    END IF;
  END IF;

  -- Insert audit log (skip if no org found)
  IF org_uuid IS NOT NULL THEN
    INSERT INTO audit_logs (org_id, user_id, action, entity_type, entity_id, metadata)
    VALUES (
      org_uuid,
      auth.uid(),
      action_name,
      TG_TABLE_NAME,
      CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
      jsonb_build_object('name', entity_name)
    );
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to tables
DROP TRIGGER IF EXISTS audit_brands ON brands;
CREATE TRIGGER audit_brands
  AFTER INSERT OR UPDATE OR DELETE ON brands
  FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS audit_saved_emails ON saved_emails;
CREATE TRIGGER audit_saved_emails
  AFTER INSERT OR DELETE ON saved_emails
  FOR EACH ROW EXECUTE FUNCTION log_activity();

-- Only log brand_kit updates when is_complete changes to true
CREATE OR REPLACE FUNCTION log_kit_completion()
RETURNS TRIGGER AS $$
DECLARE
  org_uuid UUID;
  brand_name TEXT;
BEGIN
  -- Only log when kit becomes complete
  IF NEW.is_complete = true AND (OLD.is_complete IS NULL OR OLD.is_complete = false) THEN
    SELECT b.org_id, b.name INTO org_uuid, brand_name
    FROM brands b WHERE b.id = NEW.brand_id;

    IF org_uuid IS NOT NULL THEN
      INSERT INTO audit_logs (org_id, user_id, action, entity_type, entity_id, metadata)
      VALUES (
        org_uuid,
        auth.uid(),
        'completed',
        'brand_kit',
        NEW.brand_id,
        jsonb_build_object('name', brand_name)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_brand_kit_completion ON brand_kits;
CREATE TRIGGER audit_brand_kit_completion
  AFTER UPDATE ON brand_kits
  FOR EACH ROW EXECUTE FUNCTION log_kit_completion();
