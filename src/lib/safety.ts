// Safety kit: export/import del progreso del usuario en JSON.
// Permite respaldo manual antes de un evento riesgoso (cambio de dispositivo, limpieza de datos).

import { db, type CollectionEntry } from '@/db/database';

export interface BackupFile {
  version: 1;
  app: 'AlbumTracker26';
  exportedAt: string;
  entries: CollectionEntry[];
}

export async function exportCollection(): Promise<BackupFile> {
  const entries = await db.collection.toArray();
  return {
    version: 1,
    app: 'AlbumTracker26',
    exportedAt: new Date().toISOString(),
    entries,
  };
}

function todayLocalIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function downloadBackup(backup: BackupFile): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `at26-backup-${todayLocalIso()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function isBackupEntry(value: unknown): value is CollectionEntry {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.stickerId === 'string' &&
    typeof v.owned === 'boolean' &&
    typeof v.count === 'number' &&
    Number.isFinite(v.count) &&
    v.count >= 0
  );
}

export function parseBackup(text: string): BackupFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('JSON malformado');
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Formato no reconocido');
  }
  const obj = parsed as Record<string, unknown>;
  if (obj.version !== 1) {
    throw new Error('Versión de respaldo no compatible');
  }
  if (obj.app !== 'AlbumTracker26') {
    throw new Error('No es un respaldo de AlbumTracker26');
  }
  if (!Array.isArray(obj.entries)) {
    throw new Error('Lista de entradas inválida');
  }
  for (const entry of obj.entries) {
    if (!isBackupEntry(entry)) {
      throw new Error('Una entrada no tiene la forma esperada');
    }
  }
  const exportedAt =
    typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString();
  return {
    version: 1,
    app: 'AlbumTracker26',
    exportedAt,
    entries: obj.entries,
  };
}

export async function markAllOwned(): Promise<{
  added: number;
  alreadyOwned: number;
}> {
  const stickers = await db.stickers.toArray();
  let added = 0;
  let alreadyOwned = 0;
  await db.transaction('rw', db.collection, async () => {
    for (const sticker of stickers) {
      const existing = await db.collection.get(sticker.id);
      if (existing && existing.count >= 1) {
        alreadyOwned += 1;
        continue;
      }
      await db.collection.put({
        stickerId: sticker.id,
        owned: true,
        count: 1,
      });
      added += 1;
    }
  });
  return { added, alreadyOwned };
}

export async function resetCollection(): Promise<{ cleared: number }> {
  const cleared = await db.collection.count();
  await db.transaction('rw', db.collection, async () => {
    await db.collection.clear();
  });
  return { cleared };
}

export async function importCollection(
  backup: BackupFile,
  mode: 'replace' | 'merge',
): Promise<{ imported: number; skipped: number }> {
  if (mode === 'replace') {
    let imported = 0;
    await db.transaction('rw', db.collection, async () => {
      await db.collection.clear();
      await db.collection.bulkAdd(backup.entries);
      imported = backup.entries.length;
    });
    return { imported, skipped: 0 };
  }

  let imported = 0;
  let skipped = 0;
  await db.transaction('rw', db.collection, async () => {
    for (const entry of backup.entries) {
      const existing = await db.collection.get(entry.stickerId);
      if (!existing) {
        await db.collection.put(entry);
        imported += 1;
        continue;
      }
      const mergedCount = Math.max(existing.count, entry.count);
      const mergedOwned = existing.owned || entry.owned || mergedCount > 0;
      if (mergedCount === existing.count && mergedOwned === existing.owned) {
        skipped += 1;
        continue;
      }
      await db.collection.put({
        stickerId: entry.stickerId,
        owned: mergedOwned,
        count: mergedCount,
      });
      imported += 1;
    }
  });
  return { imported, skipped };
}
