import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-250 ease-out
   ${isActive
     ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
     : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 active:scale-[0.98]'
   }`;

export function MainNav() {
  const { t } = useTranslation();
  return (
    <nav className="flex gap-2 sm:gap-3" aria-label="Main">
      <NavLink to="/" end className={navLinkClass}>
        {t('nav.ragChatbot', 'Chat com documentos')}
      </NavLink>
      <NavLink to="/knowledge-base" className={navLinkClass}>
        {t('nav.knowledgeBase', 'Base de conhecimento')}
      </NavLink>
    </nav>
  );
}
