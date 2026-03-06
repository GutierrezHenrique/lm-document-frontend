import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Alert, Card, FileInput, Textarea, Skeleton, SkeletonListItem } from './';

describe('More UI Components', () => {
    it('Alert renders title and message', () => {
        render(<Alert title="Warning" variant="info">Be careful</Alert>);
        expect(screen.getByText('Warning')).toBeInTheDocument();
        expect(screen.getByText('Be careful')).toBeInTheDocument();
    });

    it('Card renders children', () => {
        render(<Card>Card Content</Card>);
        expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('FileInput calls onChange', () => {
        const handleChange = vi.fn();
        render(<FileInput onChange={handleChange} />);
        const input = screen.getByTestId('file-input'); // Need to check if it has this test id
        const file = new File([''], 'test.txt', { type: 'text/plain' });
        fireEvent.change(input, { target: { files: [file] } });
        expect(handleChange).toHaveBeenCalled();
    });

    it('Textarea calls onChange', () => {
        const handleChange = vi.fn();
        render(<Textarea label="Bio" onChange={handleChange} />);
        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: 'my bio' } });
        expect(handleChange).toHaveBeenCalled();
    });

    it('Skeleton renders', () => {
        const { container } = render(<Skeleton />);
        expect(container.firstChild).toBeInTheDocument();
        expect(container.firstChild).toHaveClass('animate-pulse');
    });

    it('Skeleton without pulse', () => {
        const { container } = render(<Skeleton pulse={false} />);
        expect(container.firstChild).not.toHaveClass('animate-pulse');
    });

    it('SkeletonListItem renders multiple skeletons', () => {
        const { container } = render(<SkeletonListItem />);
        const skeletons = container.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBe(3);
    });
});
