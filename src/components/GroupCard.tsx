import { Link } from 'react-router-dom';
import { TEAMS } from '@/data/teams';
import type { CollectionEntry } from '@/db/database';
import ProgressBar from './ProgressBar';

interface GroupCardProps {
  groupId: string;
  collection: Map<string, CollectionEntry> | undefined;
}

const STICKERS_PER_TEAM = 20;

export default function GroupCard({ groupId, collection }: GroupCardProps) {
  const teams = TEAMS.filter((team) => team.group === groupId);
  const total = teams.length * STICKERS_PER_TEAM;

  let owned = 0;
  if (collection) {
    for (const team of teams) {
      for (let position = 1; position <= STICKERS_PER_TEAM; position += 1) {
        const entry = collection.get(`${team.code}${position}`);
        if (entry && entry.count > 0) owned += 1;
      }
    }
  }

  return (
    <Link
      to={`/group/${groupId}`}
      className="block rounded-lg border border-border bg-background p-3 transition-colors active:bg-muted"
    >
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-base font-semibold text-foreground">
          Grupo {groupId}
        </h3>
        <span className="text-xs tabular-nums text-muted-foreground">
          {owned}/{total}
        </span>
      </div>

      <ul className="mb-3 grid grid-cols-2 gap-x-2 gap-y-1">
        {teams.map((team) => (
          <li
            key={team.code}
            className="flex items-center gap-1.5 text-xs text-foreground"
          >
            <span className="text-base leading-none">{team.flag}</span>
            <span className="truncate">{team.name}</span>
          </li>
        ))}
      </ul>

      <ProgressBar value={owned} max={total} />
    </Link>
  );
}
