import { useQuery } from '@tanstack/react-query'
import { ArrowRight, UserPlus, Users, UserRoundPlus } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { api, type Stats } from '@/lib/api'

export function DashboardPage() {
  const stats = useQuery({ queryKey: ['stats'], queryFn: () => api.get<Stats>('/stats') })

  const cards = [
    { label: 'Waiting for approval', value: stats.data?.pendingRequests, icon: UserPlus, to: '/requests' },
    { label: 'Users', value: stats.data?.users, icon: Users, to: '/users' },
    { label: 'New this week', value: stats.data?.newThisWeek, icon: UserRoundPlus, to: '/users' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, to }) => (
          <Link key={label} to={to} className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardDescription>{label}</CardDescription>
                  <Icon className="size-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {stats.isPending ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  <p className="text-3xl font-semibold tabular-nums">{value ?? '–'}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {stats.isError && <p className="text-sm text-destructive">{stats.error.message}</p>}
      {(stats.data?.pendingRequests ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {stats.data!.pendingRequests} {stats.data!.pendingRequests === 1 ? 'person is' : 'people are'}{' '}
              waiting
            </CardTitle>
            <CardDescription>Approve to create their account and email a temporary password.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/requests">
                Review requests
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
