/**
 * Calls to the Dailyvy API's admin endpoints (/api/v1/admin/*).
 * Unwraps the `{ success, data, error }` envelope; throws ApiError on failure.
 * A 401 means the admin session ended (expired, or the password was changed
 * elsewhere): the stored token is dropped and the login page shows.
 */
import { useSession } from '@/auth/session'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

interface Envelope<T> {
  success: boolean
  data: T
  error: { code: string; message: string; details?: { field: string; message: string }[] } | null
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = useSession.getState().token
  let response: Response
  try {
    response = await fetch(`${BASE_URL}/admin${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', "Can't reach the server. Is it running?")
  }

  const envelope = (await response.json().catch(() => null)) as Envelope<T> | null
  if (response.ok && envelope?.success) return envelope.data

  const error = envelope?.error
  if (response.status === 401 && token) useSession.getState().logout()
  // Validation errors: show the first field's message (e.g. the password rules)
  const message = error?.details?.[0]?.message ?? error?.message ?? 'Something went wrong'
  throw new ApiError(response.status, error?.code ?? 'ERROR', message)
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong'

// ---- Types ------------------------------------------------------------------

export interface Admin {
  id: string
  email: string
  name: string
  role: 'admin'
  createdAt: string
  /** This login. */
  lastLoginAt: string | null
  /** The one before it. */
  previousLoginAt: string | null
}

export interface Stats {
  users: number
  newThisWeek: number
  pendingRequests: number
}

export type RequestStatus = 'pending' | 'approved' | 'rejected'

export interface AccessRequest {
  id: string
  name: string
  email: string
  source: string
  status: RequestStatus
  createdAt: string
  decidedAt: string | null
}

export interface User {
  id: string
  name: string
  email: string
  emailVerified: boolean
  timezone: string
  registeredAt: string
  /** Still on the temporary password from the admin. */
  mustChangePassword: boolean
  /** Paused by the admin (can't log in), or null. */
  pausedAt: string | null
  /** Last time any of their devices used Dailyvy, or null if never. */
  lastActiveAt: string | null
  /** Devices logged in right now. */
  devices: number
  /** Active habits. */
  habits: number
}

export interface SystemStatus {
  email: {
    transport: 'console' | 'smtp' | 'brevo'
    from: string
    lastSentAt: string | null
    lastError: { at: string; message: string } | null
  }
  phonePush: boolean
  browserPush: boolean
  signupOpen: boolean
  uptimeSeconds: number
}
