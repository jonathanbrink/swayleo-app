import { supabase, getSignedUrl } from './supabase';
import type {
  Brand,
  BrandKit,
  MoodboardAsset,
  CreateBrandInput,
  UpdateBrandInput,
  UpdateBrandKitInput,
  Profile,
} from '../types';

// ============================================
// Auth API
// ============================================

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const getCurrentProfile = async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signUp = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// ============================================
// Brands API
// ============================================

export const getBrands = async (): Promise<Brand[]> => {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getBrand = async (id: string): Promise<Brand | null> => {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
};

export const createBrand = async (input: CreateBrandInput): Promise<Brand> => {
  // Get current user's org_id
  const profile = await getCurrentProfile();
  if (!profile?.org_id) {
    throw new Error('User is not associated with an organization');
  }

  const { data, error } = await supabase
    .from('brands')
    .insert({
      ...input,
      org_id: profile.org_id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateBrand = async (id: string, input: UpdateBrandInput): Promise<Brand> => {
  const { data, error } = await supabase
    .from('brands')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteBrand = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('brands')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ============================================
// Brand Kits API
// ============================================

export const getBrandKit = async (brandId: string): Promise<BrandKit | null> => {
  const { data, error } = await supabase
    .from('brand_kits')
    .select('*')
    .eq('brand_id', brandId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
};

export const updateBrandKit = async (
  brandId: string,
  input: UpdateBrandKitInput
): Promise<BrandKit> => {
  // For JSONB fields, we need to merge with existing data
  const existing = await getBrandKit(brandId);
  
  const updates: Record<string, unknown> = {};
  
  if (input.brand_identity) {
    updates.brand_identity = { ...existing?.brand_identity, ...input.brand_identity };
  }
  if (input.product_differentiation) {
    updates.product_differentiation = { ...existing?.product_differentiation, ...input.product_differentiation };
  }
  if (input.customer_audience) {
    updates.customer_audience = { ...existing?.customer_audience, ...input.customer_audience };
  }
  if (input.brand_voice) {
    updates.brand_voice = { ...existing?.brand_voice, ...input.brand_voice };
  }
  if (input.marketing_strategy) {
    updates.marketing_strategy = { ...existing?.marketing_strategy, ...input.marketing_strategy };
  }
  if (input.design_preferences) {
    updates.design_preferences = { ...existing?.design_preferences, ...input.design_preferences };
  }
  if (input.is_complete !== undefined) {
    updates.is_complete = input.is_complete;
  }

  const { data, error } = await supabase
    .from('brand_kits')
    .update(updates)
    .eq('brand_id', brandId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ============================================
// Moodboard Assets API
// ============================================

export const getMoodboardAssets = async (brandId: string): Promise<MoodboardAsset[]> => {
  const { data, error } = await supabase
    .from('moodboard_assets')
    .select('*')
    .eq('brand_id', brandId)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;

  // Add signed URLs for each asset
  const assetsWithUrls = await Promise.all(
    (data || []).map(async (asset) => {
      try {
        const url = await getSignedUrl(asset.storage_path);
        return { ...asset, url };
      } catch {
        return { ...asset, url: undefined };
      }
    })
  );

  return assetsWithUrls;
};

export const uploadMoodboardAsset = async (
  brandId: string,
  file: File
): Promise<MoodboardAsset> => {
  const profile = await getCurrentProfile();
  if (!profile?.org_id) {
    throw new Error('User is not associated with an organization');
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const storagePath = `${profile.org_id}/${brandId}/${fileName}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('moodboards')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // Create database record
  const { data, error } = await supabase
    .from('moodboard_assets')
    .insert({
      brand_id: brandId,
      filename: file.name,
      storage_path: storagePath,
      mime_type: file.type,
      size_bytes: file.size,
    })
    .select()
    .single();

  if (error) throw error;

  // Add URL
  const url = await getSignedUrl(storagePath);
  return { ...data, url };
};

export const deleteMoodboardAsset = async (asset: MoodboardAsset): Promise<void> => {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('moodboards')
    .remove([asset.storage_path]);

  if (storageError) throw storageError;

  // Delete database record
  const { error } = await supabase
    .from('moodboard_assets')
    .delete()
    .eq('id', asset.id);

  if (error) throw error;
};
