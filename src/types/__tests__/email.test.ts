import { describe, it, expect } from 'vitest';
import {
  EMAIL_TEMPLATES,
  EMAIL_CATEGORIES,
  LLM_CONFIGS,
} from '../email';
import type { EmailType } from '../email';

describe('email types', () => {
  describe('EMAIL_TEMPLATES', () => {
    it('has exactly 12 templates', () => {
      expect(EMAIL_TEMPLATES).toHaveLength(12);
    });

    it('all templates have required fields', () => {
      for (const template of EMAIL_TEMPLATES) {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.category).toBeDefined();
        expect(template.icon).toBeDefined();
        expect(template.defaultSubjectLines).toBeGreaterThan(0);
        expect(template.defaultVariations).toBeGreaterThan(0);
      }
    });

    it('includes all 12 email types', () => {
      const expectedTypes: EmailType[] = [
        'welcome', 'welcome_series_2', 'welcome_series_3',
        'abandoned_cart', 'abandoned_browse',
        'post_purchase', 'review_request',
        'promotion', 'new_product', 'back_in_stock',
        'winback', 'vip_exclusive',
      ];
      const templateIds = EMAIL_TEMPLATES.map(t => t.id);
      for (const type of expectedTypes) {
        expect(templateIds).toContain(type);
      }
    });

    it('welcome series has 3 emails', () => {
      const welcomeTemplates = EMAIL_TEMPLATES.filter(t => t.category === 'welcome');
      expect(welcomeTemplates).toHaveLength(3);
    });

    it('abandonment has 2 emails', () => {
      const abandonment = EMAIL_TEMPLATES.filter(t => t.category === 'abandonment');
      expect(abandonment).toHaveLength(2);
    });

    it('abandoned_cart has highest default subject lines (5)', () => {
      const cart = EMAIL_TEMPLATES.find(t => t.id === 'abandoned_cart')!;
      expect(cart.defaultSubjectLines).toBe(5);
      expect(cart.defaultVariations).toBe(3);
    });

    it('all categories are valid', () => {
      const validCategories = ['welcome', 'abandonment', 'post_purchase', 'promotional', 'retention'];
      for (const template of EMAIL_TEMPLATES) {
        expect(validCategories).toContain(template.category);
      }
    });
  });

  describe('EMAIL_CATEGORIES', () => {
    it('has exactly 5 categories', () => {
      expect(EMAIL_CATEGORIES).toHaveLength(5);
    });

    it('includes all categories', () => {
      const ids = EMAIL_CATEGORIES.map(c => c.id);
      expect(ids).toEqual(['welcome', 'abandonment', 'post_purchase', 'promotional', 'retention']);
    });

    it('all categories have id, name, and icon', () => {
      for (const cat of EMAIL_CATEGORIES) {
        expect(cat.id).toBeDefined();
        expect(cat.name).toBeDefined();
        expect(cat.icon).toBeDefined();
      }
    });
  });

  describe('LLM_CONFIGS', () => {
    it('has 3 providers', () => {
      expect(Object.keys(LLM_CONFIGS)).toHaveLength(3);
    });

    it('includes anthropic, openai, and deepseek', () => {
      expect(LLM_CONFIGS.anthropic).toBeDefined();
      expect(LLM_CONFIGS.openai).toBeDefined();
      expect(LLM_CONFIGS.deepseek).toBeDefined();
    });

    it('all configs have required pricing fields', () => {
      for (const [, config] of Object.entries(LLM_CONFIGS)) {
        expect(config.provider).toBeDefined();
        expect(config.model).toBeDefined();
        expect(config.displayName).toBeDefined();
        expect(config.costPer1kInput).toBeGreaterThan(0);
        expect(config.costPer1kOutput).toBeGreaterThan(0);
      }
    });

    it('deepseek is the cheapest provider', () => {
      expect(LLM_CONFIGS.deepseek.costPer1kInput).toBeLessThan(LLM_CONFIGS.anthropic.costPer1kInput);
      expect(LLM_CONFIGS.deepseek.costPer1kInput).toBeLessThan(LLM_CONFIGS.openai.costPer1kInput);
    });

    it('anthropic uses Claude model', () => {
      expect(LLM_CONFIGS.anthropic.model).toContain('claude');
    });

    it('openai uses GPT model', () => {
      expect(LLM_CONFIGS.openai.model).toContain('gpt');
    });
  });
});
