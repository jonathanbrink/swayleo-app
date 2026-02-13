import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click events', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinner when loading', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole('button');
    // The Loader2 icon should be rendered as an SVG
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('is disabled when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not fire onClick when disabled', () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders with primary variant by default', () => {
    render(<Button>Primary</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-sway-500');
  });

  it('renders secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-slate-100');
  });

  it('renders danger variant', () => {
    render(<Button variant="danger">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-red-500');
  });

  it('renders ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('hover:bg-slate-100');
  });

  it('renders outline variant', () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('border-2');
  });

  it('renders small size', () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('px-3');
  });

  it('renders medium size by default', () => {
    render(<Button>Medium</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('px-5');
  });

  it('renders large size', () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('px-6');
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
  });
});
