import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

const RAG_DOCUMENTS_KEY = ['rag', 'documents'] as const;

export function useRagDocuments() {
  return useQuery({
    queryKey: RAG_DOCUMENTS_KEY,
    queryFn: () => api.rag.documents(),
  });
}

export function useRagConversationMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['rag', 'conversation', conversationId],
    queryFn: () => api.rag.getConversationMessages(conversationId!),
    enabled: !!conversationId,
  });
}

export function useRagDocumentChunks(fileId: string | null) {
  return useQuery({
    queryKey: ['rag', 'document', fileId, 'chunks'],
    queryFn: () => api.rag.getChunks(fileId!),
    enabled: !!fileId,
  });
}

export function useRagPromptPreference(fileId: string | null) {
  return useQuery({
    queryKey: ['rag', 'document', fileId, 'prompt-preference'],
    queryFn: () => api.rag.getPromptPreference(fileId!),
    enabled: !!fileId,
  });
}

export function useRag() {
  const queryClient = useQueryClient();

  const uploadPdf = useMutation({
    mutationFn: (file: File) => api.rag.uploadPdf(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RAG_DOCUMENTS_KEY }),
  });

  const indexText = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => api.rag.indexText(id, text),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RAG_DOCUMENTS_KEY }),
  });

  const query = useMutation({
    mutationFn: ({
      fileId,
      question,
      topK = 5,
      conversationId,
      customInstructions,
    }: {
      fileId: string;
      question: string;
      topK?: number;
      conversationId?: string;
      customInstructions?: string;
    }) => api.rag.query(fileId, question, topK, conversationId, customInstructions),
  });

  const createConversation = useMutation({
    mutationFn: (fileId: string) => api.rag.createConversation(fileId),
  });

  const deleteConversation = useMutation({
    mutationFn: (conversationId: string) => api.rag.deleteConversation(conversationId),
  });

  const deleteDocument = useMutation({
    mutationFn: (fileId: string) => api.rag.deleteDocument(fileId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RAG_DOCUMENTS_KEY }),
  });

  const savePromptPreference = useMutation({
    mutationFn: ({ fileId, customInstructions }: { fileId: string; customInstructions: string | null }) =>
      api.rag.savePromptPreference(fileId, customInstructions),
    onSuccess: (_, { fileId }) =>
      queryClient.invalidateQueries({ queryKey: ['rag', 'document', fileId, 'prompt-preference'] }),
  });

  return {
    uploadPdf,
    indexText,
    query,
    createConversation,
    deleteConversation,
    deleteDocument,
    savePromptPreference,
  };
}
