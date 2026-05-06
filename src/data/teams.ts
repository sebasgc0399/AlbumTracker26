export interface Team {
  code: string;
  name: string;
  group: string;
  flag: string;
}

export const TEAMS: readonly Team[] = [
  { code: "CAN", name: "Canadá", group: "A", flag: "🇨🇦" },
  { code: "MAR", name: "Marruecos", group: "A", flag: "🇲🇦" },
  { code: "CRO", name: "Croacia", group: "A", flag: "🇭🇷" },
  { code: "ECU", name: "Ecuador", group: "A", flag: "🇪🇨" },

  { code: "MEX", name: "México", group: "B", flag: "🇲🇽" },
  { code: "KOR", name: "Corea del Sur", group: "B", flag: "🇰🇷" },
  { code: "SUI", name: "Suiza", group: "B", flag: "🇨🇭" },
  { code: "CIV", name: "Costa de Marfil", group: "B", flag: "🇨🇮" },

  { code: "USA", name: "Estados Unidos", group: "C", flag: "🇺🇸" },
  { code: "JPN", name: "Japón", group: "C", flag: "🇯🇵" },
  { code: "POR", name: "Portugal", group: "C", flag: "🇵🇹" },
  { code: "TUN", name: "Túnez", group: "C", flag: "🇹🇳" },

  { code: "ARG", name: "Argentina", group: "D", flag: "🇦🇷" },
  { code: "AUS", name: "Australia", group: "D", flag: "🇦🇺" },
  { code: "DEN", name: "Dinamarca", group: "D", flag: "🇩🇰" },
  { code: "EGY", name: "Egipto", group: "D", flag: "🇪🇬" },

  { code: "BRA", name: "Brasil", group: "E", flag: "🇧🇷" },
  { code: "IRN", name: "Irán", group: "E", flag: "🇮🇷" },
  { code: "POL", name: "Polonia", group: "E", flag: "🇵🇱" },
  { code: "GHA", name: "Ghana", group: "E", flag: "🇬🇭" },

  { code: "FRA", name: "Francia", group: "F", flag: "🇫🇷" },
  { code: "KSA", name: "Arabia Saudita", group: "F", flag: "🇸🇦" },
  { code: "URU", name: "Uruguay", group: "F", flag: "🇺🇾" },
  { code: "SEN", name: "Senegal", group: "F", flag: "🇸🇳" },

  { code: "ESP", name: "España", group: "G", flag: "🇪🇸" },
  { code: "QAT", name: "Catar", group: "G", flag: "🇶🇦" },
  { code: "COL", name: "Colombia", group: "G", flag: "🇨🇴" },
  { code: "RSA", name: "Sudáfrica", group: "G", flag: "🇿🇦" },

  { code: "ENG", name: "Inglaterra", group: "H", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { code: "JOR", name: "Jordania", group: "H", flag: "🇯🇴" },
  { code: "PAR", name: "Paraguay", group: "H", flag: "🇵🇾" },
  { code: "ALG", name: "Argelia", group: "H", flag: "🇩🇿" },

  { code: "GER", name: "Alemania", group: "I", flag: "🇩🇪" },
  { code: "UZB", name: "Uzbekistán", group: "I", flag: "🇺🇿" },
  { code: "VEN", name: "Venezuela", group: "I", flag: "🇻🇪" },
  { code: "NGA", name: "Nigeria", group: "I", flag: "🇳🇬" },

  { code: "NED", name: "Países Bajos", group: "J", flag: "🇳🇱" },
  { code: "IRQ", name: "Irak", group: "J", flag: "🇮🇶" },
  { code: "BOL", name: "Bolivia", group: "J", flag: "🇧🇴" },
  { code: "CMR", name: "Camerún", group: "J", flag: "🇨🇲" },

  { code: "BEL", name: "Bélgica", group: "K", flag: "🇧🇪" },
  { code: "NZL", name: "Nueva Zelanda", group: "K", flag: "🇳🇿" },
  { code: "PAN", name: "Panamá", group: "K", flag: "🇵🇦" },
  { code: "MLI", name: "Malí", group: "K", flag: "🇲🇱" },

  { code: "ITA", name: "Italia", group: "L", flag: "🇮🇹" },
  { code: "TUR", name: "Turquía", group: "L", flag: "🇹🇷" },
  { code: "CRC", name: "Costa Rica", group: "L", flag: "🇨🇷" },
  { code: "JAM", name: "Jamaica", group: "L", flag: "🇯🇲" },
] as const;
