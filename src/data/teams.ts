export interface Team {
  code: string;
  name: string;
  group: string;
  flagCode: string;
}

export const TEAMS: readonly Team[] = [
  { code: "MEX", name: "México", group: "A", flagCode: "mx" },
  { code: "RSA", name: "Sudáfrica", group: "A", flagCode: "za" },
  { code: "KOR", name: "Corea del Sur", group: "A", flagCode: "kr" },
  { code: "CZE", name: "Chequia", group: "A", flagCode: "cz" },

  { code: "CAN", name: "Canadá", group: "B", flagCode: "ca" },
  { code: "BIH", name: "Bosnia y Herzegovina", group: "B", flagCode: "ba" },
  { code: "QAT", name: "Catar", group: "B", flagCode: "qa" },
  { code: "SUI", name: "Suiza", group: "B", flagCode: "ch" },

  { code: "BRA", name: "Brasil", group: "C", flagCode: "br" },
  { code: "MAR", name: "Marruecos", group: "C", flagCode: "ma" },
  { code: "HAI", name: "Haití", group: "C", flagCode: "ht" },
  { code: "SCO", name: "Escocia", group: "C", flagCode: "gb-sct" },

  { code: "USA", name: "Estados Unidos", group: "D", flagCode: "us" },
  { code: "PAR", name: "Paraguay", group: "D", flagCode: "py" },
  { code: "AUS", name: "Australia", group: "D", flagCode: "au" },
  { code: "TUR", name: "Turquía", group: "D", flagCode: "tr" },

  { code: "GER", name: "Alemania", group: "E", flagCode: "de" },
  { code: "CUW", name: "Curazao", group: "E", flagCode: "cw" },
  { code: "CIV", name: "Costa de Marfil", group: "E", flagCode: "ci" },
  { code: "ECU", name: "Ecuador", group: "E", flagCode: "ec" },

  { code: "NED", name: "Países Bajos", group: "F", flagCode: "nl" },
  { code: "JPN", name: "Japón", group: "F", flagCode: "jp" },
  { code: "SWE", name: "Suecia", group: "F", flagCode: "se" },
  { code: "TUN", name: "Túnez", group: "F", flagCode: "tn" },

  { code: "BEL", name: "Bélgica", group: "G", flagCode: "be" },
  { code: "EGY", name: "Egipto", group: "G", flagCode: "eg" },
  { code: "IRN", name: "Irán", group: "G", flagCode: "ir" },
  { code: "NZL", name: "Nueva Zelanda", group: "G", flagCode: "nz" },

  { code: "ESP", name: "España", group: "H", flagCode: "es" },
  { code: "CPV", name: "Cabo Verde", group: "H", flagCode: "cv" },
  { code: "KSA", name: "Arabia Saudita", group: "H", flagCode: "sa" },
  { code: "URU", name: "Uruguay", group: "H", flagCode: "uy" },

  { code: "FRA", name: "Francia", group: "I", flagCode: "fr" },
  { code: "SEN", name: "Senegal", group: "I", flagCode: "sn" },
  { code: "IRQ", name: "Irak", group: "I", flagCode: "iq" },
  { code: "NOR", name: "Noruega", group: "I", flagCode: "no" },

  { code: "ARG", name: "Argentina", group: "J", flagCode: "ar" },
  { code: "ALG", name: "Argelia", group: "J", flagCode: "dz" },
  { code: "AUT", name: "Austria", group: "J", flagCode: "at" },
  { code: "JOR", name: "Jordania", group: "J", flagCode: "jo" },

  { code: "POR", name: "Portugal", group: "K", flagCode: "pt" },
  { code: "COD", name: "RD Congo", group: "K", flagCode: "cd" },
  { code: "UZB", name: "Uzbekistán", group: "K", flagCode: "uz" },
  { code: "COL", name: "Colombia", group: "K", flagCode: "co" },

  { code: "ENG", name: "Inglaterra", group: "L", flagCode: "gb-eng" },
  { code: "CRO", name: "Croacia", group: "L", flagCode: "hr" },
  { code: "GHA", name: "Ghana", group: "L", flagCode: "gh" },
  { code: "PAN", name: "Panamá", group: "L", flagCode: "pa" },
] as const;
