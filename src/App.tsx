import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppLayout } from './components/layout';
import { SplashScreen } from './components/ui/SplashScreen';
import { ToastProvider } from './contexts/ToastContext';
import RagChatbot from './pages/RagChatbot';
import PdfViewerPage from './pages/PdfViewerPage';
import KnowledgeBase from './pages/KnowledgeBase';

export default function App() {
  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsAppLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <SplashScreen isLoading={isAppLoading} />
      {!isAppLoading && (
        <ErrorBoundary>
          <ToastProvider>
            <AppLayout>
              <Routes>
                <Route path="/" element={<RagChatbot />} />
                <Route path="/knowledge-base" element={<KnowledgeBase />} />
                <Route path="/document/:fileId" element={<PdfViewerPage />} />
              </Routes>
            </AppLayout>
          </ToastProvider>
        </ErrorBoundary>
      )}
    </>
  );
}
