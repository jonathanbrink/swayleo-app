import { describe, it, expect, vi } from 'vitest';

// Mock supabase before importing email module
vi.mock('../supabase');

import { exportEmailAsText, exportEmailAsHTML } from '../email';

describe('email lib', () => {
  describe('exportEmailAsText()', () => {
    it('formats email with all sections', () => {
      const result = exportEmailAsText({
        subjectLine: 'Welcome!',
        previewText: 'Your journey begins',
        body: 'Thanks for joining us. We are excited to have you.',
        cta: 'Shop Now',
      });

      expect(result).toContain('SUBJECT LINE:');
      expect(result).toContain('Welcome!');
      expect(result).toContain('PREVIEW TEXT:');
      expect(result).toContain('Your journey begins');
      expect(result).toContain('BODY:');
      expect(result).toContain('Thanks for joining us');
      expect(result).toContain('CTA:');
      expect(result).toContain('Shop Now');
    });

    it('shows "(none)" for missing preview text', () => {
      const result = exportEmailAsText({
        subjectLine: 'Hello',
        body: 'Body text',
        cta: 'Click',
      });
      expect(result).toContain('(none)');
    });

    it('includes empty preview text when provided as empty string', () => {
      const result = exportEmailAsText({
        subjectLine: 'Hello',
        previewText: '',
        body: 'Body',
        cta: 'CTA',
      });
      // Empty string is falsy, should show (none)
      expect(result).toContain('(none)');
    });
  });

  describe('exportEmailAsHTML()', () => {
    it('generates valid HTML', () => {
      const result = exportEmailAsHTML({
        subjectLine: 'Test Subject',
        body: 'Hello world',
        cta: 'Shop Now',
      });
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('</html>');
    });

    it('includes subject line as title', () => {
      const result = exportEmailAsHTML({
        subjectLine: 'My Subject',
        body: 'Body',
        cta: 'CTA',
      });
      expect(result).toContain('<title>My Subject</title>');
    });

    it('includes headline when present', () => {
      const result = exportEmailAsHTML({
        subjectLine: 'Subject',
        headline: 'Big Headline',
        body: 'Body',
        cta: 'CTA',
      });
      expect(result).toContain('<h1');
      expect(result).toContain('Big Headline');
    });

    it('omits headline when not present', () => {
      const result = exportEmailAsHTML({
        subjectLine: 'Subject',
        body: 'Body',
        cta: 'CTA',
      });
      expect(result).not.toContain('<h1');
    });

    it('includes preview text hidden div when present', () => {
      const result = exportEmailAsHTML({
        subjectLine: 'Subject',
        previewText: 'Preview here',
        body: 'Body',
        cta: 'CTA',
      });
      expect(result).toContain('display: none');
      expect(result).toContain('Preview here');
    });

    it('splits body into paragraphs', () => {
      const result = exportEmailAsHTML({
        subjectLine: 'Subject',
        body: 'Paragraph one\n\nParagraph two\n\nParagraph three',
        cta: 'CTA',
      });
      // Should have multiple <p> tags
      const pCount = (result.match(/<p style/g) || []).length;
      expect(pCount).toBe(3);
    });

    it('includes CTA button', () => {
      const result = exportEmailAsHTML({
        subjectLine: 'Subject',
        body: 'Body',
        cta: 'Get Started',
      });
      expect(result).toContain('Get Started');
    });

    it('converts newlines within paragraphs to br tags', () => {
      const result = exportEmailAsHTML({
        subjectLine: 'Subject',
        body: 'Line one\nLine two',
        cta: 'CTA',
      });
      expect(result).toContain('<br>');
    });
  });
});
