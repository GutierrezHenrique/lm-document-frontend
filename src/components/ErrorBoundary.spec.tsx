import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

const ProblemChild = () => {
    throw new Error('Test error');
};

describe('ErrorBoundary', () => {
    it('renders children when no error', () => {
        render(
            <ErrorBoundary>
                <div>Safe Content</div>
            </ErrorBoundary>
        );
        expect(screen.getByText('Safe Content')).toBeInTheDocument();
    });

    it('renders error message when error occurs', () => {
        // Suppress console.error for this test as we expect an error
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });

        render(
            <ErrorBoundary>
                <ProblemChild />
            </ErrorBoundary>
        );

        expect(screen.getByText('error.somethingWentWrong')).toBeInTheDocument();
        expect(screen.getByText('Test error')).toBeInTheDocument();

        spy.mockRestore();
    });

    it('renders fallback when specified', () => {
        vi.spyOn(console, 'error').mockImplementation(() => { });
        render(
            <ErrorBoundary fallback={<div>Custom Fallback</div>}>
                <ProblemChild />
            </ErrorBoundary>
        );
        expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
    });

    it('retries on button click', () => {
        vi.spyOn(console, 'error').mockImplementation(() => { });
        render(
            <ErrorBoundary>
                <ProblemChild />
            </ErrorBoundary>
        );

        expect(screen.getByText('Test error')).toBeInTheDocument();

        fireEvent.click(screen.getByText('common.tryAgain'));

        // After retry, it should try to render children again
        // In this test, it will throw again, but we just want to see it reset state
    });
});
