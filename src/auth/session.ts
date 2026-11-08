/**
 * The admin's login. Kept in sessionStorage: closing the tab logs out, and the
 * token itself expires after 8 hours (server side).
 */
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Admin } from '@/lib/api'

interface SessionState {
  token: string | null
  admin: Admin | null
  login: (token: string, admin: Admin) => void
  setToken: (token: string) => void
  setAdmin: (admin: Admin) => void
  logout: () => void
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      login: (token, admin) => set({ token, admin }),
      setToken: (token) => set({ token }),
      setAdmin: (admin) => set({ admin }),
      logout: () => set({ token: null, admin: null }),
    }),
    { name: 'dailyvy-admin:session', storage: createJSONStorage(() => sessionStorage) },
  ),
)
