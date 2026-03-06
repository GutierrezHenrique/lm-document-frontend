import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
    it('renders title', () => {
        render(<PageHeader title="Test Title" />);
        expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('renders description', () => {
        render(<PageHeader title="Test Title" description="Test Description" />);
        expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('renders actions', () => {
        render(
            <PageHeader
                title="Test Title"
                actions={<button>Action Button</button>}
            />
        );
        expect(screen.getByText('Action Button')).toBeInTheDocument();
    });
});
