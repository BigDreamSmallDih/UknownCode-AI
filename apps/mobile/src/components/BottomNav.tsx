import { NavLink } from 'react-router-dom';
import type { MessageKey } from '../i18n';
import { useI18n } from '../i18n/I18nContext';
import { Icon, type IconName } from './Icon';

interface NavItem {
  to: string;
  labelKey: MessageKey;
  icon: IconName;
}

const ITEMS: readonly NavItem[] = [
  { to: '/', labelKey: 'nav.home', icon: 'home' },
  { to: '/projects', labelKey: 'nav.projects', icon: 'folder' },
  { to: '/agent', labelKey: 'nav.agent', icon: 'spark' },
  { to: '/terminal', labelKey: 'nav.terminal', icon: 'terminal' },
  { to: '/settings', labelKey: 'nav.settings', icon: 'gear' },
];

export function BottomNav() {
  const { t } = useI18n();
  return (
    <nav className="bottom-nav" aria-label={t('nav.label')}>
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon">
            <Icon name={item.icon} />
          </span>
          <span className="nav-label">{t(item.labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
