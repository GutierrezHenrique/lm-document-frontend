import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EmptyState, Logo, Spinner, Skeleton } from './';

describe('Simple UI Components', () => {
    it('EmptyState renders title and icon', () => {
        render(<EmptyState title="No items" icon={<span>Icon</span>} />);
        expect(screen.getByText('No items')).toBeInTheDocument();
        expect(screen.getByText('Icon')).toBeInTheDocument();
    });

    it('Logo renders with text and icon', () => {
        render(<Logo />);
        expect(screen.getByText('Nexova AI')).toBeInTheDocument();
        expect(screen.getByText('GraduationCap')).toBeInTheDocument();
    });

    it('Spinner renders with loading label', () => {
        render(<Spinner />);
        expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    });

    it('Skeleton renders correctly', () => {
        const { container } = render(<Skeleton className="w-10 h-10" />);
        expect(container.firstChild).toHaveClass('animate-pulse');
    });
});
