import { describe, it, expect } from 'vitest';
import { buildBrandKitContext, buildEmailPrompt, EMAIL_SYSTEM_PROMPT } from '../prompts';
import { mockBrand, mockBrandNoWebsite, mockBrandKit, mockEmptyBrandKit, mockEmailRequest, mockEmailRequestCasual, mockEmailRequestNoEmoji } from '../../test/fixtures';

describe('prompts', () => {
  describe('buildBrandKitContext()', () => {
    it('generates XML with brand name', () => {
      const result = buildBrandKitContext(mockBrand, mockBrandKit);
      expect(result).toContain('<brand_name>TestBrand Co</brand_name>');
    });

    it('includes website_url when present', () => {
      const result = buildBrandKitContext(mockBrand, mockBrandKit);
      expect(result).toContain('<website>https://testbrand.com</website>');
    });

    it('omits website when null', () => {
      const result = buildBrandKitContext(mockBrandNoWebsite, mockBrandKit);
      expect(result).not.toContain('<website>');
    });

    it('includes vertical when present', () => {
      const result = buildBrandKitContext(mockBrand, mockBrandKit);
      expect(result).toContain('<vertical>skincare</vertical>');
    });

    it('omits vertical when null', () => {
      const result = buildBrandKitContext(mockBrandNoWebsite, mockBrandKit);
      expect(result).not.toContain('<vertical>');
    });

    it('includes brand identity section', () => {
      const result = buildBrandKitContext(mockBrand, mockBrandKit);
      expect(result).toContain('<brand_identity>');
      expect(result).toContain('Clean beauty, sustainability');
      expect(result).toContain('Founded in 2020');
    });

    it('includes product differentiation section', () => {
      const result = buildBrandKitContext(mockBrand, mockBrandKit);
      expect(result).toContain('<product_differentiation>');
      expect(result).toContain('All-natural ingredients');
    });

    it('includes customer audience section', () => {
      const result = buildBrandKitContext(mockBrand, mockBrandKit);
      expect(result).toContain('<customer_audience>');
      expect(result).toContain('Women 25-45');
    });

    it('includes brand voice section', () => {
      const result = buildBrandKitContext(mockBrand, mockBrandKit);
      expect(result).toContain('<brand_voice>');
      expect(result).toContain('Warm, knowledgeable');
    });

    it('includes marketing context section', () => {
      const result = buildBrandKitContext(mockBrand, mockBrandKit);
      expect(result).toContain('<marketing_context>');
      expect(result).toContain('The Ordinary, CeraVe');
      expect(result).toContain('<has_review_platform>Yes</has_review_platform>');
      expect(result).toContain('<review_platform>Yotpo</review_platform>');
      expect(result).toContain('<international_shipping>Yes</international_shipping>');
    });

    it('uses "Not specified" for empty fields', () => {
      const result = buildBrandKitContext(mockBrandNoWebsite, mockEmptyBrandKit);
      expect(result).toContain('Not specified');
    });

    it('shows "No" for false boolean fields', () => {
      const result = buildBrandKitContext(mockBrandNoWebsite, mockEmptyBrandKit);
      expect(result).toContain('<has_review_platform>No</has_review_platform>');
      expect(result).toContain('<international_shipping>No</international_shipping>');
    });

    it('omits review_platform tag when empty', () => {
      const result = buildBrandKitContext(mockBrandNoWebsite, mockEmptyBrandKit);
      expect(result).not.toContain('<review_platform>');
    });
  });

  describe('buildEmailPrompt()', () => {
    it('includes email type in request section', () => {
      const result = buildEmailPrompt(mockBrand, mockBrandKit, mockEmailRequest);
      expect(result).toContain('<email_type>welcome</email_type>');
    });

    it('includes subject line count', () => {
      const result = buildEmailPrompt(mockBrand, mockBrandKit, mockEmailRequest);
      expect(result).toContain('<subject_lines_needed>3</subject_lines_needed>');
    });

    it('includes variation count', () => {
      const result = buildEmailPrompt(mockBrand, mockBrandKit, mockEmailRequest);
      expect(result).toContain('<variations_needed>2</variations_needed>');
    });

    it('includes email type instructions', () => {
      const result = buildEmailPrompt(mockBrand, mockBrandKit, mockEmailRequest);
      expect(result).toContain('<email_type_instructions>');
      expect(result).toContain('FIRST email a new subscriber receives');
    });

    it('omits tone adjustment for default tone', () => {
      const result = buildEmailPrompt(mockBrand, mockBrandKit, mockEmailRequest);
      expect(result).not.toContain('<tone_adjustment>');
    });

    it('includes tone modifier for non-default tone', () => {
      const result = buildEmailPrompt(mockBrand, mockBrandKit, mockEmailRequestCasual);
      expect(result).toContain('<tone_adjustment>');
      expect(result).toContain('MORE CASUAL');
    });

    it('includes length guideline', () => {
      const result = buildEmailPrompt(mockBrand, mockBrandKit, mockEmailRequest);
      expect(result).toContain('<length_guideline>');
      expect(result).toContain('Standard email length');
    });

    it('uses short length guideline when specified', () => {
      const result = buildEmailPrompt(mockBrand, mockBrandKit, mockEmailRequestNoEmoji);
      expect(result).toContain('CONCISE');
    });

    it('includes additional context when provided', () => {
      const result = buildEmailPrompt(mockBrand, mockBrandKit, mockEmailRequestCasual);
      expect(result).toContain('<additional_context>Focus on the summer collection launch</additional_context>');
    });

    it('omits additional context when not provided', () => {
      const result = buildEmailPrompt(mockBrand, mockBrandKit, mockEmailRequest);
      expect(result).not.toContain('<additional_context>');
    });

    it('includes emoji instructions when true', () => {
      const result = buildEmailPrompt(mockBrand, mockBrandKit, mockEmailRequest);
      expect(result).toContain('use emoji in subject lines');
    });

    it('includes no-emoji instructions when false', () => {
      const result = buildEmailPrompt(mockBrand, mockBrandKit, mockEmailRequestNoEmoji);
      expect(result).toContain('No emoji in subject lines');
    });

    it('includes critical rules', () => {
      const result = buildEmailPrompt(mockBrand, mockBrandKit, mockEmailRequest);
      expect(result).toContain('<critical_rules>');
      expect(result).toContain('NEVER use generic marketing speak');
    });

    it('includes output format specification', () => {
      const result = buildEmailPrompt(mockBrand, mockBrandKit, mockEmailRequest);
      expect(result).toContain('<output_format>');
      expect(result).toContain('"subject_lines"');
      expect(result).toContain('"variations"');
    });

    it('includes brand kit context', () => {
      const result = buildEmailPrompt(mockBrand, mockBrandKit, mockEmailRequest);
      expect(result).toContain('<brand_kit>');
      expect(result).toContain('TestBrand Co');
    });

    it('starts with expert copywriter instruction', () => {
      const result = buildEmailPrompt(mockBrand, mockBrandKit, mockEmailRequest);
      expect(result).toContain('expert email copywriter');
    });
  });

  describe('EMAIL_SYSTEM_PROMPT', () => {
    it('is a non-empty string', () => {
      expect(EMAIL_SYSTEM_PROMPT).toBeDefined();
      expect(typeof EMAIL_SYSTEM_PROMPT).toBe('string');
      expect(EMAIL_SYSTEM_PROMPT.length).toBeGreaterThan(100);
    });

    it('includes DTC copywriter expertise', () => {
      expect(EMAIL_SYSTEM_PROMPT).toContain('DTC');
      expect(EMAIL_SYSTEM_PROMPT).toContain('ecommerce');
    });

    it('mentions brand voice', () => {
      expect(EMAIL_SYSTEM_PROMPT).toContain('brand voice');
    });
  });
});
