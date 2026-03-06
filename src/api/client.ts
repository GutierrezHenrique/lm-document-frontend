import axios, { type AxiosRequestConfig } from 'axios';

/**
 * Base URL do backend. Use a variável de ambiente VITE_API_BASE_URL para apontar
 * para o backend (ex.: http://localhost:3001). Se não definida, usa '/api' e o
 * proxy do Vite em dev encaminha para o backend.
 */
const getBaseUrl = (): string => {
  const env = import.meta.env.VITE_API_BASE_URL;
  if (env && typeof env === 'string') {
    return env.replace(/\/$/, '');
  }
  return '/api';
};

const baseURL = getBaseUrl();

/** Exposto para construir URLs de recursos (ex.: PDFs em /uploads/...). */
export const apiBaseUrl = baseURL;

const client = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data != null && typeof err.response.data === 'string'
        ? err.response.data
        : err.response?.data?.message ?? err.message ?? 'Request failed';
    throw new Error(message);
  }
);

async function request<T>(path: string, options?: AxiosRequestConfig): Promise<T> {
  const { data } = await client.request<T>({ url: path, ...options });
  return data;
}

export async function uploadForm<T>(path: string, form: FormData): Promise<T> {
  const { data } = await client.post<T>(path, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export const api = {
  rag: {
    documents: () =>
      request<{ fileId: string; chunksCount: number; createdAt: string; category?: string | null; keywords?: string[] | null }[]>('/rag/documents'),
    uploadPdf: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return uploadForm<{ fileId: string; chunks: number; category?: string; keywords?: string[] }>('/rag/upload-pdf', form);
    },
    indexText: (fileId: string, text: string) =>
      request<{ fileId: string; chunks: number; category?: string; keywords?: string[] }>('/rag/index-text', {
        method: 'POST',
        data: { fileId, text },
      }),
    query: (fileId: string, question: string, topK?: number, conversationId?: string, customInstructions?: string) =>
      request<{ answer: string; snippets: string[]; conversationId: string; snippetSourceFileIds?: string[] }>('/rag/query', {
        method: 'POST',
        data: { fileId, question, topK, conversationId, customInstructions },
      }),
    getChunks: (fileId: string) =>
      request<{ id: string; text: string; keywords: string[] }[]>(`/rag/documents/${encodeURIComponent(fileId)}/chunks`),
    filterKnowledge: (filterDescription: string) =>
      request<{ documents: { fileId: string; chunksCount: number; category?: string | null; keywords?: string[] | null; createdAt: string; chunks: { id: string; text: string; keywords: string[] }[] }[] }>('/rag/filter', {
        method: 'POST',
        data: { filterDescription },
      }),
    getPromptPreference: (fileId: string) =>
      request<{ customInstructions: string | null }>(`/rag/documents/${encodeURIComponent(fileId)}/prompt-preference`),
    savePromptPreference: (fileId: string, customInstructions: string | null) =>
      request<{ success: boolean }>(`/rag/documents/${encodeURIComponent(fileId)}/prompt-preference`, {
        method: 'PUT',
        data: { customInstructions },
      }),
    createConversation: (fileId: string) =>
      request<{ conversationId: string }>(`/rag/documents/${encodeURIComponent(fileId)}/conversations`, {
        method: 'POST',
      }),
    getConversationMessages: (conversationId: string) =>
      request<{ id: string; role: string; content: string; snippets?: string[] | null; createdAt: string }[]>(
        `/rag/conversations/${encodeURIComponent(conversationId)}/messages`
      ),
    deleteConversation: (conversationId: string) =>
      request<{ success: boolean }>(`/rag/conversations/${encodeURIComponent(conversationId)}`, {
        method: 'DELETE',
      }),
    deleteDocument: (fileId: string) =>
      request<{ success: boolean }>(`/rag/documents/${encodeURIComponent(fileId)}`, {
        method: 'DELETE',
      }),
  },
};
