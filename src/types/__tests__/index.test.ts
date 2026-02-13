import { describe, it, expect } from 'vitest';
import { BRAND_KIT_SECTIONS, VERTICAL_OPTIONS } from '../index';

describe('index types', () => {
  describe('BRAND_KIT_SECTIONS', () => {
    it('has exactly 6 sections', () => {
      expect(BRAND_KIT_SECTIONS).toHaveLength(6);
    });

    it('sections are in correct order', () => {
      expect(BRAND_KIT_SECTIONS.map(s => s.id)).toEqual([
        'identity', 'product', 'customer', 'voice', 'marketing', 'design',
      ]);
    });

    it('all sections have id, title, and icon', () => {
      for (const section of BRAND_KIT_SECTIONS) {
        expect(section.id).toBeDefined();
        expect(section.title).toBeDefined();
        expect(section.title.length).toBeGreaterThan(0);
        expect(section.icon).toBeDefined();
      }
    });

    it('first section is Brand Identity & Positioning', () => {
      expect(BRAND_KIT_SECTIONS[0].title).toBe('Brand Identity & Positioning');
    });

    it('last section is Design & Moodboard', () => {
      expect(BRAND_KIT_SECTIONS[5].title).toBe('Design & Moodboard');
    });
  });

  describe('VERTICAL_OPTIONS', () => {
    it('has exactly 8 options', () => {
      expect(VERTICAL_OPTIONS).toHaveLength(8);
    });

    it('all options have value and label', () => {
      for (const option of VERTICAL_OPTIONS) {
        expect(option.value).toBeDefined();
        expect(option.label).toBeDefined();
      }
    });

    it('includes common verticals', () => {
      const values = VERTICAL_OPTIONS.map(o => o.value);
      expect(values).toContain('apparel');
      expect(values).toContain('skincare');
      expect(values).toContain('supplements');
      expect(values).toContain('food');
    });

    it('has "Other" as last option', () => {
      const last = VERTICAL_OPTIONS[VERTICAL_OPTIONS.length - 1];
      expect(last.value).toBe('other');
      expect(last.label).toBe('Other');
    });
  });
});
