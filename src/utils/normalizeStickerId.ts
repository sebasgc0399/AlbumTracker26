/**
 * Normaliza un ID de lámina tipeado por el usuario.
 *
 * - Trim de espacios al inicio/final
 * - Uppercase total
 * - Elimina TODOS los whitespaces internos
 *
 * Ejemplos:
 *   "col7"     -> "COL7"
 *   "col 7"    -> "COL7"
 *   "  COL  7  " -> "COL7"
 *
 * Pure function: sin imports externos, sin side effects.
 */
export function normalizeStickerId(input: string): string {
  return input.replace(/\s+/g, '').toUpperCase();
}
