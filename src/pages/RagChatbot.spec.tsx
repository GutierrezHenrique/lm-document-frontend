import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import RagChatbot from './RagChatbot';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useRag, useRagDocuments } from '../hooks';

vi.mock('../api/client', () => ({
    api: {
        rag: {
            documents: vi.fn().mockResolvedValue([]),
        },
    },
}));

vi.mock('../hooks', () => ({
    useRagDocuments: vi.fn(() => ({ data: [], isLoading: false, refetch: vi.fn() })),
    useRagConversationMessages: vi.fn(() => ({ data: [], isLoading: false, isSuccess: true })),
    useRagPromptPreference: vi.fn(() => ({ data: null, isLoading: false, isSuccess: true })),
    useRag: vi.fn(() => ({
        uploadPdf: { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false },
        indexText: { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false },
        query: { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false },
        createConversation: { mutate: vi.fn(), mutateAsync: vi.fn(() => Promise.resolve({ conversationId: 'conv123' })), isPending: false },
        deleteConversation: { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false },
        savePromptPreference: { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false },
    })),
}));

vi.mock('../components/ui', () => ({
    PageHeader: ({ title }: any) => <div>{title}</div>,
    Card: ({ children, label }: any) => <div>{label}{children}</div>,
    EmptyState: ({ title }: any) => <div>{title}</div>,
    Button: ({ children, onClick, disabled, loading }: any) => <button onClick={onClick} disabled={disabled || loading}>{children}</button>,
    Textarea: (props: any) => <textarea {...props} />,
    Input: (props: any) => <input {...props} />,
    Alert: ({ children }: any) => <div>{children}</div>,
    Spinner: () => <div>Loading...</div>,
}));

vi.mock('react-markdown', () => ({
    default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('remark-gfm', () => ({
    default: () => { },
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

describe('RagChatbot', () => {
    it('renders search placeholder', () => {
        render(
            <MemoryRouter>
                <RagChatbot />
            </MemoryRouter>,
            { wrapper: createWrapper() }
        );
        expect(screen.getByPlaceholderText('rag.placeholder')).toBeInTheDocument();
    });

    it('displays documents in sidebar', () => {
        const mockDocs = [{ fileId: 'doc1.pdf', chunksCount: 5, createdAt: new Date().toISOString() }];
        vi.mocked(useRagDocuments).mockReturnValue({ data: mockDocs, isLoading: false, refetch: vi.fn() } as any);

        render(
            <MemoryRouter>
                <RagChatbot />
            </MemoryRouter>,
            { wrapper: createWrapper() }
        );

        expect(screen.getByText('doc1.pdf')).toBeInTheDocument();
    });

    it('can send a message when a document is selected', async () => {
        const mockDocs = [{ fileId: 'doc1.pdf', chunksCount: 5, createdAt: new Date().toISOString() }];
        const mockMutate = vi.fn();
        vi.mocked(useRagDocuments).mockReturnValue({ data: mockDocs, isLoading: false, refetch: vi.fn() } as any);
        vi.mocked(useRag).mockReturnValue({
            query: { mutate: mockMutate, isPending: false },
            uploadPdf: { mutate: vi.fn(), isPending: false },
            indexText: { mutate: vi.fn(), isPending: false },
            createConversation: { mutate: vi.fn(), isPending: false },
            deleteConversation: { mutate: vi.fn(), isPending: false },
            savePromptPreference: { mutate: vi.fn(), isPending: false },
        } as any);

        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <RagChatbot />
            </MemoryRouter>,
            { wrapper: createWrapper() }
        );

        // Select document
        await user.click(screen.getByText('doc1.pdf'));

        // Type question
        const input = screen.getByPlaceholderText('rag.placeholder');
        await user.type(input, 'Hello IA');

        // Click send (it's an icon button, let's find it by icon name or and role)
        const sendBtn = screen.getByTestId('icon-Send').closest('button');
        await user.click(sendBtn!);

        expect(mockMutate).toHaveBeenCalled();
    });

    it('can reset conversation', async () => {
        const mockDelete = vi.fn();
        const mockDocs = [{ fileId: 'doc1.pdf', chunksCount: 5, createdAt: new Date().toISOString() }];

        vi.mocked(useRagDocuments).mockReturnValue({ data: mockDocs, isLoading: false, refetch: vi.fn() } as any);
        vi.mocked(useRag).mockReturnValue({
            deleteConversation: { mutate: mockDelete, mutateAsync: vi.fn(), isPending: false },
            createConversation: { mutate: vi.fn(), mutateAsync: vi.fn(() => Promise.resolve({ conversationId: 'c1' })), isPending: false },
            query: { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false },
            uploadPdf: { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false },
            indexText: { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false },
            savePromptPreference: { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false },
        } as any);

        // Have a stored conversation so the Delete button is enabled when doc is selected
        localStorage.setItem('rag-conv-doc1.pdf', 'conv-123');

        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <RagChatbot />
            </MemoryRouter>,
            { wrapper: createWrapper() }
        );

        // Select document so the chat header and Delete button appear
        await user.click(screen.getByText('doc1.pdf'));

        const deleteBtn = await screen.findByRole('button', { name: /rag\.delete|Apagar|Delete/i });
        await user.click(deleteBtn);

        expect(mockDelete).toHaveBeenCalledWith('conv-123', expect.any(Object));
    });

    it('displays welcome message when no conversation', () => {
        render(
            <MemoryRouter>
                <RagChatbot />
            </MemoryRouter>,
            { wrapper: createWrapper() }
        );
        expect(screen.getByText('rag.welcomeBot')).toBeInTheDocument();
    });
});
