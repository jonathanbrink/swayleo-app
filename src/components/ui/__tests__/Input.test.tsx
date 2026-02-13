import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../Input';

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<Input placeholder="Enter email" />);
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('shows required indicator', () => {
    render(<Input label="Name" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('handles onChange', () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} placeholder="test" />);
    fireEvent.change(screen.getByPlaceholderText('test'), { target: { value: 'hello' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('applies error styling when error is present', () => {
    render(<Input error="Error!" placeholder="test" />);
    const input = screen.getByPlaceholderText('test');
    expect(input.className).toContain('border-red-300');
  });

  it('is disabled when disabled prop is set', () => {
    render(<Input disabled placeholder="test" />);
    expect(screen.getByPlaceholderText('test')).toBeDisabled();
  });

  it('renders without label', () => {
    const { container } = render(<Input placeholder="No label" />);
    expect(container.querySelector('label')).toBeNull();
  });
});
