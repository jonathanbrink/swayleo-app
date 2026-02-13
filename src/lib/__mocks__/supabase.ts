import { vi } from 'vitest';

// Mock supabase client
export const supabase = {
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  }),
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  functions: {
    invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: null, error: null }),
      remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.supabase.co/storage/test' } }),
      createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://test.supabase.co/signed/test' }, error: null }),
    }),
  },
};

export const getStorageUrl = vi.fn().mockReturnValue('https://test.supabase.co/storage/test');
export const getSignedUrl = vi.fn().mockResolvedValue('https://test.supabase.co/signed/test');
