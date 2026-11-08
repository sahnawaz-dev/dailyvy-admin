const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })
const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

/** A missing or broken date shows as "—" instead of crashing the page. */
const safe = (format: (date: Date) => string) => (iso: string | null | undefined) => {
  const date = iso ? new Date(iso) : null
  return date && !Number.isNaN(date.getTime()) ? format(date) : '—'
}

export const formatDate = safe((date) => dateFormat.format(date))
export const formatDateTime = safe((date) => dateTimeFormat.format(date))

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
]

/** "3 days ago", "yesterday", "just now" */
export function formatAgo(iso: string | null | undefined) {
  const time = iso ? new Date(iso).getTime() : NaN
  if (Number.isNaN(time)) return '—'
  const seconds = (time - Date.now()) / 1000
  for (const [unit, size] of STEPS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}
