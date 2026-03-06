import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
    it('renders correctly', () => {
        render(<Input label="Name" placeholder="Enter name" />);
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
    });

    it('calls onChange when value changes', () => {
        const handleChange = vi.fn();
        render(<Input onChange={handleChange} />);
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'test' } });
        expect(handleChange).toHaveBeenCalled();
    });

    it('shows error message', () => {
        render(<Input error="Field required" />);
        expect(screen.getByText('Field required')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('shows hint message when no error', () => {
        render(<Input hint="Type something" />);
        expect(screen.getByText('Type something')).toBeInTheDocument();
    });

    it('does not show hint message when error exists', () => {
        render(<Input hint="Hint" error="Error" />);
        expect(screen.queryByText('Hint')).not.toBeInTheDocument();
        expect(screen.getByText('Error')).toBeInTheDocument();
    });
});
