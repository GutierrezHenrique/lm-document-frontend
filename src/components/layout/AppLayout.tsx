import { type ReactNode } from 'react';
import { MainNav } from './MainNav';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Logo } from '../ui/Logo';

export interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/80 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-lg shadow-sm transition-shadow duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center justify-between gap-4 min-w-0">
            <Logo />
            <div className="hidden md:block w-px h-7 bg-slate-200/80 mx-1 shrink-0" aria-hidden />
            <MainNav />
          </div>
          <div className="flex items-center justify-end sm:justify-center gap-2.5 bg-slate-100/70 px-3.5 py-2 rounded-full border border-slate-200/80 shrink-0 transition-colors hover:border-slate-300 hover:bg-slate-100">
            <Globe className="w-4 h-4 text-slate-500" aria-hidden />
            <select
              className="bg-transparent text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-1 rounded cursor-pointer min-w-0"
              onChange={(e) => changeLanguage(e.target.value)}
              value={i18n.language.split('-')[0]}
              aria-label={t('language')}
            >
              <option value="en" className="bg-white text-slate-900">English</option>
              <option value="pt" className="bg-white text-slate-900">Português</option>
              <option value="es" className="bg-white text-slate-900">Español</option>
            </select>
          </div>
        </div>
      </header>
      <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 flex flex-col min-w-0">{children}</main>
      <footer className="mt-auto border-t border-slate-200/60 bg-white/60 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
          {t('footer.copyright')}
        </div>
      </footer>
    </div>
  );
}
