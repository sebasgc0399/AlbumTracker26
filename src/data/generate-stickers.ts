import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { TEAMS } from "./teams.ts";
import { PLAYERS } from "./players.ts";

interface Sticker {
  id: string;
  number: string;
  name: string;
  team: string;
  teamName: string;
  group: string;
  section: string;
  type: string;
  position: number;
}

// Sección Introducción del álbum Panini Mundial 2026 (edición Colombia).
// Confirmado contra fotos del álbum físico + listado de la app oficial Panini.
//
// El álbum tiene 9 láminas en intro, organizadas así:
//   - Slot "00": etiqueta física "00" (sin prefijo "FWC") — sticker "Panini" de marca.
//     Se modela con id "00", team "" (vacío), para que la chip lo muestre como "00"
//     y no como "FWC 0" o similar.
//   - Slots FWC1..FWC8: las 8 láminas con prefijo "FWC" en el álbum.
//
// FWC9 NO está en intro — pertenece al Museo FIFA (es la primera lámina del
// museo, "Foto del equipo (Italia 1934)"). Las 3 mascotas (Maple/Zayu/Clutch)
// son UNA sola lámina ("Mascotas Oficiales"), no tres.
interface IntroSlot {
  id: string; // p.ej. "00", "FWC1"
  team: string; // "" para 00, "FWC" para el resto
  name: string;
}

const INTRO_SLOTS: readonly IntroSlot[] = [
  { id: "00", team: "", name: "Panini" },
  { id: "FWC1", team: "FWC", name: "Emblema Oficial 1/2" },
  { id: "FWC2", team: "FWC", name: "Emblema Oficial 2/2" },
  { id: "FWC3", team: "FWC", name: "Mascotas Oficiales" },
  { id: "FWC4", team: "FWC", name: "Eslogan Oficial" },
  { id: "FWC5", team: "FWC", name: "Balón Oficial Trionda" },
  { id: "FWC6", team: "FWC", name: "Anfitrión Canadá" },
  { id: "FWC7", team: "FWC", name: "Anfitrión México" },
  { id: "FWC8", team: "FWC", name: "Anfitrión Estados Unidos" },
];

// Sección Museo FIFA del álbum Panini Mundial 2026 (edición Colombia).
// Confirmado contra el álbum físico + app oficial Panini: 11 láminas con
// IDs FWC9..FWC19 (no FWC10..FWC20 como asumía la SPEC inicial). Cada slot
// es una foto del equipo campeón con formato "Foto del equipo (País Año)".
//
// El subset de campeones NO es uno por edición: Panini eligió 11 finales
// específicas, no las 22 ediciones del Mundial. El orden es cronológico.
const MUSEUM_NAMES: readonly string[] = [
  "Foto del equipo (Italia 1934)",
  "Foto del equipo (Uruguay 1950)",
  "Foto del equipo (Alemania Occidental 1954)",
  "Foto del equipo (Brasil 1962)",
  "Foto del equipo (Alemania Occidental 1974)",
  "Foto del equipo (Argentina 1986)",
  "Foto del equipo (Brasil 1994)",
  "Foto del equipo (Brasil 2002)",
  "Foto del equipo (Italia 2006)",
  "Foto del equipo (Alemania 2014)",
  "Foto del equipo (Argentina 2022)",
];

function buildIntro(): Sticker[] {
  // position empieza en 0 para que la lámina "00" ordene primero en el grid.
  // El número impreso del álbum se deriva del id menos el prefijo team
  // (StickerChip.tsx hace ese cómputo en runtime).
  return INTRO_SLOTS.map((slot, idx) => ({
    id: slot.id,
    number: slot.id,
    name: slot.name,
    team: slot.team,
    teamName: "Introducción",
    group: "special",
    section: "intro",
    type: "special",
    position: idx,
  }));
}

function buildMuseum(): Sticker[] {
  return MUSEUM_NAMES.map((name, idx) => {
    const position = idx + 1;
    const number = position + 8;
    const id = `FWC${number}`;
    return {
      id,
      number: id,
      name,
      team: "FWC",
      teamName: "Museo FIFA",
      group: "special",
      section: "museum",
      type: "special",
      position,
    };
  });
}

// Estructura de página de equipo en el álbum Panini Mundial 2026:
//   position 1     -> escudo (badge)
//   position 2-12  -> 11 jugadores (índices 0..10 en PLAYERS[code])
//   position 13    -> foto de equipo (team_photo)
//   position 14-20 -> 7 jugadores (índices 11..17 en PLAYERS[code])
function playerIndexFromPosition(position: number): number {
  if (position >= 2 && position <= 12) return position - 2;
  if (position >= 14 && position <= 20) return position - 3;
  throw new Error(`Posición ${position} no corresponde a un jugador`);
}

function buildTeams(): Sticker[] {
  for (const team of TEAMS) {
    const roster = PLAYERS[team.code];
    if (!roster) {
      throw new Error(`Falta roster para ${team.code} en src/data/players.ts`);
    }
    if (roster.length !== 18) {
      throw new Error(
        `${team.code}: esperado 18 jugadores, hay ${roster.length}`,
      );
    }
    for (const playerName of roster) {
      if (!playerName.trim()) {
        throw new Error(`${team.code}: nombre vacío detectado en roster`);
      }
    }
  }

  const result: Sticker[] = [];
  for (const team of TEAMS) {
    const roster = PLAYERS[team.code]!;
    for (let position = 1; position <= 20; position++) {
      const id = `${team.code}${position}`;
      let name: string;
      let type: string;
      if (position === 1) {
        name = `Escudo ${team.name}`;
        type = "badge";
      } else if (position === 13) {
        name = `Foto de equipo ${team.name}`;
        type = "team_photo";
      } else {
        name = roster[playerIndexFromPosition(position)];
        type = "player";
      }
      result.push({
        id,
        number: id,
        name,
        team: team.code,
        teamName: team.name,
        group: team.group,
        section: "team",
        type,
        position,
      });
    }
  }
  return result;
}

// 14 láminas Coca-Cola con jugadores reales, en el orden impreso del álbum
// Panini Mundial 2026 (edición Colombia). Confirmado contra fotos del álbum
// físico — slot CC1..CC14 visibles junto al nombre del jugador.
const COCACOLA_NAMES: readonly string[] = [
  "Lamine Yamal",
  "Joshua Kimmich",
  "Harry Kane",
  "Santiago Giménez",
  "Joško Gvardiol",
  "Federico Valverde",
  "Jefferson Lerma",
  "Enner Valencia",
  "Gabriel Magalhães",
  "Virgil van Dijk",
  "Alphonso Davies",
  "Emiliano Martínez",
  "Raúl Jiménez",
  "Lautaro Martínez",
];

function buildCocaCola(): Sticker[] {
  return COCACOLA_NAMES.map((name, idx) => {
    const position = idx + 1;
    const id = `CC${position}`;
    return {
      id,
      number: id,
      name,
      team: "CC",
      teamName: "Coca-Cola",
      group: "special",
      section: "cocacola",
      type: "special",
      position,
    };
  });
}

const intro = buildIntro();
const museum = buildMuseum();
const teams = buildTeams();
const cocacola = buildCocaCola();
const all: Sticker[] = [...intro, ...museum, ...teams, ...cocacola];

console.log(`Intro:    ${intro.length}`);
console.log(`Museo:    ${museum.length}`);
console.log(`Equipos:  ${teams.length}`);
console.log(`CocaCola: ${cocacola.length}`);
console.log(`Total:    ${all.length}`);

if (all.length !== 994) {
  throw new Error(`Total esperado 994, obtenido ${all.length}`);
}

const here = dirname(fileURLToPath(import.meta.url));
const outPath = join(here, "stickers.json");
writeFileSync(outPath, JSON.stringify(all, null, 2), "utf8");
console.log(`Escrito: ${outPath}`);
