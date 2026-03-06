import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PdfViewerPage from './PdfViewerPage';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

describe('PdfViewerPage', () => {
    it('renders correctly with fileId from params', async () => {
        render(
            <MemoryRouter initialEntries={['/view/test-doc']}>
                <Routes>
                    <Route path="/view/:fileId" element={<PdfViewerPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('test-doc')).toBeInTheDocument();

        // Check initial page number from URL (defaults to 1)
        await waitFor(() => {
            expect(screen.getByText('1 / 10')).toBeInTheDocument();
        });
    });

    it('navigates pages', async () => {
        render(
            <MemoryRouter initialEntries={['/view/test-doc']}>
                <Routes>
                    <Route path="/view/:fileId" element={<PdfViewerPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => screen.getByText('1 / 10'));

        const buttons = screen.getAllByRole('button');
        // buttons[0] = ChevronLeft, buttons[1] = ChevronRight
        fireEvent.click(buttons[1]);

        expect(screen.getByText('2 / 10')).toBeInTheDocument();
    });

    it('zooms in and out', async () => {
        render(
            <MemoryRouter initialEntries={['/view/test-doc']}>
                <Routes>
                    <Route path="/view/:fileId" element={<PdfViewerPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('120%')).toBeInTheDocument();

        const zoomInBtn = screen.getAllByRole('button')[3]; // index 2 is ZoomOut, 3 is ZoomIn
        fireEvent.click(zoomInBtn);

        expect(screen.getByText('140%')).toBeInTheDocument();
    });
});
