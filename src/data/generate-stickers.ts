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

const INTRO_NAMES: readonly string[] = [
  "Logo FIFA World Cup 26",
  "Trofeo Mundial",
  "Mascota Oficial Maple",
  "Mascota Oficial Zayu",
  "Mascota Oficial Clutch",
  "Balón Oficial",
  "Sedes Estados Unidos",
  "Sedes México",
  "Sedes Canadá",
];

const MUSEUM_NAMES: readonly string[] = [
  "Campeón 1930 - Uruguay",
  "Campeón 1934 - Italia",
  "Campeón 1950 - Uruguay",
  "Campeón 1970 - Brasil",
  "Campeón 1974 - Alemania",
  "Campeón 1978 - Argentina",
  "Campeón 1986 - Argentina",
  "Campeón 1998 - Francia",
  "Campeón 2010 - España",
  "Campeón 2018 - Francia",
  "Campeón 2022 - Argentina",
];

function buildIntro(): Sticker[] {
  return INTRO_NAMES.map((name, idx) => {
    const position = idx + 1;
    const id = `FWC${position}`;
    return {
      id,
      number: id,
      name,
      team: "FWC",
      teamName: "Introducción",
      group: "special",
      section: "intro",
      type: "special",
      position,
    };
  });
}

function buildMuseum(): Sticker[] {
  return MUSEUM_NAMES.map((name, idx) => {
    const position = idx + 1;
    const number = position + 9;
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

function buildCocaCola(): Sticker[] {
  return Array.from({ length: 12 }, (_, idx) => {
    const position = idx + 1;
    const id = `CC${position}`;
    return {
      id,
      number: id,
      name: `Coca-Cola Especial ${position}`,
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

if (all.length !== 992) {
  throw new Error(`Total esperado 992, obtenido ${all.length}`);
}

const here = dirname(fileURLToPath(import.meta.url));
const outPath = join(here, "stickers.json");
writeFileSync(outPath, JSON.stringify(all, null, 2), "utf8");
console.log(`Escrito: ${outPath}`);
