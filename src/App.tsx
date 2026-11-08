import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { Toaster } from 'sonner'
import { AdminLayout } from '@/components/AdminLayout'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AccountPage } from '@/pages/AccountPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { RequestsPage } from '@/pages/RequestsPage'
import { UsersPage } from '@/pages/UsersPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: true } },
})

const router = createBrowserRouter(
  [
    { path: '/login', element: <LoginPage /> },
    {
      element: <AdminLayout />,
      children: [
        { index: true, element: <DashboardPage /> },
        { path: 'requests', element: <RequestsPage /> },
        { path: 'users', element: <UsersPage /> },
        { path: 'account', element: <AccountPage /> },
        { path: 'password', element: <Navigate to="/account" replace /> },
      ],
    },
    { path: '*', element: <Navigate to="/" replace /> },
  ],
  // GitHub Pages serves the site from /<repo>/ (VITE_BASE)
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
)

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>
        <RouterProvider router={router} />
      </TooltipProvider>
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  )
}
