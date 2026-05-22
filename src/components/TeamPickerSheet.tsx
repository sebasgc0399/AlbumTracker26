import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TEAMS, type Team } from '@/data/teams';
import { normalize } from '@/lib/normalize';
import FlagIcon from './FlagIcon';

interface TeamPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentTeamCode?: string;
}

const MAX_FLAT_RESULTS = 8;

export default function TeamPickerSheet({
  isOpen,
  onClose,
  currentTeamCode,
}: TeamPickerSheetProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<Element | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    openerRef.current = document.activeElement;
    const raf = requestAnimationFrame(() => {
      setIsVisible(true);
      inputRef.current?.focus();
    });
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // visualViewport: en mobile el teclado virtual no reduce window.innerHeight
  // por defecto. Detectamos su altura y elevamos el sheet por encima vía CSS
  // var --keyboard-offset. Sin esto la lista queda físicamente tapada por el
  // teclado en iOS Safari y Android Chrome.
  useEffect(() => {
    if (!isOpen) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      sheetRef.current?.style.setProperty('--keyboard-offset', `${offset}px`);
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      sheetRef.current?.style.removeProperty('--keyboard-offset');
    };
  }, [isOpen]);

  function handleClose() {
    setIsVisible(false);
    window.setTimeout(() => {
      setQuery('');
      onClose();
      if (openerRef.current instanceof HTMLElement) {
        openerRef.current.focus();
      }
    }, 200);
  }

  function handleSelect(team: Team) {
    if (team.code === currentTeamCode) {
      handleClose();
      return;
    }
    navigate(`/team/${team.code}`);
    handleClose();
  }

  const trimmed = query.trim();
  const matches = useMemo<Team[]>(() => {
    if (trimmed.length === 0) return [];
    const needle = normalize(trimmed);
    const scored: { team: Team; score: number }[] = [];
    for (const team of TEAMS) {
      const codeLower = team.code.toLowerCase();
      const nameNorm = normalize(team.name);
      let score: number;
      if (codeLower === needle) score = 0;
      else if (codeLower.startsWith(needle)) score = 1;
      else if (nameNorm.startsWith(needle)) score = 2;
      else if (nameNorm.includes(needle)) score = 3;
      else continue;
      scored.push({ team, score });
    }
    scored.sort((a, b) => a.score - b.score);
    return scored.map((s) => s.team);
  }, [trimmed]);

  const visible = matches.slice(0, MAX_FLAT_RESULTS);
  const overflow = Math.max(0, matches.length - MAX_FLAT_RESULTS);

  const grouped = useMemo<{ group: string; teams: Team[] }[]>(() => {
    if (trimmed.length > 0) return [];
    const map = new Map<string, Team[]>();
    for (const team of TEAMS) {
      const list = map.get(team.group);
      if (list) list.push(team);
      else map.set(team.group, [team]);
    }
    return Array.from(map.entries()).map(([group, teams]) => ({ group, teams }));
  }, [trimmed]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Saltar a equipo">
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        ref={sheetRef}
        style={{ bottom: 'var(--keyboard-offset, 0px)' }}
        className={`absolute inset-x-0 flex max-h-[calc(85dvh-var(--keyboard-offset,0px))] flex-col rounded-t-2xl bg-background shadow-xl transition-transform duration-200 ease-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div
          className="mx-auto mt-2 h-1 w-12 shrink-0 rounded-full bg-muted"
          aria-hidden="true"
        />

        <div className="shrink-0 px-4 pb-3 pt-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-foreground">Saltar a equipo</h2>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Cerrar"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors active:bg-muted"
            >
              <span aria-hidden="true" className="text-xl leading-none">×</span>
            </button>
          </div>
          <label htmlFor="team-picker-input" className="sr-only">
            Código o nombre del equipo
          </label>
          <input
            ref={inputRef}
            id="team-picker-input"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ARG, Argentina, túnez..."
            inputMode="text"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8">
          {trimmed.length > 0 ? (
            matches.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">
                No hay equipos que coincidan con "{trimmed}".
              </p>
            ) : (
              <>
                <ul className="flex flex-col gap-2" role="listbox" aria-label="Resultados">
                  {visible.map((team) => (
                    <li key={team.code} role="option" aria-selected={false}>
                      <TeamPickerItem team={team} onSelect={handleSelect} />
                    </li>
                  ))}
                </ul>
                {overflow > 0 && (
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    +{overflow} más — afiná la búsqueda
                  </p>
                )}
              </>
            )
          ) : (
            <div className="flex flex-col gap-4">
              {grouped.map(({ group, teams }) => (
                <section key={group}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Grupo {group}
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {teams.map((team) => (
                      <li key={team.code}>
                        <TeamPickerItem team={team} onSelect={handleSelect} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface TeamPickerItemProps {
  team: Team;
  onSelect: (team: Team) => void;
}

function TeamPickerItem({ team, onSelect }: TeamPickerItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(team)}
      className="flex h-14 w-full items-center gap-3 rounded-lg border border-border bg-background px-3 text-left transition-colors active:bg-muted"
    >
      <FlagIcon code={team.flagCode} alt="" className="w-8 shrink-0 shadow-sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-sm font-bold tabular-nums text-foreground">
            {team.code}
          </span>
          <span className="min-w-0 truncate text-sm text-foreground">
            {team.name}
          </span>
        </div>
      </div>
      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        Grupo {team.group}
      </span>
    </button>
  );
}
