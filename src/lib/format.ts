const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** All stored times carry +05:30; read the wall-clock parts straight from the string. */
function parts(iso: string) {
  const [d, t = '00:00:00'] = iso.split('T')
  const [y, m, day] = d.split('-').map(Number)
  return { y, m, day, hm: t.slice(0, 5), hms: t.slice(0, 8) }
}

export const fmtDate = (iso: string) => {
  const p = parts(iso)
  return `${p.day} ${MONTHS[p.m - 1]} ${p.y}`
}

export const fmtIsoDate = (iso: string) => iso.slice(0, 10)

export const fmtDateTime = (iso: string) => {
  const p = parts(iso)
  return `${p.day} ${MONTHS[p.m - 1]} ${p.y}, ${p.hm}`
}

export const fmtTime = (iso: string) => parts(iso).hms

export function fmtDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s} s`
  return `${Math.floor(s / 60)} min ${s % 60} s`
}

export const shortHash = (h: string, n = 8) => (h ? `${h.slice(0, n)}…` : '—')

export const pct = (x: number) => `${Math.round(x * 100)}%`
