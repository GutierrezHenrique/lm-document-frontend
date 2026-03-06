import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from './Badge';

describe('Badge', () => {
    it('renders correctly with default variant', () => {
        render(<Badge>Test Badge</Badge>);
        const badge = screen.getByText('Test Badge');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass('bg-stone-700');
    });

    it('renders correctly with specific variant', () => {
        render(<Badge variant="high">High Priority</Badge>);
        const badge = screen.getByText('High Priority');
        expect(badge).toHaveClass('bg-orange-500/30');
    });

    it('renders with additional className', () => {
        render(<Badge className="custom-class">Badge</Badge>);
        const badge = screen.getByText('Badge');
        expect(badge).toHaveClass('custom-class');
    });
});
