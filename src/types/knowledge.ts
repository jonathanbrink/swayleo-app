// ============================================
// Knowledge Base Types
// ============================================

export type KnowledgeCategory = 'product' | 'faq' | 'competitor' | 'persona' | 'campaign_result' | 'general';
export type KnowledgeSourceType = 'manual' | 'web_research' | 'import' | 'campaign_result';

export interface KnowledgeEntry {
  id: string;
  brand_id: string;
  category: KnowledgeCategory;
  title: string;
  content: string;
  source_url: string | null;
  source_type: KnowledgeSourceType;
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateKnowledgeEntryInput {
  brand_id: string;
  category: KnowledgeCategory;
  title: string;
  content: string;
  source_url?: string;
  source_type?: KnowledgeSourceType;
  metadata?: Record<string, unknown>;
}

export interface UpdateKnowledgeEntryInput {
  category?: KnowledgeCategory;
  title?: string;
  content?: string;
  source_url?: string | null;
  metadata?: Record<string, unknown>;
  is_active?: boolean;
}

// Category display configuration
export const KNOWLEDGE_CATEGORIES: Array<{
  id: KnowledgeCategory;
  name: string;
  description: string;
  icon: string;
}> = [
  { id: 'product', name: 'Products', description: 'Product catalogs, features, and specs', icon: 'Package' },
  { id: 'faq', name: 'FAQs', description: 'Frequently asked questions and answers', icon: 'HelpCircle' },
  { id: 'competitor', name: 'Competitors', description: 'Competitor analysis and positioning', icon: 'Swords' },
  { id: 'persona', name: 'Personas', description: 'Customer personas and segments', icon: 'Users' },
  { id: 'campaign_result', name: 'Campaign Results', description: 'Past campaign performance and insights', icon: 'BarChart3' },
  { id: 'general', name: 'General', description: 'General brand knowledge and notes', icon: 'FileText' },
];

export const getCategoryInfo = (category: KnowledgeCategory) => {
  return KNOWLEDGE_CATEGORIES.find(c => c.id === category) || KNOWLEDGE_CATEGORIES[5]; // default to general
};
