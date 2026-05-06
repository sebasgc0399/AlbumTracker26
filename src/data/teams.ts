export interface Team {
  code: string;
  name: string;
  group: string;
  flagCode: string;
}

export const TEAMS: readonly Team[] = [
  { code: "CAN", name: "Canadá", group: "A", flagCode: "ca" },
  { code: "MAR", name: "Marruecos", group: "A", flagCode: "ma" },
  { code: "CRO", name: "Croacia", group: "A", flagCode: "hr" },
  { code: "ECU", name: "Ecuador", group: "A", flagCode: "ec" },

  { code: "MEX", name: "México", group: "B", flagCode: "mx" },
  { code: "KOR", name: "Corea del Sur", group: "B", flagCode: "kr" },
  { code: "SUI", name: "Suiza", group: "B", flagCode: "ch" },
  { code: "CIV", name: "Costa de Marfil", group: "B", flagCode: "ci" },

  { code: "USA", name: "Estados Unidos", group: "C", flagCode: "us" },
  { code: "JPN", name: "Japón", group: "C", flagCode: "jp" },
  { code: "POR", name: "Portugal", group: "C", flagCode: "pt" },
  { code: "TUN", name: "Túnez", group: "C", flagCode: "tn" },

  { code: "ARG", name: "Argentina", group: "D", flagCode: "ar" },
  { code: "AUS", name: "Australia", group: "D", flagCode: "au" },
  { code: "DEN", name: "Dinamarca", group: "D", flagCode: "dk" },
  { code: "EGY", name: "Egipto", group: "D", flagCode: "eg" },

  { code: "BRA", name: "Brasil", group: "E", flagCode: "br" },
  { code: "IRN", name: "Irán", group: "E", flagCode: "ir" },
  { code: "POL", name: "Polonia", group: "E", flagCode: "pl" },
  { code: "GHA", name: "Ghana", group: "E", flagCode: "gh" },

  { code: "FRA", name: "Francia", group: "F", flagCode: "fr" },
  { code: "KSA", name: "Arabia Saudita", group: "F", flagCode: "sa" },
  { code: "URU", name: "Uruguay", group: "F", flagCode: "uy" },
  { code: "SEN", name: "Senegal", group: "F", flagCode: "sn" },

  { code: "ESP", name: "España", group: "G", flagCode: "es" },
  { code: "QAT", name: "Catar", group: "G", flagCode: "qa" },
  { code: "COL", name: "Colombia", group: "G", flagCode: "co" },
  { code: "RSA", name: "Sudáfrica", group: "G", flagCode: "za" },

  { code: "ENG", name: "Inglaterra", group: "H", flagCode: "gb-eng" },
  { code: "JOR", name: "Jordania", group: "H", flagCode: "jo" },
  { code: "PAR", name: "Paraguay", group: "H", flagCode: "py" },
  { code: "ALG", name: "Argelia", group: "H", flagCode: "dz" },

  { code: "GER", name: "Alemania", group: "I", flagCode: "de" },
  { code: "UZB", name: "Uzbekistán", group: "I", flagCode: "uz" },
  { code: "VEN", name: "Venezuela", group: "I", flagCode: "ve" },
  { code: "NGA", name: "Nigeria", group: "I", flagCode: "ng" },

  { code: "NED", name: "Países Bajos", group: "J", flagCode: "nl" },
  { code: "IRQ", name: "Irak", group: "J", flagCode: "iq" },
  { code: "BOL", name: "Bolivia", group: "J", flagCode: "bo" },
  { code: "CMR", name: "Camerún", group: "J", flagCode: "cm" },

  { code: "BEL", name: "Bélgica", group: "K", flagCode: "be" },
  { code: "NZL", name: "Nueva Zelanda", group: "K", flagCode: "nz" },
  { code: "PAN", name: "Panamá", group: "K", flagCode: "pa" },
  { code: "MLI", name: "Malí", group: "K", flagCode: "ml" },

  { code: "ITA", name: "Italia", group: "L", flagCode: "it" },
  { code: "TUR", name: "Turquía", group: "L", flagCode: "tr" },
  { code: "CRC", name: "Costa Rica", group: "L", flagCode: "cr" },
  { code: "JAM", name: "Jamaica", group: "L", flagCode: "jm" },
] as const;
