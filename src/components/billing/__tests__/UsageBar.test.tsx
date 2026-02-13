import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UsageBar } from '../UsageBar';

describe('UsageBar', () => {
  it('renders label', () => {
    render(<UsageBar label="Emails" current={5} limit={10} />);
    expect(screen.getByText('Emails')).toBeInTheDocument();
  });

  it('renders current / limit text', () => {
    render(<UsageBar label="Emails" current={5} limit={10} />);
    expect(screen.getByText('5 / 10')).toBeInTheDocument();
  });

  it('shows "Unlimited" when limit is -1', () => {
    render(<UsageBar label="Emails" current={50} limit={-1} />);
    expect(screen.getByText('50 / Unlimited')).toBeInTheDocument();
  });

  it('shows warning message near limit (80%+)', () => {
    render(<UsageBar label="Emails" current={85} limit={100} />);
    expect(screen.getByText(/approaching your limit/i)).toBeInTheDocument();
  });

  it('shows at-limit message when at limit', () => {
    render(<UsageBar label="Emails" current={100} limit={100} />);
    expect(screen.getByText(/reached your limit/i)).toBeInTheDocument();
  });

  it('does not show warning when under 80%', () => {
    render(<UsageBar label="Emails" current={50} limit={100} />);
    expect(screen.queryByText(/approaching/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reached/i)).not.toBeInTheDocument();
  });

  it('does not show warning when unlimited', () => {
    render(<UsageBar label="Emails" current={1000} limit={-1} />);
    expect(screen.queryByText(/approaching/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reached/i)).not.toBeInTheDocument();
  });

  it('does not show warning when showWarning is false', () => {
    render(<UsageBar label="Emails" current={100} limit={100} showWarning={false} />);
    expect(screen.queryByText(/reached/i)).not.toBeInTheDocument();
  });

  it('applies red color text when at limit', () => {
    render(<UsageBar label="Emails" current={10} limit={10} />);
    const valueText = screen.getByText('10 / 10');
    expect(valueText.className).toContain('text-red-600');
  });

  it('applies amber color text near limit', () => {
    render(<UsageBar label="Emails" current={8} limit={10} />);
    const valueText = screen.getByText('8 / 10');
    expect(valueText.className).toContain('text-amber-600');
  });

  it('formats large numbers with commas', () => {
    render(<UsageBar label="Emails" current={1500} limit={5000} />);
    expect(screen.getByText('1,500 / 5,000')).toBeInTheDocument();
  });
});
