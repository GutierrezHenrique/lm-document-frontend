import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SplashScreen } from './SplashScreen';

describe('SplashScreen', () => {
    it('renders when isLoading is true', () => {
        render(<SplashScreen isLoading={true} />);
        expect(screen.getByText('Nexova AI')).toBeInTheDocument();
        expect(screen.getByText('GraduationCap')).toBeInTheDocument();
    });

    it('does not render when isLoading is false', () => {
        render(<SplashScreen isLoading={false} />);
        expect(screen.queryByText('Nexova AI')).not.toBeInTheDocument();
    });
});
