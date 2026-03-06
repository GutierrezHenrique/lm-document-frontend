import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader, Card, EmptyState, Button, Textarea, Input, Badge } from '../components/ui';
import { useRagDocuments, useRagDocumentChunks } from '../hooks';
import { useToast } from '../contexts/ToastContext';
import { api } from '../api/client';
import { BookOpen, FileText, Brain, ChevronDown, ChevronRight, Search, Loader2, Sparkles, Folder, Layers, BarChart, X, CalendarDays, Hash, UploadCloud, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type DocItem = {
  fileId: string;
  chunksCount: number;
  category?: string | null;
  keywords?: string[] | null;
  createdAt: string;
};

type ChunkItem = { id: string; text: string; keywords: string[] };

function DocumentItem({
  doc,
  expanded,
  onToggle,
  chunks,
  chunksLoading,
  viewMode,
}: {
  doc: DocItem;
  expanded: boolean;
  onToggle: () => void;
  chunks: ChunkItem[] | undefined;
  chunksLoading: boolean;
  viewMode: 'list' | 'grid';
}) {
  const { t } = useTranslation();
  const preview = (text: string, max = 150) =>
    text.length <= max ? text : text.slice(0, max).trim() + '…';

  const isGrid = viewMode === 'grid';
  const Wrapper = motion.div;
  const WrapperProps = isGrid
    ? { className: "flex flex-col bg-white border border-slate-200/80 rounded-xl overflow-hidden hover:shadow-md transition-shadow shadow-sm relative group" }
    : { className: "flex flex-col border-b border-slate-200/60 last:border-0 overflow-hidden" };

  return (
    <Wrapper initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} {...WrapperProps}>
      <button
        type="button"
        onClick={onToggle}
        className={`flex ${isGrid ? 'flex-col p-5' : 'flex-col sm:flex-row sm:items-center p-5 md:p-6'} gap-4 transition-all w-full text-left relative group ${expanded
          ? 'bg-blue-50/40'
          : 'hover:bg-slate-50/80'
          }`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg transition-colors ${expanded
              ? 'bg-blue-100 text-blue-600'
              : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-blue-600'
              }`}>
              <BookOpen className="w-4 h-4 shrink-0" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-sm text-slate-800 block truncate group-hover:text-blue-600 transition-colors" title={doc.fileId}>
                {doc.fileId}
              </span>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                <CalendarDays className="w-3 h-3 opacity-70" />
                {new Date(doc.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </div>
            </div>
          </div>

          <div className={`mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500`}>
            <span className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-medium text-slate-700">{doc.chunksCount}</span>
            </span>
            {doc.category && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 text-indigo-700 px-2 py-1 font-medium border border-indigo-100 max-w-full">
                <Folder className="w-3 h-3 shrink-0" />
                <span className="truncate">{doc.category}</span>
              </span>
            )}
          </div>

          {doc.keywords && doc.keywords.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {doc.keywords.slice(0, isGrid ? 3 : 6).map((kw, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-sm bg-slate-100 text-slate-600 px-1.5 py-0.5 text-[10px] uppercase font-medium border border-slate-200"
                >
                  {kw}
                </span>
              ))}
              {doc.keywords.length > (isGrid ? 3 : 6) && (
                <span className="text-[10px] text-slate-400 px-1 font-medium">+{doc.keywords.length - (isGrid ? 3 : 6)} tags</span>
              )}
            </div>
          )}
        </div>

        <div className={`flex items-center gap-3 shrink-0 ${isGrid ? 'mt-3 justify-between w-full border-t border-slate-200/60 pt-3' : 'mt-4 sm:mt-0'}`}>
          <Link
            to={`/?file=${encodeURIComponent(doc.fileId)}`}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white text-blue-600 text-xs font-medium border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <Brain className="w-3.5 h-3.5" />
            <span className={isGrid ? '' : 'hidden sm:inline'}>{t('knowledgeBase.chat', 'Conversar')}</span>
          </Link>
          <div className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-slate-50/80 border-t border-slate-200/60"
          >
            <div className="p-4 md:p-5 shadow-inner">
              <h4 className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                {t('knowledgeBase.indexedChunks', 'Trechos Indexados')}
                <Badge className="ml-1 text-[10px]">{chunksLoading ? '...' : chunks?.length}</Badge>
              </h4>

              {chunksLoading && (
                <div className="flex flex-col items-center justify-center py-6 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500 mb-2" />
                  <span className="text-sm">{t('common.loading', 'Carregando trechos...')}</span>
                </div>
              )}

              {!chunksLoading && chunks && chunks.length === 0 && (
                <div className="text-center py-6 rounded-xl border border-dashed border-slate-300 bg-white/50">
                  <p className="text-xs text-slate-500">{t('knowledgeBase.noChunks', 'Nenhum trecho encontrado.')}</p>
                </div>
              )}

              {!chunksLoading && chunks && chunks.length > 0 && (
                <ul className={`${isGrid ? "space-y-3" : "grid grid-cols-1 lg:grid-cols-2 gap-3"} max-h-96 overflow-y-auto custom-scrollbar pr-2`}>
                  {chunks.map((c, i) => (
                    <li key={c.id} className="rounded-xl bg-white border border-slate-200/80 p-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-indigo-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex justify-between items-start mb-1.5">
                        <p className="text-[11px] font-mono font-medium text-slate-400 flex items-center gap-1.5">
                          <Hash className="w-3 h-3" />
                          {t('knowledgeBase.chunk', 'Trecho')} {i + 1}
                        </p>
                        <Link
                          to={`/?file=${encodeURIComponent(doc.fileId)}&chunkText=${encodeURIComponent(c.text)}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                          title={t('knowledgeBase.askAboutThis', 'Perguntar sobre este trecho')}
                        >
                          <Brain className="w-3 h-3" />
                        </Link>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-serif ">{preview(c.text, 200)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Wrapper>
  );
}

export default function KnowledgeBase() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const { data: documents = [], isLoading } = useRagDocuments();
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);

  // API Filtering
  const [filterDescription, setFilterDescription] = useState('');
  const [filterResult, setFilterResult] = useState<{
    documents: (DocItem & { chunks: ChunkItem[] })[];
  } | null>(null);
  const [filtering, setFiltering] = useState(false);

  // Layout & View Mode
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Local Filtering & Sorting
  const [localSearch, setLocalSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'chunks'>('newest');

  const { data: expandedChunks, isLoading: chunksLoading } = useRagDocumentChunks(
    expandedFileId && !filterResult ? expandedFileId : null
  );

  const handleFilter = async () => {
    if (!filterDescription.trim()) {
      setFilterResult(null);
      return;
    }
    setFiltering(true);
    try {
      const res = await api.rag.filterKnowledge(filterDescription.trim());
      setFilterResult({ documents: res.documents });
      addToast(t('knowledgeBase.filterApplied', 'Filtro por Inteligência Artificial aplicado com sucesso!'), 'success');
    } catch (err) {
      addToast(String(err), 'error');
    } finally {
      setFiltering(false);
    }
  };

  const clearFilter = () => {
    setFilterResult(null);
    setFilterDescription('');
  };

  const handleClearLocalSearch = () => {
    setLocalSearch('');
  }

  // Dashboard calculations
  const totalDocs = documents.length;
  const totalChunks = useMemo(() => documents.reduce((acc, d) => acc + d.chunksCount, 0), [documents]);
  const categoriesCount = useMemo(() => new Set(documents.map(d => d.category).filter(Boolean)).size, [documents]);

  // Derived Categories for Sidebar
  const categoriesList = useMemo(() => {
    const counts: Record<string, number> = {};
    documents.forEach(d => {
      const cat = d.category || 'Outros';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [documents]);

  // Derived state (Filter + Local sort/search/category)
  const displayList = useMemo(() => {
    let list = filterResult?.documents ?? documents;

    // Apply category filter
    if (selectedCategory) {
      list = list.filter(d => (d.category || 'Outros') === selectedCategory);
    }

    // Apply local search
    if (localSearch.trim()) {
      const lower = localSearch.toLowerCase();
      list = list.filter(d =>
        (d.fileId && d.fileId.toLowerCase().includes(lower)) ||
        (d.category && d.category.toLowerCase().includes(lower)) ||
        (d.keywords && d.keywords.some(k => k.toLowerCase().includes(lower)))
      );
    }

    // Apply sort
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name': return a.fileId.localeCompare(b.fileId);
        case 'chunks': return b.chunksCount - a.chunksCount;
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  }, [documents, filterResult, localSearch, sortBy, selectedCategory]);

  const isApiFiltered = filterResult != null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 max-w-7xl mx-auto pb-12"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title={t('knowledgeBase.title', 'Base de Conhecimento')}
          description={t('knowledgeBase.subtitle', 'Explore os tópicos e acervo processados pela IA.')}
        />
        <Link to="/">
          <Button className="shadow-md shadow-blue-500/20 group">
            <Sparkles className="w-4 h-4 mr-2 text-blue-200 group-hover:text-white transition-colors" />
            {t('knowledgeBase.goToChatbot', 'Assistente Virtual')}
          </Button>
        </Link>
      </div>

      {/* DASHBOARD STATS */}
      {!isLoading && totalDocs > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <Card className="p-6 flex items-center gap-5 border-l-4 border-l-blue-500 bg-white/60 backdrop-blur-sm shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{t('knowledgeBase.totalDocs', 'Total de Documentos')}</p>
                <p className="text-3xl font-bold text-slate-800">{totalDocs}</p>
              </div>
            </Card>
          </motion.div>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <Card className="p-6 flex items-center gap-5 border-l-4 border-l-indigo-500 bg-white/60 backdrop-blur-sm shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{t('knowledgeBase.totalChunks', 'Trechos Indexados')}</p>
                <p className="text-3xl font-bold text-slate-800">{totalChunks}</p>
              </div>
            </Card>
          </motion.div>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <Card className="p-6 flex items-center gap-5 border-l-4 border-l-teal-500 bg-white/60 backdrop-blur-sm shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-600">
                <BarChart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{t('knowledgeBase.totalCats', 'Categorias / Tópicos')}</p>
                <p className="text-3xl font-bold text-slate-800">{categoriesCount}</p>
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      {/* NATURAL LANGUAGE API FILTER */}
      <Card className="overflow-hidden border-indigo-200/60 relative shadow-sm transition-all hover:shadow-md">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Brain className="w-48 h-48" />
        </div>
        <div className="p-6 md:p-8 bg-gradient-to-br from-indigo-50/80 to-blue-50/50 relative z-10">
          <div className="max-w-3xl">
            <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              {t('knowledgeBase.aiSearchTitle', 'Busca Semântica por IA')}
            </h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {t('knowledgeBase.aiSearchDesc', 'A inteligência artificial analisa o contexto e significado da sua busca para encontrar os documentos relevantes, focando em conceitos e ideias.')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute top-3 left-3.5 text-indigo-400">
                  <Brain className="w-5 h-5" />
                </div>
                <Textarea
                  placeholder={t('knowledgeBase.filterPlaceholder', 'Ex.: Manuais de segurança, regras de reembolso...')}
                  className="min-h-[52px] pl-11 pr-4 py-3.5 flex-1 w-full text-sm bg-white/80 border-indigo-200 focus:border-indigo-400 rounded-xl resize-none shadow-inner"
                  value={filterDescription}
                  onChange={(e) => setFilterDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleFilter();
                    }
                  }}
                />
              </div>
              <div className="flex sm:flex-col gap-2 shrink-0">
                <Button
                  onClick={handleFilter}
                  loading={filtering}
                  disabled={filtering || !filterDescription.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white sm:flex-1 h-auto py-3 px-6"
                >
                  {t('knowledgeBase.applyFilter', 'Buscar com IA')}
                </Button>
                {isApiFiltered && (
                  <Button variant="ghost" onClick={clearFilter} className="sm:flex-1 h-auto py-3 text-slate-600">
                    {t('knowledgeBase.clearFilter', 'Limpar')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* DYNAMIC CONTENT AREA */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* SIDEBAR - TOPICS */}
        {totalDocs > 0 && !isLoading && (
          <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2 sticky top-6">
            <div className="flex items-center justify-between px-2 mb-1">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Folder className="w-4 h-4 text-indigo-500" />
                {t('knowledgeBase.categoriesTitle', 'Tópicos')}
              </h3>
            </div>
            <div className="space-y-1 bg-white border border-slate-200/80 p-2 rounded-2xl shadow-sm">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${selectedCategory === null
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-medium'
                  : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <span className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4" />
                  {t('knowledgeBase.allTopics', 'Todos os Tópicos')}
                </span>
                <Badge className={`${selectedCategory === null ? 'bg-white/20 text-white border-none' : 'bg-slate-200 text-slate-600'}`}>
                  {totalDocs}
                </Badge>
              </button>

              <div className="pt-2 mt-2 border-t border-slate-100 space-y-1">
                {categoriesList.map(([cat, count]) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0 pr-2">
                      <Folder className={`w-4 h-4 shrink-0 ${selectedCategory === cat ? 'text-indigo-200' : 'text-slate-400'}`} />
                      <span className="truncate">{cat}</span>
                    </span>
                    <Badge className={`${selectedCategory === cat ? 'bg-white/20 text-white border-none shrink-0' : 'bg-slate-100 text-slate-500 shrink-0 border border-slate-200'}`}>
                      {count}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MAIN LIST */}
        <div className="flex-1 min-w-0 space-y-4 w-full">
          {/* TOOLBAR */}
          {(displayList.length > 0 || localSearch) && (
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="relative w-full md:w-80">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
                <Input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder={t('knowledgeBase.localSearch', 'Buscar palavra-chave...')}
                  className="pl-9 pr-9 w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
                />
                {localSearch && (
                  <button
                    onClick={handleClearLocalSearch}
                    aria-label="clear-search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    title="Exibição em Grade"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    title="Exibição em Lista"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 md:flex-none">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 rounded-xl py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-full"
                  >
                    <option value="newest">{t('knowledgeBase.sortNewest', 'Recentes')}</option>
                    <option value="oldest">{t('knowledgeBase.sortOldest', 'Antigos')}</option>
                    <option value="name">{t('knowledgeBase.sortName', 'A-Z')}</option>
                    <option value="chunks">{t('knowledgeBase.sortChunks', 'Volume')}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* CONTENT */}
          <div className="min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white/50 border border-slate-200/80 rounded-2xl text-slate-500 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="text-sm font-medium">{t('knowledgeBase.loadingDocs', 'Carregando biblioteca de conhecimento...')}</span>
              </div>
            ) : documents.length === 0 ? (
              <Card className="py-16 px-8 text-center bg-white/50 border border-dashed border-slate-300">
                <EmptyState
                  title={t('knowledgeBase.noDocuments', 'Nenhum documento na base')}
                  description={t('knowledgeBase.indexFirst', 'Comece a construir sua base de conhecimento enviando documentos.')}
                />
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 mt-6 text-blue-600 hover:text-blue-700 font-medium bg-blue-50 px-5 py-2.5 rounded-full transition-colors"
                >
                  <UploadCloud className="w-4 h-4" />
                  {t('knowledgeBase.goToChatbotUpload', 'Fazer upload agora')}
                </Link>
              </Card>
            ) : displayList.length === 0 ? (
              <Card className="py-16 px-8 text-center flex flex-col items-center justify-center bg-white/50 border border-slate-200/80">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  {selectedCategory ? `${t('knowledgeBase.noResultsCategory', 'Sem docs em')} "${selectedCategory}"` : t('knowledgeBase.noResultsTitle', 'Nenhum resultado')}
                </h3>
                <p className="text-slate-500 mb-6">{t('knowledgeBase.noResultsDesc', 'Tente ajustar sua busca ou filtro.')}</p>
                <Button variant="ghost" onClick={() => { setLocalSearch(''); clearFilter(); setSelectedCategory(null); }}>
                  {t('knowledgeBase.clearAllFilters', 'Limpar todos os filtros')}
                </Button>
              </Card>
            ) : (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {displayList.map((doc) => {
                    const isExpanded = expandedFileId === doc.fileId;
                    const chunksFromFilter: ChunkItem[] | undefined =
                      isApiFiltered && 'chunks' in doc ? (doc as DocItem & { chunks: ChunkItem[] }).chunks : undefined;
                    const chunksToPass: ChunkItem[] | undefined =
                      chunksFromFilter ?? (isExpanded ? expandedChunks : undefined);
                    return (
                      <DocumentItem
                        key={doc.fileId}
                        doc={doc}
                        expanded={isExpanded}
                        onToggle={() => setExpandedFileId(isExpanded ? null : doc.fileId)}
                        chunks={Array.isArray(chunksToPass) ? chunksToPass : undefined}
                        chunksLoading={isExpanded && !isApiFiltered && chunksLoading}
                        viewMode="grid"
                      />
                    );
                  })}
                </div>
              ) : (
                <Card className="overflow-hidden border-slate-200/80 bg-white/50 backdrop-blur-sm">
                  <ul className="divide-y divide-slate-100" role="list">
                    {displayList.map((doc) => {
                      const isExpanded = expandedFileId === doc.fileId;
                      const chunksFromFilter: ChunkItem[] | undefined =
                        isApiFiltered && 'chunks' in doc ? (doc as DocItem & { chunks: ChunkItem[] }).chunks : undefined;
                      const chunksToPass: ChunkItem[] | undefined =
                        chunksFromFilter ?? (isExpanded ? expandedChunks : undefined);
                      return (
                        <DocumentItem
                          key={doc.fileId}
                          doc={doc}
                          expanded={isExpanded}
                          onToggle={() => setExpandedFileId(isExpanded ? null : doc.fileId)}
                          chunks={Array.isArray(chunksToPass) ? chunksToPass : undefined}
                          chunksLoading={isExpanded && !isApiFiltered && chunksLoading}
                          viewMode="list"
                        />
                      );
                    })}
                  </ul>
                </Card>
              )
            )}
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgb(51 65 85 / 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgb(71 85 105 / 0.8);
        }
      `}} />
    </motion.div>
  );
}
