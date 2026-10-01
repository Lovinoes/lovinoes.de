export function fmtBytes(b: number | null | undefined): string {
  if (b == null || Number.isNaN(Number(b))) return "—"
  const units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"]
  let v = Number(b)
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(2)} ${units[i]}`
}

export function fmtRate(b: number | null | undefined): string {
  if (b == null || Number.isNaN(Number(b))) return "—"
  return `${fmtBytes(b)}/s`
}

/** "1h 4m", "12m 3s" — for activity timers. */
export function fmtDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h) return `${h}h ${m}m`
  if (m) return `${m}m ${sec}s`
  return `${sec}s`
}

/** "3:07" — for song progress. */
export function fmtClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
]

export function fmtRelative(date: string | number | Date, now = Date.now()): string {
  const diff = (new Date(date).getTime() - now) / 1000
  for (const [unit, secs] of STEPS) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit)
  }
  return "just now"
}

export const compact = new Intl.NumberFormat("en", { notation: "compact" })
