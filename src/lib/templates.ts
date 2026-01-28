import { supabase } from './supabase';
import type { 
  CustomTemplate, 
  CreateTemplateInput, 
  UpdateTemplateInput,
  TemplateCategory
} from '../types/template';

// ============================================
// Template CRUD Operations
// ============================================

export const getTemplates = async (
  orgId: string,
  category?: TemplateCategory
): Promise<CustomTemplate[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('email_templates')
    .select(`
      *,
      creator:profiles!email_templates_created_by_fkey(full_name)
    `)
    .eq('org_id', orgId);

  // Filter by category
  if (category === 'my_templates') {
    query = query.eq('created_by', user.id);
  } else if (category === 'shared') {
    query = query.eq('is_shared', true);
  } else if (category === 'popular') {
    query = query.order('use_count', { ascending: false }).limit(20);
  }

  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getTemplate = async (id: string): Promise<CustomTemplate | null> => {
  const { data, error } = await supabase
    .from('email_templates')
    .select(`
      *,
      creator:profiles!email_templates_created_by_fkey(full_name)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
};

export const getTemplatesByType = async (
  orgId: string,
  emailType: string
): Promise<CustomTemplate[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('email_templates')
    .select(`
      *,
      creator:profiles!email_templates_created_by_fkey(full_name)
    `)
    .eq('org_id', orgId)
    .eq('email_type', emailType)
    .or(`created_by.eq.${user.id},is_shared.eq.true`)
    .order('use_count', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createTemplate = async (
  orgId: string,
  input: CreateTemplateInput
): Promise<CustomTemplate> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('email_templates')
    .insert({
      org_id: orgId,
      created_by: user.id,
      name: input.name,
      description: input.description || null,
      email_type: input.email_type,
      tone: input.tone || 'default',
      max_length: input.max_length || 'medium',
      include_emoji: input.include_emoji ?? true,
      subject_line_count: input.subject_line_count || 3,
      variation_count: input.variation_count || 2,
      custom_instructions: input.custom_instructions || null,
      example_subject_lines: input.example_subject_lines || [],
      example_cta: input.example_cta || null,
      is_shared: input.is_shared ?? false,
    })
    .select(`
      *,
      creator:profiles!email_templates_created_by_fkey(full_name)
    `)
    .single();

  if (error) throw error;
  return data;
};

export const updateTemplate = async (
  id: string,
  input: UpdateTemplateInput
): Promise<CustomTemplate> => {
  const { data, error } = await supabase
    .from('email_templates')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`
      *,
      creator:profiles!email_templates_created_by_fkey(full_name)
    `)
    .single();

  if (error) throw error;
  return data;
};

export const deleteTemplate = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('email_templates')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const duplicateTemplate = async (
  id: string,
  newName: string
): Promise<CustomTemplate> => {
  // Get original template
  const original = await getTemplate(id);
  if (!original) throw new Error('Template not found');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Create copy
  const { data, error } = await supabase
    .from('email_templates')
    .insert({
      org_id: original.org_id,
      created_by: user.id,
      name: newName,
      description: original.description,
      email_type: original.email_type,
      tone: original.tone,
      max_length: original.max_length,
      include_emoji: original.include_emoji,
      subject_line_count: original.subject_line_count,
      variation_count: original.variation_count,
      custom_instructions: original.custom_instructions,
      example_subject_lines: original.example_subject_lines,
      example_cta: original.example_cta,
      is_shared: false, // Copies start as private
      use_count: 0,
    })
    .select(`
      *,
      creator:profiles!email_templates_created_by_fkey(full_name)
    `)
    .single();

  if (error) throw error;
  return data;
};

export const incrementTemplateUse = async (templateId: string): Promise<void> => {
  await supabase.rpc('increment_template_use', { template_id: templateId });
};

export const getPopularTemplates = async (
  orgId: string,
  limit: number = 10
): Promise<CustomTemplate[]> => {
  const { data, error } = await supabase
    .rpc('get_popular_templates', { 
      org_uuid: orgId, 
      limit_count: limit 
    });

  if (error) throw error;
  return data || [];
};
