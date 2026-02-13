import { supabase } from './supabase';
import type {
  KnowledgeEntry,
  KnowledgeCategory,
  CreateKnowledgeEntryInput,
  UpdateKnowledgeEntryInput,
} from '../types/knowledge';

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('knowledge_entries')
    .insert({
      brand_id: input.brand_id,
      category: input.category,
      title: input.title,
      content: input.content,
      source_url: input.source_url || null,
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
  const { data, error } = await supabase
    .from('knowledge_entries')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const rows = entries.map(entry => ({
    brand_id: entry.brand_id,
    category: entry.category,
    title: entry.title,
    content: entry.content,
    source_url: entry.source_url || null,
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
  // Basic text search on title and content
  const { data, error } = await supabase
    .from('knowledge_entries')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_active', true)
    .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
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
