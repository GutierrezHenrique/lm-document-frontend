import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRag, useRagDocuments, useRagConversationMessages, useRagDocumentChunks, useRagPromptPreference } from './useRag';
import { api } from '../api/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../api/client', () => ({
    api: {
        rag: {
            documents: vi.fn(),
            uploadPdf: vi.fn(),
            indexText: vi.fn(),
            query: vi.fn(),
            createConversation: vi.fn(),
            deleteConversation: vi.fn(),
            savePromptPreference: vi.fn(),
            getConversationMessages: vi.fn(),
            getChunks: vi.fn(),
            getPromptPreference: vi.fn(),
        },
    },
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useRag', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('useRagDocuments calls api.rag.documents', async () => {
        const mockDocs = [{ fileId: 'doc1', chunksCount: 5, createdAt: new Date().toISOString() }];
        (api.rag.documents as any).mockResolvedValue(mockDocs);

        const { result } = renderHook(() => useRagDocuments(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockDocs);
        expect(api.rag.documents).toHaveBeenCalled();
    });

    it('useRag returns mutation functions', () => {
        const { result } = renderHook(() => useRag(), { wrapper: createWrapper() });
        expect(result.current.uploadPdf).toBeDefined();
        expect(result.current.query).toBeDefined();
    });

    it('uploadPdf calls api.rag.uploadPdf', async () => {
        const { result } = renderHook(() => useRag(), { wrapper: createWrapper() });
        const file = new File([''], 'test.pdf', { type: 'application/pdf' });
        (api.rag.uploadPdf as any).mockResolvedValue({ fileId: 'f1' });

        await result.current.uploadPdf.mutateAsync(file);
        expect(api.rag.uploadPdf).toHaveBeenCalledWith(file);
    });

    it('useRagConversationMessages calls api.rag.getConversationMessages', async () => {
        const mockMsgs = [{ id: '1', role: 'user', content: 'hi' }];
        (api.rag.getConversationMessages as any).mockResolvedValue(mockMsgs);

        const { result } = renderHook(() => useRagConversationMessages('conv1'), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockMsgs);
        expect(api.rag.getConversationMessages).toHaveBeenCalledWith('conv1');
    });

    it('useRagDocumentChunks calls api.rag.getChunks', async () => {
        const mockChunks = [{ id: 'c1', text: 'chunk1' }];
        (api.rag.getChunks as any).mockResolvedValue(mockChunks);

        const { result } = renderHook(() => useRagDocumentChunks('doc1'), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockChunks);
        expect(api.rag.getChunks).toHaveBeenCalledWith('doc1');
    });

    it('savePromptPreference calls api.rag.savePromptPreference', async () => {
        const { result } = renderHook(() => useRag(), { wrapper: createWrapper() });
        (api.rag.savePromptPreference as any).mockResolvedValue({ success: true });

        await result.current.savePromptPreference.mutateAsync({ fileId: 'doc1', customInstructions: 'test' });
        expect(api.rag.savePromptPreference).toHaveBeenCalledWith('doc1', 'test');
    });

    it('query calls api.rag.query', async () => {
        const { result } = renderHook(() => useRag(), { wrapper: createWrapper() });
        const mockResponse = { answer: 'response', snippets: [], conversationId: 'c1' };
        (api.rag.query as any).mockResolvedValue(mockResponse);

        await result.current.query.mutateAsync({ fileId: 'doc1', question: 'testing' });
        expect(api.rag.query).toHaveBeenCalledWith('doc1', 'testing', 5, undefined, undefined);
    });

    it('useRagPromptPreference calls api.rag.getPromptPreference', async () => {
        const mockPref = { customInstructions: 'instr' };
        (api.rag.getPromptPreference as any).mockResolvedValue(mockPref);

        const { result } = renderHook(() => useRagPromptPreference('doc1'), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockPref);
        expect(api.rag.getPromptPreference).toHaveBeenCalledWith('doc1');
    });

    it('indexText calls api.rag.indexText', async () => {
        const { result } = renderHook(() => useRag(), { wrapper: createWrapper() });
        (api.rag.indexText as any).mockResolvedValue({ success: true });

        await result.current.indexText.mutateAsync({ id: 'doc1', text: 'content' });
        expect(api.rag.indexText).toHaveBeenCalledWith('doc1', 'content');
    });

    it('createConversation calls api.rag.createConversation', async () => {
        const { result } = renderHook(() => useRag(), { wrapper: createWrapper() });
        (api.rag.createConversation as any).mockResolvedValue({ conversationId: 'c1' });

        await result.current.createConversation.mutateAsync('doc1');
        expect(api.rag.createConversation).toHaveBeenCalledWith('doc1');
    });

    it('deleteConversation calls api.rag.deleteConversation', async () => {
        const { result } = renderHook(() => useRag(), { wrapper: createWrapper() });
        (api.rag.deleteConversation as any).mockResolvedValue({ success: true });

        await result.current.deleteConversation.mutateAsync('conv1');
        expect(api.rag.deleteConversation).toHaveBeenCalledWith('conv1');
    });
});
