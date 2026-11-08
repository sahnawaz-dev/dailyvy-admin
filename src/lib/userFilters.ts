/**
 * Users tab filters: how recently people used Dailyvy, and their status.
 * "Last active" for someone who never logged in counts from when they joined,
 * so an old account nobody ever used shows up as inactive too.
 */
import type { User } from '@/lib/api'

const DAY_MS = 24 * 60 * 60 * 1000

export type ActivityFilter =
  | 'any'
  | 'week'
  | 'month'
  | 'year'
  | 'inactive30'
  | 'inactive90'
  | 'inactive180'
  | 'inactive365'
  | 'never'

export type StatusFilter = 'all' | 'active' | 'paused' | 'temporary' | 'admins'

export const ACTIVITY_OPTIONS: { value: ActivityFilter; label: string; group: 'Active' | 'Inactive' | '' }[] = [
  { value: 'any', label: 'Any time', group: '' },
  { value: 'week', label: 'Active this week', group: 'Active' },
  { value: 'month', label: 'Active this month', group: 'Active' },
  { value: 'year', label: 'Active this year', group: 'Active' },
  { value: 'inactive30', label: 'Inactive 30+ days', group: 'Inactive' },
  { value: 'inactive90', label: 'Inactive 90+ days', group: 'Inactive' },
  { value: 'inactive180', label: 'Inactive 6+ months', group: 'Inactive' },
  { value: 'inactive365', label: 'Inactive 1+ year', group: 'Inactive' },
  { value: 'never', label: 'Never active', group: 'Inactive' },
]

export const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active (not paused)' },
  { value: 'paused', label: 'Paused' },
  { value: 'temporary', label: 'Temporary password' },
  { value: 'admins', label: 'Also admins' },
]

const INACTIVE_DAYS: Partial<Record<ActivityFilter, number>> = {
  inactive30: 30,
  inactive90: 90,
  inactive180: 180,
  inactive365: 365,
}

export const isInactiveFilter = (filter: ActivityFilter) => filter in INACTIVE_DAYS || filter === 'never'

/** When they last used Dailyvy — or joined, if they never did. */
export const lastSeen = (user: User) => new Date(user.lastActiveAt ?? user.registeredAt).getTime()

/** Start of this week (Monday), month or year, in the admin's own time zone. */
function periodStart(filter: 'week' | 'month' | 'year', now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (filter === 'week') start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  if (filter === 'month') start.setDate(1)
  if (filter === 'year') start.setMonth(0, 1)
  return start.getTime()
}

function matchesActivity(user: User, filter: ActivityFilter, now: number) {
  if (filter === 'any') return true
  if (filter === 'never') return !user.lastActiveAt
  if (filter === 'week' || filter === 'month' || filter === 'year') {
    return user.lastActiveAt !== null && new Date(user.lastActiveAt).getTime() >= periodStart(filter)
  }
  return now - lastSeen(user) >= INACTIVE_DAYS[filter]! * DAY_MS
}

function matchesStatus(user: User, filter: StatusFilter) {
  if (filter === 'active') return !user.pausedAt
  if (filter === 'paused') return Boolean(user.pausedAt)
  if (filter === 'temporary') return user.mustChangePassword
  if (filter === 'admins') return Boolean(user.isAdmin)
  return true
}

/**
 * Users matching the search, activity and status. Inactive filters list the
 * longest-inactive first (the ones to clean up); otherwise the server's order.
 */
export function filterUsers(
  users: User[],
  { search, activity, status }: { search: string; activity: ActivityFilter; status: StatusFilter },
) {
  const term = search.trim().toLowerCase()
  const now = Date.now()
  const shown = users.filter(
    (user) =>
      (!term || user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)) &&
      matchesActivity(user, activity, now) &&
      matchesStatus(user, status),
  )
  return isInactiveFilter(activity) ? shown.sort((a, b) => lastSeen(a) - lastSeen(b)) : shown
}
