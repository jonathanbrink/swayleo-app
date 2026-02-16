import { describe, it, expect } from 'vitest';
import {
  KNOWLEDGE_CATEGORIES,
  getCategoryInfo,
  type KnowledgeCategory,
} from '../knowledge';

describe('types/knowledge', () => {
  describe('KNOWLEDGE_CATEGORIES', () => {
    it('has exactly 6 categories', () => {
      expect(KNOWLEDGE_CATEGORIES).toHaveLength(6);
    });

    it('includes all expected category IDs', () => {
      const ids = KNOWLEDGE_CATEGORIES.map(c => c.id);
      expect(ids).toContain('product');
      expect(ids).toContain('faq');
      expect(ids).toContain('competitor');
      expect(ids).toContain('persona');
      expect(ids).toContain('campaign_result');
      expect(ids).toContain('general');
    });

    it('all categories have required fields', () => {
      KNOWLEDGE_CATEGORIES.forEach(cat => {
        expect(cat.id).toBeTruthy();
        expect(cat.name).toBeTruthy();
        expect(cat.description).toBeTruthy();
        expect(cat.icon).toBeTruthy();
      });
    });

    it('has unique IDs for all categories', () => {
      const ids = KNOWLEDGE_CATEGORIES.map(c => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('has unique names for all categories', () => {
      const names = KNOWLEDGE_CATEGORIES.map(c => c.name);
      expect(new Set(names).size).toBe(names.length);
    });
  });

  describe('getCategoryInfo()', () => {
    it('returns correct info for product category', () => {
      const info = getCategoryInfo('product');
      expect(info.id).toBe('product');
      expect(info.name).toBe('Products');
      expect(info.icon).toBe('Package');
    });

    it('returns correct info for faq category', () => {
      const info = getCategoryInfo('faq');
      expect(info.id).toBe('faq');
      expect(info.name).toBe('FAQs');
    });

    it('returns correct info for competitor category', () => {
      const info = getCategoryInfo('competitor');
      expect(info.id).toBe('competitor');
      expect(info.name).toBe('Competitors');
    });

    it('returns correct info for persona category', () => {
      const info = getCategoryInfo('persona');
      expect(info.id).toBe('persona');
      expect(info.name).toBe('Personas');
    });

    it('returns correct info for campaign_result category', () => {
      const info = getCategoryInfo('campaign_result');
      expect(info.id).toBe('campaign_result');
      expect(info.name).toBe('Campaign Results');
    });

    it('returns correct info for general category', () => {
      const info = getCategoryInfo('general');
      expect(info.id).toBe('general');
      expect(info.name).toBe('General');
    });

    it('falls back to general for unknown category', () => {
      const info = getCategoryInfo('unknown' as KnowledgeCategory);
      expect(info.id).toBe('general');
    });
  });
});
