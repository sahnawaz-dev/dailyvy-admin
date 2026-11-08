import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Pause, Play, Search, ShieldPlus, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmButton } from '@/components/ConfirmButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useSession } from '@/auth/session'
import { api, errorMessage, type User } from '@/lib/api'
import { formatAgo, formatDate, formatDateTime } from '@/lib/format'

/** One line under the name: admin / paused / still on the temporary password / not verified. */
function StatusBadges({ user }: { user: User }) {
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {user.isAdmin && <Badge>admin</Badge>}
      {user.pausedAt && <Badge variant="destructive">paused</Badge>}
      {user.mustChangePassword && <Badge variant="secondary">temporary password</Badge>}
      {!user.emailVerified && <Badge variant="outline">not verified</Badge>}
    </div>
  )
}

/** Users page → Users tab: everyone with an app account, how active they are, and what the admin can do. */
export function UsersTab() {
  const isOwner = useSession((s) => s.admin?.role === 'owner')
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()
  const users = useQuery({ queryKey: ['users'], queryFn: () => api.get<User[]>('/users') })
  const refresh = () => queryClient.invalidateQueries()

  const resetPassword = useMutation({
    mutationFn: (user: User) => api.post(`/users/${user.id}/reset-password`),
    onSuccess: (_data, user) => {
      toast.success(`A new temporary password was emailed to ${user.email}`)
      refresh()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
  const pause = useMutation({
    mutationFn: ({ user, paused }: { user: User; paused: boolean }) =>
      api.post(`/users/${user.id}/${paused ? 'pause' : 'unpause'}`),
    onSuccess: (_data, { user, paused }) => {
      toast.success(paused ? `${user.name} is paused` : `${user.name} can log in again`)
      refresh()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
  const makeAdmin = useMutation({
    mutationFn: (user: User) => api.post<{ emailed: boolean }>(`/users/${user.id}/make-admin`),
    onSuccess: ({ emailed }, user) => {
      if (emailed) toast.success(`${user.name} is an admin now — the admin login was emailed to ${user.email}`)
      else toast.warning(`${user.name} is an admin now, but the email didn't go out`)
      refresh()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
  const remove = useMutation({
    mutationFn: (user: User) => api.delete(`/users/${user.id}`),
    onSuccess: (_data, user) => {
      toast.success(`${user.name}'s account was removed`)
      refresh()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const term = search.trim().toLowerCase()
  const shown = (users.data ?? []).filter(
    (user) => !term || user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term),
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {users.data ? `${users.data.length} ${users.data.length === 1 ? 'person' : 'people'}` : ''}
        </p>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name or email"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent>
          {users.isPending ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : users.isError ? (
            <p className="text-sm text-destructive">{users.error.message}</p>
          ) : shown.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users />
                </EmptyMedia>
                <EmptyTitle>{term ? 'No matches' : 'No users yet'}</EmptyTitle>
                <EmptyDescription>
                  {term ? 'Try another name or email.' : 'Approved access requests become users.'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Last active</TableHead>
                  <TableHead className="text-right">Devices</TableHead>
                  <TableHead className="text-right">Habits</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((user) => (
                  <TableRow key={user.id} className={user.pausedAt ? 'opacity-70' : undefined}>
                    <TableCell>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-muted-foreground">{user.email}</p>
                      <StatusBadges user={user} />
                    </TableCell>
                    <TableCell
                      className="whitespace-nowrap text-muted-foreground"
                      title={user.lastActiveAt ? formatDateTime(user.lastActiveAt) : undefined}
                    >
                      {user.lastActiveAt ? formatAgo(user.lastActiveAt) : 'never'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{user.devices}</TableCell>
                    <TableCell className="text-right tabular-nums">{user.habits}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(user.registeredAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <ConfirmButton
                          title={`New password for ${user.name}?`}
                          description={`A new temporary password is emailed to ${user.email}. Their current password stops working, they're logged out on every device, and they choose their own at the next login.`}
                          confirmLabel="Send new password"
                          disabled={resetPassword.isPending}
                          onConfirm={() => resetPassword.mutate(user)}
                        >
                          <KeyRound />
                          New password
                        </ConfirmButton>
                        {user.pausedAt ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={pause.isPending}
                            onClick={() => pause.mutate({ user, paused: false })}
                          >
                            <Play />
                            Unpause
                          </Button>
                        ) : (
                          <ConfirmButton
                            title={`Pause ${user.name}?`}
                            description="They're logged out on every device and can't log in until you unpause them. Nothing is deleted."
                            confirmLabel="Pause"
                            disabled={pause.isPending}
                            onConfirm={() => pause.mutate({ user, paused: true })}
                          >
                            <Pause />
                            Pause
                          </ConfirmButton>
                        )}
                        {isOwner && !user.isAdmin && (
                          <ConfirmButton
                            title={`Make ${user.name} an admin?`}
                            description={`They get admin-panel access (with its own login) and a temporary admin password by email at ${user.email}. Their app account stays as it is. You can undo this from the Admins tab.`}
                            confirmLabel="Make admin"
                            disabled={makeAdmin.isPending}
                            onConfirm={() => makeAdmin.mutate(user)}
                          >
                            <ShieldPlus />
                            Make admin
                          </ConfirmButton>
                        )}
                        <ConfirmButton
                          title={`Remove ${user.name}?`}
                          description="Their account and ALL their data (habits, tasks, focus history, challenges) are deleted for good. This can't be undone. To just stop them for now, use Pause."
                          confirmLabel="Remove for good"
                          destructive
                          variant="ghost"
                          disabled={remove.isPending}
                          onConfirm={() => remove.mutate(user)}
                        >
                          <Trash2 />
                          Remove
                        </ConfirmButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
