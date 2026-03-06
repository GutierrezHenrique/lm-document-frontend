import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export interface MainNavProps {
  /** Vertical layout and full-width links for mobile drawer */
  mobile?: boolean;
  /** Called when a link is clicked (e.g. close drawer) */
  onNavigate?: () => void;
}

function getNavLinkClass(mobile?: boolean) {
  return ({ isActive }: { isActive: boolean }) =>
    mobile
      ? `block w-full text-left px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200 min-h-[48px] flex items-center touch-manipulation
         ${isActive
           ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
           : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200'
         }`
      : `relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-250 ease-out
         ${isActive
           ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
           : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 active:scale-[0.98]'
         }`;
}

export function MainNav({ mobile, onNavigate }: MainNavProps) {
  const { t } = useTranslation();
  const navLinkClass = getNavLinkClass(mobile);
  return (
    <nav className={mobile ? 'flex flex-col gap-1' : 'flex gap-2 sm:gap-3'} aria-label="Main">
      <NavLink to="/" end className={navLinkClass} onClick={onNavigate}>
        {t('nav.ragChatbot', 'Chat com documentos')}
      </NavLink>
      <NavLink to="/knowledge-base" className={navLinkClass} onClick={onNavigate}>
        {t('nav.knowledgeBase', 'Base de conhecimento')}
      </NavLink>
    </nav>
  );
}
