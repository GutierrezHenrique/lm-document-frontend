import { useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiBaseUrl } from '../api/client';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function PdfViewerPage() {
    const { t } = useTranslation();
    const { fileId } = useParams<{ fileId: string }>();
    const [searchParams] = useSearchParams();
    const initialPage = parseInt(searchParams.get('page') || '1', 10);
    const searchQuery = searchParams.get('search') || '';

    const [numPages, setNumPages] = useState<number>();
    const [pageNumber, setPageNumber] = useState(initialPage);
    const [scale, setScale] = useState(1.2);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setPageNumber(initialPage);
    }

    const highlightPattern = useCallback(
        (text: string, pattern: string) => {
            const parts = text.split(new RegExp(`(${escapeRegExp(pattern)})`, 'gi'));
            return parts.map((part, index) =>
                new RegExp(`^${escapeRegExp(pattern)}$`, 'i').test(part) ? (
                    <mark
                        key={index}
                        className="bg-transparent text-transparent bg-gradient-to-r from-yellow-300 to-yellow-300 bg-no-repeat bg-left box-decoration-clone"
                        style={{
                            animation: 'highlightAnim 1s ease-out forwards',
                            animationDelay: '0.2s',
                            backgroundSize: '0% 100%'
                        }}
                    >
                        {part}
                    </mark>
                ) : (
                    part
                )
            );
        },
        []
    );

    const textRenderer = useCallback(
        (textItem: any) => {
            if (!searchQuery) return textItem.str;
            return highlightPattern(textItem.str, searchQuery);
        },
        [searchQuery, highlightPattern]
    );

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] w-full">
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes highlightAnim {
          from { background-size: 0% 100%; color: transparent; }
          to { background-size: 100% 100%; color: inherit; }
        }
      `}} />

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-4 w-full flex items-center justify-between">
                <h2 className="text-sm font-semibold truncate max-w-xs">{fileId}</h2>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1">
                        <button
                            disabled={pageNumber <= 1}
                            onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                            className="p-1 rounded hover:bg-slate-100 disabled:opacity-50"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-medium px-2 min-w-[3rem] text-center">
                            {pageNumber} / {numPages || '-'}
                        </span>
                        <button
                            disabled={pageNumber >= (numPages || 1)}
                            onClick={() => setPageNumber(prev => Math.min(numPages || prev, prev + 1))}
                            className="p-1 rounded hover:bg-slate-100 disabled:opacity-50"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1">
                        <button
                            onClick={() => setScale(prev => Math.max(0.5, prev - 0.2))}
                            className="p-1 rounded hover:bg-slate-100"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-medium px-2">{Math.round(scale * 100)}%</span>
                        <button
                            onClick={() => setScale(prev => Math.min(3, prev + 0.2))}
                            className="p-1 rounded hover:bg-slate-100"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex justify-center w-full max-w-5xl overflow-auto bg-slate-50 rounded-xl border border-slate-200 shadow-inner relative p-4">
                <Document
                    file={`${apiBaseUrl}/uploads/${fileId}.pdf`}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3"><Loader2 className="w-8 h-8 animate-spin" /><span>{t('pdf.loading', 'Loading PDF...')}</span></div>}
                    error={<div className="p-12 text-red-500 bg-red-50 rounded-xl text-sm border border-red-200">{t('pdf.error', 'Failed to load PDF file.')}</div>}
                >
                    <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        customTextRenderer={textRenderer}
                        loading={<div className="w-full h-full min-h-[600px] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>}
                        className="shadow-md"
                    />
                </Document>
            </div>
        </div>
    );
}
