import { describe, it, expect } from 'vitest';
import {
  getPlan,
  isUnlimited,
  formatLimit,
  SUBSCRIPTION_PLANS,
} from '../billing';

describe('billing types', () => {
  describe('SUBSCRIPTION_PLANS', () => {
    it('has exactly 4 plans', () => {
      expect(SUBSCRIPTION_PLANS).toHaveLength(4);
    });

    it('plans are in order: free, starter, professional, agency', () => {
      expect(SUBSCRIPTION_PLANS.map(p => p.id)).toEqual([
        'free', 'starter', 'professional', 'agency',
      ]);
    });

    it('all plans have required fields', () => {
      for (const plan of SUBSCRIPTION_PLANS) {
        expect(plan.id).toBeDefined();
        expect(plan.name).toBeDefined();
        expect(plan.description).toBeDefined();
        expect(plan.monthlyPrice).toBeGreaterThanOrEqual(0);
        expect(plan.yearlyPrice).toBeGreaterThanOrEqual(0);
        expect(plan.limits).toBeDefined();
        expect(plan.features).toBeDefined();
        expect(plan.features.length).toBeGreaterThan(0);
      }
    });

    it('free plan has $0 pricing', () => {
      const free = SUBSCRIPTION_PLANS.find(p => p.id === 'free')!;
      expect(free.monthlyPrice).toBe(0);
      expect(free.yearlyPrice).toBe(0);
    });

    it('professional plan is highlighted', () => {
      const pro = SUBSCRIPTION_PLANS.find(p => p.id === 'professional')!;
      expect(pro.highlighted).toBe(true);
    });

    it('agency plan has unlimited (-1) limits', () => {
      const agency = SUBSCRIPTION_PLANS.find(p => p.id === 'agency')!;
      expect(agency.limits.brands).toBe(-1);
      expect(agency.limits.emailsPerMonth).toBe(-1);
      expect(agency.limits.teamMembers).toBe(-1);
      expect(agency.limits.templates).toBe(-1);
    });

    it('free plan has strict limits', () => {
      const free = SUBSCRIPTION_PLANS.find(p => p.id === 'free')!;
      expect(free.limits.brands).toBe(1);
      expect(free.limits.emailsPerMonth).toBe(10);
      expect(free.limits.teamMembers).toBe(1);
      expect(free.limits.templates).toBe(3);
      expect(free.limits.apiAccess).toBe(false);
    });

    it('yearly pricing provides discount over monthly', () => {
      for (const plan of SUBSCRIPTION_PLANS) {
        if (plan.monthlyPrice > 0) {
          expect(plan.yearlyPrice).toBeLessThan(plan.monthlyPrice * 12);
        }
      }
    });
  });

  describe('getPlan()', () => {
    it('returns Free plan for "free"', () => {
      const plan = getPlan('free');
      expect(plan.id).toBe('free');
      expect(plan.name).toBe('Free');
    });

    it('returns Starter plan for "starter"', () => {
      const plan = getPlan('starter');
      expect(plan.id).toBe('starter');
      expect(plan.monthlyPrice).toBe(29);
    });

    it('returns Professional plan for "professional"', () => {
      const plan = getPlan('professional');
      expect(plan.id).toBe('professional');
      expect(plan.monthlyPrice).toBe(79);
    });

    it('returns Agency plan for "agency"', () => {
      const plan = getPlan('agency');
      expect(plan.id).toBe('agency');
      expect(plan.monthlyPrice).toBe(199);
    });

    it('falls back to Free plan for unknown tier', () => {
      const plan = getPlan('nonexistent' as any);
      expect(plan.id).toBe('free');
    });
  });

  describe('isUnlimited()', () => {
    it('returns true for -1', () => {
      expect(isUnlimited(-1)).toBe(true);
    });

    it('returns false for positive numbers', () => {
      expect(isUnlimited(5)).toBe(false);
      expect(isUnlimited(100)).toBe(false);
    });

    it('returns false for 0', () => {
      expect(isUnlimited(0)).toBe(false);
    });
  });

  describe('formatLimit()', () => {
    it('returns "Unlimited" for -1', () => {
      expect(formatLimit(-1)).toBe('Unlimited');
    });

    it('formats small numbers', () => {
      expect(formatLimit(100)).toBe('100');
      expect(formatLimit(5)).toBe('5');
    });

    it('formats large numbers with commas', () => {
      expect(formatLimit(1000)).toBe('1,000');
      expect(formatLimit(10000)).toBe('10,000');
    });

    it('formats zero', () => {
      expect(formatLimit(0)).toBe('0');
    });
  });
});
