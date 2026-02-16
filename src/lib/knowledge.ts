import { supabase } from './supabase';
import type {
  KnowledgeEntry,
  KnowledgeCategory,
  CreateKnowledgeEntryInput,
  UpdateKnowledgeEntryInput,
} from '../types/knowledge';

// ============================================
// Input Validation
// ============================================

const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 50000;
const MAX_URL_LENGTH = 2000;

function validateKnowledgeInput(input: { title?: string; content?: string; source_url?: string | null }) {
  if (input.title !== undefined) {
    const trimmed = input.title.trim();
    if (!trimmed) throw new Error('Title is required');
    if (trimmed.length > MAX_TITLE_LENGTH) throw new Error(`Title must be ${MAX_TITLE_LENGTH} characters or less`);
  }
  if (input.content !== undefined) {
    const trimmed = input.content.trim();
    if (!trimmed) throw new Error('Content is required');
    if (trimmed.length > MAX_CONTENT_LENGTH) throw new Error(`Content must be ${MAX_CONTENT_LENGTH} characters or less`);
  }
  if (input.source_url) {
    const trimmed = input.source_url.trim();
    if (trimmed.length > MAX_URL_LENGTH) throw new Error(`URL must be ${MAX_URL_LENGTH} characters or less`);
    if (trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      throw new Error('URL must start with http:// or https://');
    }
  }
}

// ============================================
// Knowledge Base CRUD Operations
// ============================================

export const getKnowledgeEntries = async (
  brandId: string,
  category?: KnowledgeCategory,
  activeOnly = true
): Promise<KnowledgeEntry[]> => {
  let query = supabase
    .from('knowledge_entries')
    .select('*')
    .eq('brand_id', brandId);

  if (category) {
    query = query.eq('category', category);
  }

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getKnowledgeEntry = async (id: string): Promise<KnowledgeEntry | null> => {
  const { data, error } = await supabase
    .from('knowledge_entries')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
};

export const createKnowledgeEntry = async (
  input: CreateKnowledgeEntryInput
): Promise<KnowledgeEntry> => {
  validateKnowledgeInput(input);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('knowledge_entries')
    .insert({
      brand_id: input.brand_id,
      category: input.category,
      title: input.title.trim(),
      content: input.content.trim(),
      source_url: input.source_url?.trim() || null,
      source_type: input.source_type || 'manual',
      metadata: input.metadata || {},
      created_by: user.id,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

export const updateKnowledgeEntry = async (
  id: string,
  input: UpdateKnowledgeEntryInput
): Promise<KnowledgeEntry> => {
  validateKnowledgeInput(input);

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) updateData.title = input.title.trim();
  if (input.content !== undefined) updateData.content = input.content.trim();
  if (input.source_url !== undefined) updateData.source_url = input.source_url?.trim() || null;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.metadata !== undefined) updateData.metadata = input.metadata;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  const { data, error } = await supabase
    .from('knowledge_entries')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

export const deleteKnowledgeEntry = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('knowledge_entries')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const toggleKnowledgeEntry = async (
  id: string,
  isActive: boolean
): Promise<KnowledgeEntry> => {
  return updateKnowledgeEntry(id, { is_active: isActive });
};

// ============================================
// Bulk Operations
// ============================================

export const createBulkKnowledgeEntries = async (
  entries: CreateKnowledgeEntryInput[]
): Promise<KnowledgeEntry[]> => {
  // Validate all entries before inserting any
  entries.forEach(entry => validateKnowledgeInput(entry));

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const rows = entries.map(entry => ({
    brand_id: entry.brand_id,
    category: entry.category,
    title: entry.title.trim(),
    content: entry.content.trim(),
    source_url: entry.source_url?.trim() || null,
    source_type: entry.source_type || 'manual',
    metadata: entry.metadata || {},
    created_by: user.id,
  }));

  const { data, error } = await supabase
    .from('knowledge_entries')
    .insert(rows)
    .select('*');

  if (error) throw error;
  return data || [];
};

// ============================================
// Search & Filtering
// ============================================

export const searchKnowledgeEntries = async (
  brandId: string,
  searchQuery: string
): Promise<KnowledgeEntry[]> => {
  // Sanitize search input: escape characters that could break PostgREST filter syntax
  const sanitized = searchQuery.replace(/[%_\\(),."']/g, '');
  if (!sanitized.trim()) return [];

  const { data, error } = await supabase
    .from('knowledge_entries')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_active', true)
    .or(`title.ilike.%${sanitized}%,content.ilike.%${sanitized}%`)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getKnowledgeStats = async (
  brandId: string
): Promise<Record<KnowledgeCategory, number>> => {
  const { data, error } = await supabase
    .from('knowledge_entries')
    .select('category')
    .eq('brand_id', brandId)
    .eq('is_active', true);

  if (error) throw error;

  const stats: Record<string, number> = {
    product: 0,
    faq: 0,
    competitor: 0,
    persona: 0,
    campaign_result: 0,
    general: 0,
  };

  (data || []).forEach(entry => {
    if (entry.category in stats) {
      stats[entry.category]++;
    }
  });

  return stats as Record<KnowledgeCategory, number>;
};

// ============================================
// Knowledge Context for Prompts
// ============================================

/**
 * Get relevant knowledge entries for email generation context.
 * Returns entries filtered by relevance to the email type.
 */
export const getKnowledgeForGeneration = async (
  brandId: string,
  emailType?: string,
  maxEntries = 20
): Promise<KnowledgeEntry[]> => {
  // Determine which categories are most relevant for this email type
  const relevantCategories = getRelevantCategories(emailType);

  const { data, error } = await supabase
    .from('knowledge_entries')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_active', true)
    .in('category', relevantCategories)
    .order('updated_at', { ascending: false })
    .limit(maxEntries);

  if (error) throw error;
  return data || [];
};

/**
 * Map email types to relevant knowledge categories
 */
function getRelevantCategories(emailType?: string): KnowledgeCategory[] {
  switch (emailType) {
    case 'promotion':
    case 'new_product':
    case 'back_in_stock':
      return ['product', 'competitor', 'persona', 'campaign_result', 'general'];
    case 'welcome':
    case 'welcome_series_2':
    case 'welcome_series_3':
      return ['product', 'faq', 'persona', 'general'];
    case 'abandoned_cart':
    case 'abandoned_browse':
      return ['product', 'faq', 'persona', 'campaign_result'];
    case 'review_request':
    case 'post_purchase':
      return ['product', 'faq', 'general'];
    case 'winback':
    case 'vip_exclusive':
      return ['product', 'persona', 'campaign_result', 'general'];
    default:
      return ['product', 'faq', 'competitor', 'persona', 'campaign_result', 'general'];
  }
}
