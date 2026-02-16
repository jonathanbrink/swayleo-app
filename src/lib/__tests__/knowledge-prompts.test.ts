import { describe, it, expect } from 'vitest';
import { buildKnowledgeBaseContext, buildBrandKitContext, buildEmailPrompt } from '../prompts';
import { mockBrand, mockBrandKit, mockEmailRequest } from '../../test/fixtures';
import type { KnowledgeEntry } from '../../types/knowledge';

const mockKnowledgeEntries: KnowledgeEntry[] = [
  {
    id: 'kb-1',
    brand_id: 'brand-123',
    category: 'product',
    title: 'Vitamin C Serum',
    content: 'Best-selling serum with 20% Vitamin C. $49.99. 4.8 star rating.',
    source_url: null,
    source_type: 'manual',
    metadata: {},
    is_active: true,
    created_by: 'user-1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'kb-2',
    brand_id: 'brand-123',
    category: 'product',
    title: 'Hyaluronic Moisturizer',
    content: 'Lightweight moisturizer with HA. $39.99. Great for oily skin.',
    source_url: 'https://testbrand.com/moisturizer',
    source_type: 'web_research',
    metadata: {},
    is_active: true,
    created_by: 'user-1',
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  },
  {
    id: 'kb-3',
    brand_id: 'brand-123',
    category: 'faq',
    title: 'Shipping Policy',
    content: 'Free shipping on orders over $50. Ships within 2 business days.',
    source_url: null,
    source_type: 'manual',
    metadata: {},
    is_active: true,
    created_by: 'user-1',
    created_at: '2025-01-03T00:00:00Z',
    updated_at: '2025-01-03T00:00:00Z',
  },
  {
    id: 'kb-4',
    brand_id: 'brand-123',
    category: 'competitor',
    title: 'The Ordinary Analysis',
    content: 'Affordable but clinical branding. Targets budget-conscious consumers.',
    source_url: null,
    source_type: 'manual',
    metadata: {},
    is_active: true,
    created_by: 'user-1',
    created_at: '2025-01-04T00:00:00Z',
    updated_at: '2025-01-04T00:00:00Z',
  },
];

describe('Knowledge Base Prompt Integration', () => {
  describe('buildKnowledgeBaseContext()', () => {
    it('returns empty string for empty array', () => {
      expect(buildKnowledgeBaseContext([])).toBe('');
    });

    it('returns empty string for null/undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(buildKnowledgeBaseContext(null as any)).toBe('');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(buildKnowledgeBaseContext(undefined as any)).toBe('');
    });

    it('wraps entries in <knowledge_base> tags', () => {
      const result = buildKnowledgeBaseContext(mockKnowledgeEntries);
      expect(result).toContain('<knowledge_base>');
      expect(result).toContain('</knowledge_base>');
    });

    it('groups entries by category', () => {
      const result = buildKnowledgeBaseContext(mockKnowledgeEntries);
      expect(result).toContain('<product>');
      expect(result).toContain('</product>');
      expect(result).toContain('<faq>');
      expect(result).toContain('</faq>');
      expect(result).toContain('<competitor>');
      expect(result).toContain('</competitor>');
    });

    it('includes entry titles and content', () => {
      const result = buildKnowledgeBaseContext(mockKnowledgeEntries);
      expect(result).toContain('title="Vitamin C Serum"');
      expect(result).toContain('Best-selling serum with 20% Vitamin C');
      expect(result).toContain('title="Hyaluronic Moisturizer"');
      expect(result).toContain('Lightweight moisturizer with HA');
      expect(result).toContain('title="Shipping Policy"');
      expect(result).toContain('title="The Ordinary Analysis"');
    });

    it('puts multiple entries in same category group', () => {
      const result = buildKnowledgeBaseContext(mockKnowledgeEntries);
      // Both product entries should be under one <product> section
      const productSection = result.match(/<product>([\s\S]*?)<\/product>/);
      expect(productSection).toBeTruthy();
      expect(productSection![1]).toContain('Vitamin C Serum');
      expect(productSection![1]).toContain('Hyaluronic Moisturizer');
    });

    it('handles single entry', () => {
      const result = buildKnowledgeBaseContext([mockKnowledgeEntries[2]]);
      expect(result).toContain('<knowledge_base>');
      expect(result).toContain('<faq>');
      expect(result).toContain('Shipping Policy');
      expect(result).toContain('</knowledge_base>');
    });
  });

  describe('buildBrandKitContext() with knowledge entries', () => {
    it('includes knowledge base XML when entries provided', () => {
      const result = buildBrandKitContext(mockBrand, mockBrandKit, mockKnowledgeEntries);
      expect(result).toContain('<knowledge_base>');
      expect(result).toContain('Vitamin C Serum');
      expect(result).toContain('</brand_kit>');
    });

    it('does not include knowledge base XML when no entries', () => {
      const result = buildBrandKitContext(mockBrand, mockBrandKit);
      expect(result).not.toContain('<knowledge_base>');
      expect(result).toContain('</brand_kit>');
    });

    it('does not include knowledge base XML when empty array', () => {
      const result = buildBrandKitContext(mockBrand, mockBrandKit, []);
      expect(result).not.toContain('<knowledge_base>');
    });

    it('places knowledge base inside brand_kit tags', () => {
      const result = buildBrandKitContext(mockBrand, mockBrandKit, mockKnowledgeEntries);
      const brandKitStart = result.indexOf('<brand_kit>');
      const brandKitEnd = result.indexOf('</brand_kit>');
      const kbStart = result.indexOf('<knowledge_base>');
      expect(kbStart).toBeGreaterThan(brandKitStart);
      expect(kbStart).toBeLessThan(brandKitEnd);
    });
  });

  describe('buildEmailPrompt() with knowledge entries', () => {
    it('includes knowledge entries in the full prompt', () => {
      const result = buildEmailPrompt(mockBrand, mockBrandKit, mockEmailRequest, mockKnowledgeEntries);
      expect(result).toContain('<knowledge_base>');
      expect(result).toContain('Vitamin C Serum');
      expect(result).toContain('Shipping Policy');
    });

    it('works without knowledge entries (backward compatible)', () => {
      const result = buildEmailPrompt(mockBrand, mockBrandKit, mockEmailRequest);
      expect(result).not.toContain('<knowledge_base>');
      expect(result).toContain('<brand_kit>');
      expect(result).toContain('<email_request>');
    });

    it('includes all prompt sections alongside knowledge', () => {
      const result = buildEmailPrompt(mockBrand, mockBrandKit, mockEmailRequest, mockKnowledgeEntries);
      expect(result).toContain('<brand_kit>');
      expect(result).toContain('<knowledge_base>');
      expect(result).toContain('<email_request>');
      expect(result).toContain('<email_type_instructions>');
      expect(result).toContain('<critical_rules>');
      expect(result).toContain('<output_format>');
    });
  });
});
