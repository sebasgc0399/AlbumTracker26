// Letras base distintas (no diacríticos combinables) que normalize('NFD') no descompone.
// Necesario para buscar "odegaard" → "Ødegaard", "tunez" → "Túnez", etc.
const BASE_LETTER_MAP: Record<string, string> = {
  ø: 'o', æ: 'ae', å: 'a', ß: 'ss', đ: 'd', ł: 'l',
};

export const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[øæåßđł]/g, (ch) => BASE_LETTER_MAP[ch] ?? ch)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
