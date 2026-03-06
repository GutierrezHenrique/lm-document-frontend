import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import KnowledgeBase from './KnowledgeBase';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useRagDocuments } from '../hooks';

vi.mock('../api/client', () => ({
    api: {
        rag: {
            documents: vi.fn().mockResolvedValue([]),
            filterKnowledge: vi.fn(),
        },
    },
}));

vi.mock('../components/ui', () => ({
    PageHeader: ({ title }: any) => <div>{title}</div>,
    Card: ({ children }: any) => <div>{children}</div>,
    EmptyState: () => <div>Empty</div>,
    Button: ({ children, onClick, disabled }: any) => <button onClick={onClick} disabled={disabled}>{children}</button>,
    Textarea: (props: any) => <textarea {...props} />,
    Input: (props: any) => <input {...props} />,
    Badge: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('../hooks', () => ({
    useRagDocuments: vi.fn(() => ({ data: [], isLoading: false })),
    useRagDocumentChunks: vi.fn(() => ({ data: [], isLoading: false })),
    useRag: vi.fn(() => ({
        uploadPdf: { mutate: vi.fn(), isPending: false },
        indexText: { mutate: vi.fn(), isPending: false },
        query: { mutate: vi.fn(), isPending: false },
        createConversation: { mutate: vi.fn(), isPending: false },
        deleteConversation: { mutate: vi.fn(), isPending: false },
        savePromptPreference: { mutate: vi.fn(), isPending: false },
    })),
}));

vi.mock('../contexts/ToastContext', () => ({
    ToastProvider: ({ children }: any) => <div>{children}</div>,
    useToast: () => ({
        addToast: vi.fn(),
        removeToast: vi.fn(),
        toasts: [],
    }),
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

describe('KnowledgeBase', () => {
    it('renders the page title', () => {
        render(
            <MemoryRouter>
                <KnowledgeBase />
            </MemoryRouter>,
            { wrapper: createWrapper() }
        );
        expect(screen.getByText('knowledgeBase.title')).toBeInTheDocument();
    });

    it('renders loading state', () => {
        vi.mocked(useRagDocuments).mockReturnValue({ data: [], isLoading: true } as any);
        render(
            <MemoryRouter>
                <KnowledgeBase />
            </MemoryRouter>,
            { wrapper: createWrapper() }
        );
        expect(screen.getByText('knowledgeBase.loadingDocs')).toBeInTheDocument();
    });

    it('renders documents and categories', () => {
        const mockDocs = [
            { fileId: 'doc1.pdf', category: 'Finance', chunksCount: 10, createdAt: new Date().toISOString() },
            { fileId: 'doc2.pdf', category: 'Legal', chunksCount: 20, createdAt: new Date().toISOString() },
        ];
        vi.mocked(useRagDocuments).mockReturnValue({ data: mockDocs, isLoading: false } as any);

        render(
            <MemoryRouter>
                <KnowledgeBase />
            </MemoryRouter>,
            { wrapper: createWrapper() }
        );

        expect(screen.getByText('doc1.pdf')).toBeInTheDocument();
        expect(screen.getByText('doc2.pdf')).toBeInTheDocument();
        expect(screen.getAllByText('Finance').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Legal').length).toBeGreaterThan(0);
    });

    it('filters documents by local search', async () => {
        const mockDocs = [
            { fileId: 'finance-report.pdf', category: 'Finance', chunksCount: 10, createdAt: new Date().toISOString() },
            { fileId: 'legal-docs.pdf', category: 'Legal', chunksCount: 20, createdAt: new Date().toISOString() },
        ];
        vi.mocked(useRagDocuments).mockReturnValue({ data: mockDocs, isLoading: false } as any);
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <KnowledgeBase />
            </MemoryRouter>,
            { wrapper: createWrapper() }
        );

        const searchInput = screen.getByPlaceholderText('knowledgeBase.localSearch');
        await user.type(searchInput, 'finance');

        expect(screen.getByText('finance-report.pdf')).toBeInTheDocument();
        expect(screen.queryByText('legal-docs.pdf')).not.toBeInTheDocument();

        // Clear search
        const clearBtn = screen.getByLabelText('clear-search');
        await user.click(clearBtn);
        expect(screen.getByText('legal-docs.pdf')).toBeInTheDocument();
    });

    it('applies AI filter', async () => {
        const mockDocs = [{ fileId: 'ai-result.pdf', category: 'AI', chunksCount: 5, createdAt: new Date().toISOString(), chunks: [] }];
        const { api } = await import('../api/client');
        (api.rag.filterKnowledge as any).mockResolvedValue({ documents: mockDocs });
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <KnowledgeBase />
            </MemoryRouter>,
            { wrapper: createWrapper() }
        );

        const aiSearchInput = screen.getByPlaceholderText('knowledgeBase.filterPlaceholder');
        await user.type(aiSearchInput, 'find AI stuff');

        const searchBtn = screen.getByText('knowledgeBase.applyFilter');
        await user.click(searchBtn);

        await waitFor(() => expect(screen.getByText('ai-result.pdf')).toBeInTheDocument());
        expect(api.rag.filterKnowledge).toHaveBeenCalled();
    });
});
