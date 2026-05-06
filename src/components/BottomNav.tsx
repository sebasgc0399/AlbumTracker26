import { Home, Search, ArrowLeftRight, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface NavTab {
  to: string;
  label: string;
  Icon: LucideIcon;
}

const TABS: readonly NavTab[] = [
  { to: '/', label: 'Inicio', Icon: Home },
  { to: '/search', label: 'Buscar', Icon: Search },
  { to: '/duplicates', label: 'Repetidas', Icon: ArrowLeftRight },
  { to: '/missing', label: 'Me Falta', Icon: Target },
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
                  isActive ? 'font-bold text-primary' : 'text-muted-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <tab.Icon
                    aria-hidden="true"
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`h-5 w-5 transition-opacity ${
                      isActive ? 'opacity-100' : 'opacity-70'
                    }`}
                  />
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
