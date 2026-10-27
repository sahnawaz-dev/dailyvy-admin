import { KeyRound, LayoutDashboard, LogOut, UserPlus, Users } from 'lucide-react'
import { NavLink, Navigate, Outlet } from 'react-router'
import { Button } from '@/components/ui/button'
import { useSession } from '@/auth/session'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/requests', label: 'Access requests', icon: UserPlus },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/password', label: 'Change password', icon: KeyRound },
]

/** The logged-in shell: top bar with the sections and Log out. */
export function AdminLayout() {
  const token = useSession((s) => s.token)
  const admin = useSession((s) => s.admin)
  const logout = useSession((s) => s.logout)
  if (!token) return <Navigate to="/login" replace />

  return (
    <div className="min-h-svh bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <div className="flex items-center gap-2 font-semibold">
            <img src={`${import.meta.env.BASE_URL}favicon-32.png`} alt="" className="size-7" />
            Dailyvy Admin
          </div>
          <nav className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                    isActive && 'bg-muted font-medium text-foreground',
                  )
                }
              >
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground md:inline">{admin?.email}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut />
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
