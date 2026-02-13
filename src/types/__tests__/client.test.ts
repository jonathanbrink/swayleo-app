import { describe, it, expect } from 'vitest';
import {
  getApprovalStatus,
  ACCESS_LEVELS,
  APPROVAL_STATUSES,
} from '../client';

describe('client types', () => {
  describe('ACCESS_LEVELS', () => {
    it('has exactly 3 access levels', () => {
      expect(ACCESS_LEVELS).toHaveLength(3);
    });

    it('includes view, review, and approve', () => {
      const ids = ACCESS_LEVELS.map(l => l.id);
      expect(ids).toEqual(['view', 'review', 'approve']);
    });

    it('all levels have id, name, and description', () => {
      for (const level of ACCESS_LEVELS) {
        expect(level.id).toBeDefined();
        expect(level.name).toBeDefined();
        expect(level.description).toBeDefined();
        expect(level.description.length).toBeGreaterThan(0);
      }
    });
  });

  describe('APPROVAL_STATUSES', () => {
    it('has exactly 4 statuses', () => {
      expect(APPROVAL_STATUSES).toHaveLength(4);
    });

    it('includes all status types', () => {
      const ids = APPROVAL_STATUSES.map(s => s.id);
      expect(ids).toContain('pending');
      expect(ids).toContain('approved');
      expect(ids).toContain('rejected');
      expect(ids).toContain('revision_requested');
    });

    it('all statuses have id, name, and color', () => {
      for (const status of APPROVAL_STATUSES) {
        expect(status.id).toBeDefined();
        expect(status.name).toBeDefined();
        expect(status.color).toBeDefined();
      }
    });
  });

  describe('getApprovalStatus()', () => {
    it('returns correct status for "pending"', () => {
      const status = getApprovalStatus('pending');
      expect(status.name).toBe('Pending Review');
      expect(status.color).toBe('amber');
    });

    it('returns correct status for "approved"', () => {
      const status = getApprovalStatus('approved');
      expect(status.name).toBe('Approved');
      expect(status.color).toBe('emerald');
    });

    it('returns correct status for "rejected"', () => {
      const status = getApprovalStatus('rejected');
      expect(status.name).toBe('Rejected');
      expect(status.color).toBe('red');
    });

    it('returns correct status for "revision_requested"', () => {
      const status = getApprovalStatus('revision_requested');
      expect(status.name).toBe('Revision Requested');
      expect(status.color).toBe('blue');
    });

    it('falls back to first status for unknown value', () => {
      const status = getApprovalStatus('unknown' as any);
      expect(status).toEqual(APPROVAL_STATUSES[0]);
    });
  });
});
