/**
 * Tiny CSV serialiser. Enough for report exports — no streaming, no
 * dependencies. Handles the three CSV escape cases: commas, quotes,
 * newlines. Deliberately stays out of fancy number formatting — callers
 * decide how their cells look.
 */

export function toCsv(
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
): string {
  const esc = (v: string | number | null | undefined): string => {
    if (v === null || v === undefined) return ''
    const s = typeof v === 'string' ? v : String(v)
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }
  const out = [headers.map(esc).join(',')]
  for (const r of rows) out.push(r.map(esc).join(','))
  return out.join('\n')
}
