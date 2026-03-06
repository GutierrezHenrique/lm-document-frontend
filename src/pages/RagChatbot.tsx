import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, Textarea, Alert, PageHeader, EmptyState, Spinner } from '../components/ui';
import { apiBaseUrl } from '../api/client';
import { useRag, useRagDocuments, useRagConversationMessages, useRagPromptPreference } from '../hooks';
import { useToast } from '../contexts/ToastContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, FileText, FileUp, Loader2, BookOpen, Trash2, RotateCcw, Copy, X, RefreshCw, ChevronDown, ChevronRight, Mic, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'text/csv': ['.csv'],
  'application/json': ['.json'],
} as const;
const ACCEPT_STRING = Object.keys(ACCEPTED_FILE_TYPES).join(',') + ',.pdf,.txt,.md,.csv,.json';
const TEXT_EXTENSIONS = new Set(['.txt', '.md', '.csv', '.json']);
function isTextFile(file: File): boolean {
  const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
  return TEXT_EXTENSIONS.has(ext);
}

const RAG_CONV_KEY = (fileId: string) => `rag-conv-${fileId}`;

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  snippets?: string[];
  /** When querying entire base (fileId 'all'), source fileId per snippet for PDF links */
  snippetSourceFileIds?: string[];
  isThinking?: boolean;
  feedback?: 'up' | 'down' | null;
};

export default function RagChatbot() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileFromUrl = searchParams.get('file');
  const chunkTextFromUrl = searchParams.get('chunkText');
  const [fileId, setFileId] = useState<string | null>(fileFromUrl || null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [textInput, setTextInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);
  const [topK, setTopK] = useState(5);
  const [customInstructions, setCustomInstructions] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addToast } = useToast();
  const { uploadPdf, indexText, query, createConversation, deleteConversation, deleteDocument, savePromptPreference } = useRag();
  const { data: documents = [], isLoading: documentsLoading, refetch: refetchDocuments } = useRagDocuments();
  const { data: savedMessages, isSuccess: savedMessagesLoaded } = useRagConversationMessages(conversationId);
  const { data: promptPreference, isSuccess: promptPreferenceLoaded } = useRagPromptPreference(fileId);
  const [customInstructionsOpen, setCustomInstructionsOpen] = useState(false);
  /** No mobile: alterna entre ver Chat ou Documentos */
  const [mobileTab, setMobileTab] = useState<'chat' | 'documents'>('chat');

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [loadedPrefFor, setLoadedPrefFor] = useState<string | null>(null);
  const [expandedSnippets, setExpandedSnippets] = useState<Record<string, boolean>>({});
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  const toggleSnippets = (msgId: string) => {
    setExpandedSnippets(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window))) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = i18n.language || 'pt-BR';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          if (event.results[event.results.length - 1].isFinal) {
            setQuestion(prev => (prev + ' ' + transcript).trim());
          }
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }
  }, [i18n.language]);

  const toggleDictation = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        setQuestion('');
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        addToast(t('rag.speechNotSupported', 'Seu navegador não suporta digitação por voz.'), 'error');
      }
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (fileFromUrl && fileFromUrl !== fileId) setFileId(fileFromUrl);
  }, [fileFromUrl]);

  useEffect(() => {
    if (chunkTextFromUrl) {
      setQuestion(prev => `Com base no trecho: "${chunkTextFromUrl}"\n\n${prev}`);
      searchParams.delete('chunkText');
      setSearchParams(searchParams, { replace: true });
    }
  }, [chunkTextFromUrl, searchParams, setSearchParams]);

  useEffect(() => {
    if (!fileId) {
      setConversationId(null);
      setMessages([]);
      setCustomInstructions('');
      return;
    }
    setMessages([]);
    const stored = localStorage.getItem(RAG_CONV_KEY(fileId));
    if (stored) setConversationId(stored);
    else setConversationId(null);
  }, [fileId]);

  useEffect(() => {
    if (promptPreferenceLoaded && promptPreference != null && fileId !== loadedPrefFor) {
      setCustomInstructions(promptPreference.customInstructions ?? '');
      setLoadedPrefFor(fileId);
    }
  }, [fileId, promptPreferenceLoaded, promptPreference, loadedPrefFor]);

  useEffect(() => {
    if (!conversationId || !savedMessagesLoaded || !savedMessages?.length) return;
    setMessages((prev) => {
      if (prev.length > 0) return prev;
      return savedMessages.map((m, i) => ({
        id: m.id || `msg-${i}`,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        snippets: m.snippets ?? undefined,
      }));
    });
  }, [conversationId, savedMessagesLoaded, savedMessages]);

  const handleIndexedSuccess = (data: { fileId: string; chunks: number; category?: string; keywords?: string[] }) => {
    setFileId(data.fileId);
    const msg = data.category
      ? t('rag.indexedWithCategory', 'Documento adicionado. A IA identificou como “{{category}}” e vai usar {{chunks}} trechos para responder.', { chunks: data.chunks, category: data.category })
      : t('rag.indexedSuccess', 'Documento adicionado. A IA vai usar {{chunks}} trechos para responder às suas perguntas.', { chunks: data.chunks });
    addToast(msg, 'success');
    setUploadingFileName(null);
  };

  const processFile = async (file: File) => {
    if (isTextFile(file)) {
      const text = await file.text();
      const id = file.name.replace(/\.[^.]+$/, '') || `doc-${Date.now()}`;
      setUploadingFileName(file.name);
      indexText.mutate(
        { id, text },
        {
          onSuccess: (data) => {
            handleIndexedSuccess(data);
          },
          onError: (err) => {
            addToast(String(err), 'error');
            setUploadingFileName(null);
          },
        }
      );
    } else {
      setUploadingFileName(file.name);
      try {
        const data = await uploadPdf.mutateAsync(file);
        handleIndexedSuccess(data);
      } catch (err) {
        addToast(String(err), 'error');
        setUploadingFileName(null);
      }
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files);
    for (const f of list) {
      await processFile(f);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleIndexText = () => {
    const id = `text-${Date.now()}`;
    indexText.mutate(
      { id, text: textInput },
      {
        onSuccess: (data) => {
          setFileId(id);
          const msg = data.category
            ? t('rag.indexedWithCategoryText', 'Texto adicionado. A IA identificou como “{{category}}”.', { category: data.category })
            : t('rag.textIndexed', 'Texto adicionado. A IA já pode usar esse conteúdo para responder.');
          addToast(msg, 'success');
          setTextInput('');
        },
      }
    );
  };

  const handleAsk = () => {
    if (!fileId || !question.trim() || query.isPending) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: question };
    const thinkingId = (Date.now() + 1).toString();
    const assistantThinking: Message = { id: thinkingId, role: 'assistant', content: '', isThinking: true };

    setMessages((prev) => [...prev, userMessage, assistantThinking]);
    const currentQuestion = question;
    setQuestion('');

    const promptToSend = customInstructions.trim() || undefined;
    query.mutate(
      { fileId, question: currentQuestion, topK, conversationId: conversationId ?? undefined, customInstructions: promptToSend },
      {
        onSuccess: (data) => {
          setConversationId(data.conversationId);
          if (fileId) localStorage.setItem(RAG_CONV_KEY(fileId), data.conversationId);
          setMessages((prev) =>
            prev.map(m => m.id === thinkingId ? {
              ...m,
              content: data.answer,
              snippets: data.snippets,
              snippetSourceFileIds: data.snippetSourceFileIds,
              isThinking: false
            } : m)
          );
        },
        onError: (err) => {
          addToast(String(err), 'error');
          setMessages((prev) => prev.filter(m => m.id !== thinkingId));
          setQuestion(currentQuestion);
        }
      }
    );
  };

  const handleResetConversation = () => {
    if (!fileId) return;
    createConversation.mutate(fileId, {
      onSuccess: (data) => {
        setConversationId(data.conversationId);
        localStorage.setItem(RAG_CONV_KEY(fileId), data.conversationId);
        setMessages([]);
        addToast(t('rag.conversationReset', 'Conversa reiniciada. As mensagens antigas continuam guardadas para a IA lembrar do contexto.'), 'success');
      },
      onError: () => addToast(t('rag.resetError', 'Não foi possível reiniciar a conversa. Tente de novo.'), 'error'),
    });
  };

  const handleDeleteConversation = () => {
    if (!conversationId) return;
    deleteConversation.mutate(conversationId, {
      onSuccess: () => {
        setConversationId(null);
        if (fileId) localStorage.removeItem(RAG_CONV_KEY(fileId));
        setMessages([]);
        addToast(t('rag.conversationDeleted', 'Conversa apagada.'), 'success');
      },
      onError: () => addToast(t('rag.deleteError', 'Não foi possível apagar a conversa. Tente de novo.'), 'error'),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => addToast(t('rag.copied', 'Resposta copiada.'), 'success'),
      () => addToast(t('rag.copyError', 'Não foi possível copiar.'), 'error')
    );
  };

  const canQuery = !!fileId && question.trim().length > 0 && !query.isPending;

  const handleFeedback = (msgId: string, type: 'up' | 'down') => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, feedback: m.feedback === type ? null : type } : m));
    addToast(t('rag.feedbackSent', 'Agradecemos o feedback!'), 'success');
  };

  const starterQuestions = [
    t('rag.starter1', 'Resuma este documento destacando os pontos principais.'),
    t('rag.starter2', 'Quais são as conclusões ou aprendizados mais importantes?'),
    t('rag.starter3', 'Extraia conceitos, entidades ou regras vitais deste texto.'),
  ];

  return (
    <div className="flex flex-col gap-6 sm:gap-8 flex-1 min-h-0">
      <PageHeader
        title={t('rag.title', 'Chat com seus documentos')}
        description={t('rag.subtitle', 'Envie documentos ou cole texto para a IA aprender. Depois faça perguntas e receba respostas baseadas só no que está nos seus arquivos.')}
      />

      {/* Abas no mobile: Chat | Documentos */}
      <div className="lg:hidden flex rounded-xl bg-slate-200/80 p-1 gap-1 mb-2">
        <button
          type="button"
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all touch-manipulation min-h-[44px] flex items-center justify-center gap-2 ${mobileTab === 'chat' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Bot className="w-4 h-4 shrink-0" />
          {t('nav.ragChatbot', 'Chat')}
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('documents')}
          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all touch-manipulation min-h-[44px] flex items-center justify-center gap-2 ${mobileTab === 'documents' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          {t('rag.documentsTab', 'Documentos')}
        </button>
      </div>

      {/* Sidebar e Chat com altura independente: cada um usa calc(100vh - ...) e scroll próprio */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 sm:gap-6 lg:gap-6 min-h-0 min-w-0 items-stretch">
        {/* SIDEBAR: no mobile só visível na aba Documentos */}
        <div className={`flex flex-col gap-5 min-w-0 overflow-y-auto overflow-x-hidden pr-1 sm:pr-2 pb-6 custom-scrollbar
          ${mobileTab !== 'documents' ? 'hidden' : 'flex'} lg:flex
          lg:h-[calc(100vh-14rem)] lg:min-h-[320px] lg:max-h-[calc(100vh-8rem)] min-h-[280px]`}
        >
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="shrink-0">
          <Card label={t('rag.addDocument', 'Add document for AI to learn')} className="!shadow-sm hover:!shadow-md">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <FileUp className="w-3.5 h-3.5" />
                  {t('rag.uploadDocument', 'Upload document')}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_STRING}
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleFiles(e.target.files);
                    e.target.value = '';
                  }}
                  disabled={uploadPdf.isPending || indexText.isPending}
                />
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative rounded-xl border-2 border-dashed min-h-[120px] flex flex-col items-center justify-center gap-2 px-4 py-6 cursor-pointer transition-all duration-200
                    ${isDragging
                      ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
                      : 'border-slate-600 hover:border-slate-500 bg-slate-100/30 hover:bg-slate-100/50'
                    }
                    ${(uploadPdf.isPending || indexText.isPending) ? 'pointer-events-none opacity-80' : ''}
                  `}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                  aria-label={t('rag.dropOrClick', 'Drop files or click to upload')}
                >
                  {(uploadPdf.isPending || indexText.isPending) ? (
                    <>
                      <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                      <span className="text-sm text-slate-700">
                        {uploadingFileName
                          ? t('rag.indexing', 'Indexing {{name}}…', { name: uploadingFileName })
                          : t('common.loading', 'Loading…')}
                      </span>
                    </>
                  ) : (
                    <>
                      <FileUp className={`w-10 h-10 ${isDragging ? 'text-blue-400' : 'text-slate-500'}`} />
                      <span className="text-sm font-medium text-slate-700 text-center">
                        {t('rag.dropOrClick', 'Drop files here or click to browse')}
                      </span>
                      <span className="text-xs text-slate-500 text-center">
                        {t('rag.fileTypes', 'PDF, TXT, MD, CSV, JSON')}
                      </span>
                    </>
                  )}
                </div>
                {(uploadPdf.isError || indexText.isError) && (
                  <Alert variant="error" className="mt-2">
                    {String(uploadPdf.error || indexText.error)}
                  </Alert>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200/60">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  {t('rag.pasteText', 'Paste text')}
                </label>
                <Textarea
                  placeholder={t('rag.pasteTextPlaceholder', 'Paste the text you want the AI to use to answer your questions…')}
                  className="min-h-[100px] text-sm"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
                <Button
                  className="mt-3 w-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300"
                  size="sm"
                  loading={indexText.isPending}
                  disabled={!textInput.trim()}
                  onClick={handleIndexText}
                >
                  {t('rag.addToKnowledge', 'Add to AI knowledge base')}
                </Button>
                {indexText.isError && (
                  <Alert variant="error" className="mt-2">{String(indexText.error)}</Alert>
                )}
              </div>
            </div>
          </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.1 }}>
          <Card label={t('rag.indexedDocuments', 'Documents the AI already knows')} className="!shadow-sm hover:!shadow-md">
            <div className="flex items-center justify-end gap-1 mb-2 shrink-0">
              <button
                type="button"
                onClick={() => refetchDocuments()}
                disabled={documentsLoading}
                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-500 hover:bg-slate-200/50 transition-colors"
                title={t('rag.refreshDocuments', 'Atualizar lista de documentos')}
              >
                <RefreshCw className={`w-4 h-4 ${documentsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {documentsLoading && (
              <div className="flex flex-col items-center justify-center p-8 text-slate-500 gap-3">
                <Spinner size="md" />
                <span className="text-sm font-medium">{t('common.loading', 'Loading documents...')}</span>
              </div>
            )}
            {!documentsLoading && documents.length === 0 && (
              <EmptyState
                title={t('rag.noDocuments', 'Nenhum documento ainda')}
                description={t('rag.indexFirst', 'Envie um arquivo (PDF, TXT, Markdown, CSV ou JSON) na área acima ou cole texto na caixa “Colar texto”. A IA vai usar o conteúdo para responder suas perguntas.')}
              />
            )}
            {!documentsLoading && documents.length > 0 && (
              <ul className="space-y-2 pr-2" role="list">
                <li className="flex gap-1 group pb-2 mb-2 border-b border-slate-200/50">
                  <button
                    type="button"
                    onClick={() => setFileId('all')}
                    className={`
                      w-full text-left rounded-xl px-4 py-3 text-sm transition-all duration-200 flex items-start gap-3 border
                      ${fileId === 'all'
                        ? 'bg-indigo-600/10 text-slate-900 border-indigo-500/50 shadow-sm shadow-indigo-200/20'
                        : 'bg-indigo-50/50 text-slate-700 border-indigo-200/50 hover:bg-indigo-50 hover:text-slate-900 hover:border-indigo-300'}
                    `}
                  >
                    <Sparkles className={`w-4 h-4 mt-0.5 shrink-0 ${fileId === 'all' ? 'text-indigo-500' : 'text-indigo-400/80'}`} />
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold block truncate leading-snug">
                        {t('rag.allKnowledgeBase', 'Toda a Base de Conhecimento')}
                      </span>
                      <span className={`text-xs mt-1 block ${fileId === 'all' ? 'text-indigo-400' : 'text-slate-500'}`}>
                        {t('rag.searchEverywhere', 'Pesquisar em todos os documentos')}
                      </span>
                    </div>
                  </button>
                </li>
                {documents.map((doc) => {
                  const isActive = fileId === doc.fileId;
                  return (
                    <li key={doc.fileId} className="flex gap-1 group">
                      <button
                        type="button"
                        onClick={() => setFileId(doc.fileId)}
                        className={`
                          w-full text-left rounded-xl px-4 py-3 text-sm transition-all duration-200 flex items-start gap-3 border
                          ${isActive
                            ? 'bg-blue-600/10 text-slate-900 border-blue-500/50 shadow-sm shadow-blue-200/20'
                            : 'bg-slate-100/30 text-slate-700 border-transparent hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300'}
                        `}
                      >
                        <BookOpen className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold block truncate leading-snug" title={doc.fileId}>
                            {doc.fileId}
                          </span>
                          <span className={`text-xs mt-1 block ${isActive ? 'text-blue-300' : 'text-slate-500'}`}>
                            {t('rag.partsAndDate', '{{count}} document chunks', { count: doc.chunksCount })} · {new Date(doc.createdAt).toLocaleDateString(i18n.language)}
                          </span>
                          {(doc.category || (doc.keywords && doc.keywords.length > 0)) && (
                            <div className="mt-1.5 flex flex-wrap items-center gap-1">
                              {doc.category && (
                                <span className="inline-flex items-center rounded-md bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                                  {doc.category}
                                </span>
                              )}
                              {doc.keywords && doc.keywords.slice(0, 3).map((kw, i) => (
                                <span key={i} className="text-[10px] text-slate-500 truncate max-w-[80px]" title={doc.keywords?.join(', ')}>
                                  {kw}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!window.confirm(t('rag.deleteDocumentConfirm', 'Remove this document from the knowledge base and delete the file? This cannot be undone.'))) return;
                          setDeletingFileId(doc.fileId);
                          deleteDocument.mutate(doc.fileId, {
                            onSuccess: () => {
                              if (fileId === doc.fileId) setFileId(null);
                              addToast(t('rag.documentDeleted', 'Document removed from the base and file deleted.'), 'success');
                            },
                            onError: (err) => addToast(String(err), 'error'),
                            onSettled: () => setDeletingFileId(null),
                          });
                        }}
                        disabled={deletingFileId !== null}
                        className="shrink-0 self-center p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                        title={t('rag.deleteDocument', 'Remove document from base and delete file')}
                      >
                        {deletingFileId === doc.fileId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
          </motion.div>
        </div>

        {/* MAIN AREA: Chat - no mobile só visível na aba Chat */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={`min-w-0 flex flex-col overflow-hidden
            ${mobileTab !== 'chat' ? 'hidden' : 'flex'} lg:flex
            lg:h-[calc(100vh-14rem)] lg:min-h-[400px] lg:max-h-[calc(100vh-8rem)] min-h-[420px] sm:min-h-[480px]`}
        >
        <Card className="flex flex-col flex-1 min-h-0 min-w-0 bg-white border-slate-200/80 shadow-md p-0 overflow-hidden">
          <>
            {/* Chat Header showing active document + conversation actions */}
            <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30 shrink-0">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-800 truncate">
                    {fileId === 'all' ? t('rag.assistantActiveAll', 'Assistente Ativo (Base Completa)') : fileId ? t('rag.assistantActive', 'Assistente Ativo') : t('rag.selectDocument', 'Escolha um documento')}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px] sm:max-w-md">
                    {fileId === 'all' ? t('rag.usingDocumentAll', 'Respondendo com base em toda a Base de Conhecimento') : fileId ? t('rag.usingDocument', 'Respondendo com base em: {{name}}', { name: fileId }) : t('rag.selectToChat', 'Escolha um documento na lista ao lado para começar a conversar.')}
                  </p>
                </div>
              </div>
              {fileId && (
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-600 hover:text-amber-400 border border-slate-300 hover:border-amber-500/50 min-h-[44px] touch-manipulation"
                    onClick={handleResetConversation}
                    disabled={createConversation.isPending}
                    title={t('rag.restartConversation', 'Reiniciar conversa (o histórico continua guardado para contexto)')}
                  >
                    <RotateCcw className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">{t('rag.restart', 'Reiniciar')}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-600 hover:text-red-400 border border-slate-300 hover:border-red-500/50 min-h-[44px] touch-manipulation"
                    onClick={handleDeleteConversation}
                    disabled={!conversationId || deleteConversation.isPending}
                    title={t('rag.deleteConversation', 'Apagar esta conversa')}
                    data-testid="delete-conversation-btn"
                  >
                    <Trash2 className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">{t('rag.delete', 'Apagar')}</span>
                  </Button>
                </div>
              )}
            </div>

            {/* AI Custom Instructions - collapsible, only when a document is selected */}
            {fileId && (
              <div className="shrink-0 border-b border-slate-200/60 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setCustomInstructionsOpen((o) => !o)}
                  className="w-full flex items-center justify-between gap-2 px-6 py-3 text-left min-w-0 hover:bg-slate-100/50 transition-colors"
                >
                  <span className="font-semibold text-slate-700 text-sm">
                    {t('rag.customInstructions', 'AI Custom Instructions')}
                  </span>
                  <span className="shrink-0 text-slate-400" aria-hidden>
                    {customInstructionsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </span>
                </button>
                <AnimatePresence>
                  {customInstructionsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-4 pt-1">
                        <p className="text-xs text-slate-500 mb-2">
                          {t('rag.customInstructionsHint', 'Write guidelines here for the AI to follow in all answers for this document. E.g., reply in bullet points, always cite the page, be more concise or detailed.')}
                        </p>
                        <Textarea
                          placeholder={t('rag.customInstructionsPlaceholder', 'E.g., Prefer short answers. Always indicate the page number.')}
                          className="min-h-[80px] text-sm"
                          value={customInstructions}
                          onChange={(e) => setCustomInstructions(e.target.value)}
                        />
                        <Button
                          size="sm"
                          className="mt-2"
                          onClick={() =>
                            savePromptPreference.mutate(
                              { fileId, customInstructions: customInstructions.trim() || null },
                              { onSuccess: () => { addToast(t('rag.promptSaved', 'Instructions saved.'), 'success'); setCustomInstructionsOpen(false); }, onError: (err) => addToast(String(err), 'error') }
                            )
                          }
                          loading={savePromptPreference.isPending}
                          disabled={savePromptPreference.isPending}
                        >
                          {t('rag.saveInstructions', 'Save instructions')}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 custom-scrollbar scroll-smooth">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-5">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                    <Bot className="w-8 h-8 text-slate-400" />
                  </div>
                  <div className="text-center max-w-md px-4">
                    <h4 className="text-base font-medium text-slate-700 mb-2">
                      {fileId ? t('rag.readyToHelp', 'Asistente pronto para ajudar') : t('rag.welcomeBot', 'Bem-vindo ao Chat Documental')}
                    </h4>
                    {fileId ? (
                      <p className="text-sm leading-relaxed text-slate-500">
                        {t('rag.askDocument', 'Faça perguntas sobre o documento. A IA responde apenas com base no que está indexado no arquivo.')}
                      </p>
                    ) : documents.length === 0 ? (
                      <p className="text-sm leading-relaxed text-slate-500">
                        {t('rag.noDocumentYet', 'Ainda não há documentos na base. Vá na aba Documentos, envie um arquivo ou cole texto. Depois volte na aba Chat e selecione o documento para começar a conversar.')}
                      </p>
                    ) : (
                      <p className="text-sm leading-relaxed text-slate-500">
                        {t('rag.selectDocumentToUnlock', 'Para enviar perguntas, selecione um documento na lista (ou Toda a Base de Conhecimento). A caixa de pergunta só é habilitada depois de escolher um documento.')}
                      </p>
                    )}
                  </div>

                  {fileId && (
                    <div className="mt-8 grid gap-2 w-full max-w-md px-4">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 text-center flex justify-center items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        {t('rag.suggestions', 'Sugestões para começar')}
                      </p>
                      {starterQuestions.map((sq, i) => (
                        <button
                          key={i}
                          onClick={() => setQuestion(sq)}
                          className="text-left px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all text-slate-600"
                        >
                          {sq}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${m.role === 'user'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-slate-100 border border-slate-300 text-slate-700'
                        }`}>
                        {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={`flex flex-col gap-2 max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`group/msg relative px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${m.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-sm'
                          : 'bg-slate-100/80 text-slate-800 border border-slate-300/50 rounded-tl-sm'
                          }`}>
                          {m.isThinking ? (
                            <div className="flex gap-1.5 items-center py-1">
                              <motion.div className="w-2 h-2 rounded-full bg-slate-400" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }} />
                              <motion.div className="w-2 h-2 rounded-full bg-slate-400" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} />
                              <motion.div className="w-2 h-2 rounded-full bg-slate-400" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} />
                            </div>
                          ) : (
                            <>
                              <div className={`prose prose-sm max-w-none break-words ${m.role === 'user' ? 'prose-invert prose-a:text-white prose-p:text-white' : ''}`}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                              </div>
                              {m.role === 'assistant' && (
                                <div className="absolute top-2 right-2 flex items-center bg-slate-100/80 backdrop-blur-sm rounded-lg opacity-0 group-hover/msg:opacity-100 transition-opacity border border-slate-200 shadow-sm p-0.5">
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(m.content)}
                                    className="p-1.5 rounded-md hover:bg-slate-200/80 text-slate-500 hover:text-slate-700 transition-colors"
                                    title={t('rag.copy', 'Copiar resposta')}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                  <div className="w-[1px] h-4 bg-slate-200" />
                                  <button
                                    type="button"
                                    onClick={() => handleFeedback(m.id, 'up')}
                                    className={`p-1.5 rounded-md hover:bg-slate-200/80 transition-colors ${m.feedback === 'up' ? 'text-green-600 bg-green-50' : 'text-slate-500'}`}
                                    title={t('rag.goodAnswer', 'Boa resposta')}
                                  >
                                    <ThumbsUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleFeedback(m.id, 'down')}
                                    className={`p-1.5 rounded-md hover:bg-slate-200/80 transition-colors ${m.feedback === 'down' ? 'text-red-600 bg-red-50' : 'text-slate-500'}`}
                                    title={t('rag.badAnswer', 'Resposta ruim')}
                                  >
                                    <ThumbsDown className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Citations / Snippets */}
                        {!m.isThinking && m.role === 'assistant' && m.snippets && m.snippets.length > 0 && (
                          <div className="mt-2 w-full flex flex-col items-start gap-2">
                            <button
                              type="button"
                              onClick={() => toggleSnippets(m.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-blue-600 hover:bg-slate-200/50 rounded-lg transition-colors border border-transparent hover:border-slate-300"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              {expandedSnippets[m.id] ? t('rag.hideSources', 'Ocultar referências') : t('rag.showSources', 'Ler referências do modelo')} ({m.snippets.length})
                              {expandedSnippets[m.id] ? <ChevronDown className="w-3 h-3 ml-1" /> : <ChevronRight className="w-3 h-3 ml-1" />}
                            </button>

                            <AnimatePresence>
                              {expandedSnippets[m.id] && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden w-full"
                                >
                                  <div className="w-full flex flex-col gap-3 bg-slate-100/40 rounded-xl p-4 border border-slate-300/50 shadow-inner mt-1">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {m.snippets.slice(0, 3).map((s, i) => {
                                        const pageMatch = s.match(/^\[Page (\d+)\]/i);
                                        const pageNum = pageMatch ? pageMatch[1] : null;

                                        return (
                                          <div key={i} className="flex flex-col bg-white rounded-lg p-3 border border-slate-300/60 shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50 transition-colors group-hover:bg-blue-400"></div>
                                            <div className="flex items-center justify-between mb-2 ml-1">
                                              <span className="text-[10px] text-slate-600">
                                                {t('rag.excerpt', 'Trecho')} {i + 1}
                                              </span>
                                              {pageNum && fileId && (() => {
                                                const cleanText = s.replace(/^\[Page \d+\]\s*/, '').trim();
                                                const searchPhrase = cleanText.split(/\s+/).slice(0, 6).join(' ').replace(/[^\w\s]/gi, '');
                                                const sourceFileId = fileId === 'all' ? (m.snippetSourceFileIds?.[i] ?? '') : fileId;
                                                const hasLink = !!sourceFileId;
                                                const href = hasLink ? `${apiBaseUrl}/uploads/${sourceFileId}.pdf#page=${pageNum}&search=${encodeURIComponent(searchPhrase)}` : '#';

                                                return (
                                                  <a
                                                    href={href}
                                                    target={hasLink ? '_blank' : undefined}
                                                    rel={hasLink ? 'noopener noreferrer' : undefined}
                                                    className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded transition-colors"
                                                    title={hasLink ? t('rag.openPage', 'Abrir documento na página {{num}}', { num: pageNum }) : t('rag.page', 'Pág.') + ' ' + pageNum}
                                                    onClick={(e) => { if (!hasLink) e.preventDefault(); }}
                                                  >
                                                    <Bot className="w-3 h-3" /> {t('rag.page', 'Pág.')} {pageNum}
                                                  </a>
                                                );
                                              })()}
                                            </div>
                                            <div className="text-xs text-slate-700 leading-relaxed max-h-32 overflow-y-auto ml-1 custom-scrollbar pr-2 relative group-hover:text-slate-800 transition-colors">
                                              <motion.span
                                                initial={{ backgroundSize: '0% 100%' }}
                                                animate={{ backgroundSize: '100% 100%' }}
                                                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                                                className="inline-block opacity-90 leading-relaxed bg-gradient-to-r from-yellow-200 to-yellow-200 bg-no-repeat bg-left box-decoration-clone"
                                              >
                                                "{s.replace(/^\[Page \d+\]\s*/, '')}"
                                              </motion.span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              <div ref={chatEndRef} className="h-4" />
            </div>

            {/* Chat Input Area */}
            <div className="shrink-0 p-3 sm:p-4 bg-white border-t border-slate-200">
              {!fileId && (
                <div id="rag-input-hint" className="mb-3 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-2" role="status">
                  <BookOpen className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    {documents.length === 0
                      ? t('rag.hintNoDocs', 'Nenhum documento ainda. Abra a aba Documentos, adicione um arquivo ou cole texto, depois volte aqui e selecione-o para conversar.')
                      : t('rag.hintSelectDoc', 'Selecione um documento na aba Documentos (ou Toda a Base de Conhecimento) para habilitar o envio de perguntas.')}
                  </p>
                </div>
              )}
              {fileId && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">{t('rag.contextChunks', 'Quantos trechos do documento buscar')}</span>
                    <div className="flex rounded-lg border border-slate-300 overflow-hidden">
                      {[5, 10, 15, 20].map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setTopK(k)}
                          className={`min-h-[36px] min-w-[36px] px-2.5 py-1 text-xs font-medium transition-colors touch-manipulation ${topK === k
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 hidden sm:inline">{t('rag.chunksUsed', 'mais trechos = resposta pode usar mais conteúdo')}</span>
                  </div>
                  {question.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => setQuestion('')}
                      className="p-2.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-slate-200/50 transition-colors touch-manipulation self-start sm:self-auto min-h-[44px] min-w-[44px]"
                      title={t('rag.clearInput', 'Limpar pergunta')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
              <div className="relative flex items-end gap-2 sm:gap-3">
                <Textarea
                  placeholder={fileId ? t('rag.placeholder', 'Digite sua pergunta sobre o documento…') : t('rag.placeholderDisabled', 'Selecione um documento na aba Documentos para habilitar…')}
                  className={`min-h-[48px] sm:min-h-[56px] max-h-[200px] resize-y pr-12 text-base sm:text-[15px] py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-inner scrollbar-thin ${fileId ? 'bg-slate-50 border-slate-300 focus:border-blue-500' : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'}`}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!fileId}
                  aria-describedby={!fileId ? 'rag-input-hint' : undefined}
                />
                <div className="absolute right-[3.25rem] bottom-2.5 sm:bottom-3 flex items-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`min-h-[44px] min-w-[44px] p-0 rounded-xl flex items-center justify-center transition-all touch-manipulation ${isListening ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                    onClick={toggleDictation}
                    title={isListening ? t('rag.stopListening', 'Parar gravação') : t('rag.startListening', 'Digitar por voz')}
                  >
                    <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
                  </Button>
                </div>
                <div className="absolute right-2 sm:right-3 bottom-2.5 sm:bottom-3 flex items-center">
                  <Button
                    size="sm"
                    className={`min-h-[44px] min-w-[44px] p-0 rounded-xl flex items-center justify-center transition-all touch-manipulation ${canQuery
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-100 text-slate-500 border-slate-300'
                      }`}
                    disabled={!canQuery}
                    onClick={handleAsk}
                  >
                    {query.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-[-2px] mb-[-2px]" />}
                  </Button>
                </div>
              </div>
              <p className="text-center text-[10px] text-slate-500 mt-3 hidden md:block">
                {t('rag.inputHint', 'Enter envia · Shift+Enter nova linha · Confira sempre os trechos citados para conferir a resposta.')}
              </p>
            </div>
          </>
        </Card>
        </motion.div>
      </div>
    </div>
  );
}
