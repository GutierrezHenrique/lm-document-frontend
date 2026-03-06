import { type ReactNode, useState } from 'react';
import { MainNav } from './MainNav';
import { useTranslation } from 'react-i18next';
import { Globe, Menu, X } from 'lucide-react';
import { Logo } from '../ui/Logo';

export interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/80 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-lg shadow-sm transition-shadow duration-300">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-4 flex flex-row items-center justify-between gap-3 min-h-[52px] sm:min-h-0">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Logo />
            <div className="hidden md:block w-px h-7 bg-slate-200/80 mx-1 shrink-0" aria-hidden />
            <div className="hidden md:block">
              <MainNav />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-2.5 bg-slate-100/70 px-3.5 py-2 rounded-full border border-slate-200/80 transition-colors hover:border-slate-300 hover:bg-slate-100">
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
            <button
              type="button"
              className="md:hidden p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => setMobileMenuOpen(true)}
              aria-label={t('nav.openMenu', 'Abrir menu')}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay + drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
            aria-hidden
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className="fixed top-0 right-0 z-50 w-full max-w-[280px] h-full bg-white shadow-xl flex flex-col md:hidden transition-transform duration-200 ease-out"
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.menu', 'Menu')}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <span className="font-semibold text-slate-800">{t('nav.menu', 'Menu')}</span>
              <button
                type="button"
                className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                onClick={() => setMobileMenuOpen(false)}
                aria-label={t('nav.closeMenu', 'Fechar menu')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col p-4 gap-1">
              <MainNav mobile onNavigate={() => setMobileMenuOpen(false)} />
            </div>
            <div className="p-4 border-t border-slate-200 mt-auto">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{t('language')}</p>
              <div className="flex items-center gap-2 bg-slate-100/70 px-3.5 py-2.5 rounded-xl border border-slate-200/80">
                <Globe className="w-4 h-4 text-slate-500 shrink-0" />
                <select
                  className="bg-transparent text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 rounded cursor-pointer flex-1 min-w-0 py-1"
                  onChange={(e) => { changeLanguage(e.target.value); }}
                  value={i18n.language.split('-')[0]}
                  aria-label={t('language')}
                >
                  <option value="en" className="bg-white text-slate-900">English</option>
                  <option value="pt" className="bg-white text-slate-900">Português</option>
                  <option value="es" className="bg-white text-slate-900">Español</option>
                </select>
              </div>
            </div>
          </div>
        </>
      )}

      <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-10 flex flex-col min-w-0">{children}</main>
      <footer className="mt-auto border-t border-slate-200/60 bg-white/60 py-4 sm:py-5">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 text-center text-xs sm:text-sm text-slate-500">
          {t('footer.copyright')}
        </div>
      </footer>
    </div>
  );
}
