/**
 * The logged-in shell: shadcn's Sidebar (collapsible to icons on desktop, a
 * drawer below the top bar on phones) with the sections, the admin and Log out.
 * Sizes follow the team's responsive sidebar spec: a little smaller on screens
 * up to 17" (≤ 1680px), larger above (`wide:`).
 */
import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import {
  ChevronsLeft,
  ChevronsRight,
  Equal,
  KeyRound,
  LayoutDashboard,
  LogOut,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { useSession } from '@/auth/session'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/requests', label: 'Access requests', icon: UserPlus },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/password', label: 'Change password', icon: KeyRound },
]

const logoSrc = `${import.meta.env.BASE_URL}favicon-32.png`

/** Nav buttons: responsive sizes for the expanded and collapsed (icon) sidebar, pill tabs on phones. */
const navButton = cn(
  'h-12 w-full justify-start gap-3.5 rounded-l-none rounded-r-2xl pl-4 pr-3 text-[15px] font-medium',
  '[&_svg]:size-5 wide:[&_svg]:size-6',
  'md:h-11 md:gap-3 md:rounded-l-xl md:rounded-r-none md:px-3 md:text-sm',
  'wide:h-12 wide:gap-3.5 wide:text-[15px]',
  'group-data-[collapsible=icon]:size-12! group-data-[collapsible=icon]:rounded-[14px]! group-data-[collapsible=icon]:[&_svg]:size-5',
  'wide:group-data-[collapsible=icon]:size-14! wide:group-data-[collapsible=icon]:rounded-[16px]! wide:group-data-[collapsible=icon]:[&_svg]:size-6',
  // Collapsed: just the icon, centred (no label taking space, no side padding)
  'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:[&>span]:hidden',
)

function AdminSidebar() {
  const { isMobile, setOpenMobile, state, toggleSidebar } = useSidebar()
  const admin = useSession((s) => s.admin)
  const logout = useSession((s) => s.logout)
  const { pathname } = useLocation()
  const closeOnPhone = () => {
    if (isMobile) setOpenMobile(false)
  }
  const collapsed = state === 'collapsed' && !isMobile
  const Toggle = collapsed ? ChevronsRight : ChevronsLeft

  return (
    <Sidebar collapsible="icon">
      {isMobile ? (
        <div className="flex h-12 w-full items-center justify-end px-3">
          <button
            type="button"
            onClick={() => setOpenMobile(false)}
            aria-label="Close menu"
            className="flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-sidebar-accent"
          >
            <X className="size-5" />
          </button>
        </div>
      ) : (
        <SidebarHeader className="group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-4 group-data-[collapsible=icon]:pt-6 wide:group-data-[collapsible=icon]:px-6 wide:group-data-[collapsible=icon]:pt-8">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2 rounded-md px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:p-0"
          >
            <img
              src={logoSrc}
              alt=""
              className="size-8 shrink-0 rounded-lg group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:w-9 wide:group-data-[collapsible=icon]:h-10 wide:group-data-[collapsible=icon]:w-10"
            />
            <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">Dailyvy Admin</span>
          </Link>
        </SidebarHeader>
      )}

      <SidebarContent className="p-0 pb-4 md:pl-2 md:pt-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:pt-6 wide:group-data-[collapsible=icon]:pt-8">
        <SidebarMenu className="space-y-1.5 pr-3 md:space-y-1 md:pr-0 group-data-[collapsible=icon]:items-center">
          {NAV.map(({ to, label, icon: Icon, end }) => {
            const active = end ? pathname === to : pathname.startsWith(to)
            return (
              <SidebarMenuItem key={to}>
                <SidebarMenuButton asChild isActive={active} tooltip={label} className={navButton}>
                  <NavLink to={to} end={end} onClick={closeOnPhone}>
                    <Icon />
                    <span>{label}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="pr-3 md:pr-0 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:pr-2">
        <p
          className="truncate px-4 pb-1 text-xs text-muted-foreground md:px-2 group-data-[collapsible=icon]:hidden"
          title={admin?.email}
        >
          {admin?.email}
        </p>
        <SidebarMenu className="group-data-[collapsible=icon]:items-center">
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Log out" onClick={logout} className={navButton}>
              <LogOut />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* Collapse / expand: always the last item, so it doesn't move around */}
          {!isMobile && (
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={collapsed ? 'Expand sidebar' : undefined}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                onClick={toggleSidebar}
                className={cn(navButton, 'text-muted-foreground')}
              >
                <Toggle />
                <span>Collapse sidebar</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
      {!isMobile && <SidebarRail />}
    </Sidebar>
  )
}

/** Phones only: hamburger + logo. Publishes its height so the drawer opens below it. */
function MobileTopBar() {
  const { toggleSidebar } = useSidebar()
  const headerRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = headerRef.current
    if (!el) return
    const setHeight = () =>
      document.documentElement.style.setProperty('--navbar-height', `${el.offsetHeight}px`)
    setHeight()
    const observer = new ResizeObserver(setHeight)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-60 flex items-center gap-3 border-b bg-background px-4 py-3 md:hidden"
    >
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Equal className="size-5" />
      </button>
      <Link to="/" className="flex flex-1 items-center justify-center gap-2 font-semibold">
        <img src={logoSrc} alt="" className="size-8 rounded-lg" />
        Dailyvy Admin
      </Link>
      <span className="size-9" aria-hidden />
    </header>
  )
}

export function AdminLayout() {
  const token = useSession((s) => s.token)
  if (!token) return <Navigate to="/login" replace />

  return (
    <SidebarProvider
      // Collapsed sidebar is a little narrower on screens up to 17"
      style={{ '--sidebar-width-icon': 'var(--app-sidebar-width-icon)' } as CSSProperties}
      className="[--app-sidebar-width-icon:5rem] wide:[--app-sidebar-width-icon:6rem]"
    >
      <AdminSidebar />
      <SidebarInset className="min-w-0 bg-muted/30">
        <MobileTopBar />
        <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
