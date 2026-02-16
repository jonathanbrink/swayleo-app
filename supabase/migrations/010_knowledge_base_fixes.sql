-- Swayleo Knowledge Base Fixes v0.0.10
-- Fixes: Race condition in limit enforcement, missing UPDATE audit logging

-- ============================================
-- FIX 1: Race condition in KB entry limit check
-- Use advisory lock to serialize insert limit checks per brand
-- ============================================
CREATE OR REPLACE FUNCTION check_kb_entries_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_entries INTEGER;
  brand_org_id UUID;
BEGIN
  -- Advisory lock on brand_id to serialize concurrent inserts
  PERFORM pg_advisory_xact_lock(hashtext(NEW.brand_id::text));

  -- Get the org_id for this brand
  SELECT org_id INTO brand_org_id FROM brands WHERE id = NEW.brand_id;

  -- Get current count for this brand (including inactive)
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

-- ============================================
-- FIX 2: Add UPDATE audit logging
-- ============================================
CREATE OR REPLACE FUNCTION log_knowledge_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (org_id, user_id, action, entity_type, entity_id, metadata)
    SELECT b.org_id, auth.uid(), 'created', 'knowledge_entry', NEW.id,
           jsonb_build_object('title', NEW.title, 'category', NEW.category)
    FROM brands b WHERE b.id = NEW.brand_id;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (org_id, user_id, action, entity_type, entity_id, metadata)
    SELECT b.org_id, auth.uid(), 'updated', 'knowledge_entry', NEW.id,
           jsonb_build_object('title', NEW.title, 'category', NEW.category,
                              'changed_fields', (
                                SELECT jsonb_object_agg(key, value)
                                FROM jsonb_each(to_jsonb(NEW))
                                WHERE to_jsonb(NEW) ->> key IS DISTINCT FROM to_jsonb(OLD) ->> key
                                  AND key NOT IN ('updated_at')
                              ))
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

-- Recreate trigger to include UPDATE events
DROP TRIGGER IF EXISTS audit_knowledge_entries ON knowledge_entries;
CREATE TRIGGER audit_knowledge_entries
  AFTER INSERT OR UPDATE OR DELETE ON knowledge_entries
  FOR EACH ROW
  EXECUTE FUNCTION log_knowledge_activity();
