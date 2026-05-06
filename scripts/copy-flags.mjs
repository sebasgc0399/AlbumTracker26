#!/usr/bin/env node
import { readFile, mkdir, copyFile, readdir, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const TEAMS_TS = resolve(ROOT, "src/data/teams.ts");
const SRC_DIR = resolve(ROOT, "node_modules/flag-icons/flags/4x3");
const DEST_DIR = resolve(ROOT, "public/flags");

async function main() {
  const teamsSource = await readFile(TEAMS_TS, "utf8");
  const codes = [...teamsSource.matchAll(/flagCode:\s*"([^"]+)"/g)].map((m) => m[1]);

  if (codes.length === 0) {
    console.error("[copy-flags] No flagCode entries found in src/data/teams.ts. Aborting.");
    process.exit(1);
  }

  if (!existsSync(SRC_DIR)) {
    console.error(`[copy-flags] flag-icons not found at ${SRC_DIR}. Run \`npm install\` first.`);
    process.exit(1);
  }

  await mkdir(DEST_DIR, { recursive: true });

  const existing = new Set(
    (await readdir(DEST_DIR)).filter((f) => f.endsWith(".svg")),
  );
  const wanted = new Set(codes.map((c) => `${c}.svg`));

  let copied = 0;
  let missing = [];
  for (const code of codes) {
    const src = resolve(SRC_DIR, `${code}.svg`);
    const dst = resolve(DEST_DIR, `${code}.svg`);
    if (!existsSync(src)) {
      missing.push(code);
      continue;
    }
    await copyFile(src, dst);
    copied++;
  }

  let pruned = 0;
  for (const file of existing) {
    if (!wanted.has(file)) {
      await unlink(resolve(DEST_DIR, file));
      pruned++;
    }
  }

  console.log(`[copy-flags] Copied ${copied}/${codes.length} SVGs to public/flags/`);
  if (pruned > 0) console.log(`[copy-flags] Pruned ${pruned} stale SVG(s)`);
  if (missing.length > 0) {
    console.error(`[copy-flags] Missing in flag-icons: ${missing.join(", ")}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[copy-flags] Error:", err);
  process.exit(1);
});
