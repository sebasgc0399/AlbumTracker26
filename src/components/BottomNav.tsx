import { NavLink } from 'react-router-dom';

interface NavTab {
  to: string;
  label: string;
  icon: string;
}

const TABS: readonly NavTab[] = [
  { to: '/', label: 'Inicio', icon: '🏠' },
  { to: '/search', label: 'Buscar', icon: '🔍' },
  { to: '/duplicates', label: 'Repetidas', icon: '🔄' },
  { to: '/missing', label: 'Me Falta', icon: '🎯' },
];

export default function BottomNav() {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-md">
        {TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) =>
                `flex h-14 flex-col items-center justify-center gap-0.5 text-[0.7rem] transition-colors ${
                  isActive
                    ? 'font-bold text-primary'
                    : 'text-muted-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden="true"
                    className={`text-xl leading-none transition-opacity ${
                      isActive ? 'opacity-100' : 'opacity-60'
                    }`}
                  >
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
