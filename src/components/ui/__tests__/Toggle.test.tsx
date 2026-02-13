import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toggle } from '../Toggle';

describe('Toggle', () => {
  it('renders with label', () => {
    render(<Toggle label="Enable feature" checked={false} onChange={vi.fn()} />);
    expect(screen.getByText('Enable feature')).toBeInTheDocument();
  });

  it('renders with description', () => {
    render(
      <Toggle
        label="Enable"
        description="This turns on the feature"
        checked={false}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText('This turns on the feature')).toBeInTheDocument();
  });

  it('calls onChange with toggled value when clicked', () => {
    const onChange = vi.fn();
    render(<Toggle label="Toggle" checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false when unchecking', () => {
    const onChange = vi.fn();
    render(<Toggle label="Toggle" checked={true} onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('has correct aria-checked when checked', () => {
    render(<Toggle label="Toggle" checked={true} onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('has correct aria-checked when unchecked', () => {
    render(<Toggle label="Toggle" checked={false} onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('does not call onChange when disabled', () => {
    const onChange = vi.fn();
    render(<Toggle label="Toggle" checked={false} onChange={onChange} disabled />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('has role="switch"', () => {
    render(<Toggle label="Toggle" checked={false} onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });
});
