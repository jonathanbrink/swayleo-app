import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Helper to get public URL for storage files
export const getStorageUrl = (path: string) => {
  const { data } = supabase.storage.from('moodboards').getPublicUrl(path);
  return data.publicUrl;
};

// Helper to create signed URL for private files
export const getSignedUrl = async (path: string, expiresIn = 3600) => {
  const { data, error } = await supabase.storage
    .from('moodboards')
    .createSignedUrl(path, expiresIn);
  
  if (error) throw error;
  return data.signedUrl;
};
