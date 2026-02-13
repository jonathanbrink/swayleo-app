import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    VITE_USE_MOCK_GENERATION: 'true',
  },
  writable: true,
});

// Mock crypto.randomUUID
if (typeof crypto.randomUUID !== 'function') {
  Object.defineProperty(crypto, 'randomUUID', {
    value: () => '00000000-0000-4000-8000-000000000000',
  });
}

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
  writable: true,
});
