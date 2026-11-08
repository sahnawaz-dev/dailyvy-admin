import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Pause, Play, Search, ShieldPlus, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmButton } from '@/components/ConfirmButton'
import { RemoveUserButton } from '@/components/RemoveUserButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useSession } from '@/auth/session'
import { api, errorMessage, type User } from '@/lib/api'
import { formatAgo, formatDate, formatDateTime } from '@/lib/format'
import {
  ACTIVITY_OPTIONS,
  filterUsers,
  isInactiveFilter,
  STATUS_OPTIONS,
  type ActivityFilter,
  type StatusFilter,
} from '@/lib/userFilters'

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
  const [activity, setActivity] = useState<ActivityFilter>('any')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
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
    mutationFn: ({ user, note }: { user: User; note: string }) =>
      api.delete<{ emailed: boolean }>(`/users/${user.id}`, { note }),
    onSuccess: ({ emailed }, { user }) => {
      toast.success(
        emailed
          ? `${user.name}'s account was removed — your note was emailed to them`
          : `${user.name}'s account was removed, but the email didn't go out`,
      )
      refresh()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const shown = filterUsers(users.data ?? [], { search, activity, status })
  const filtered = Boolean(search.trim()) || activity !== 'any' || status !== 'all'
  // Only rows on screen count as selected (a filter change hides the rest)
  const selected = shown.filter((user) => selectedIds.has(user.id))
  const allSelected = shown.length > 0 && selected.length === shown.length

  const toggle = (id: string, on: boolean) =>
    setSelectedIds((current) => {
      const next = new Set(current)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  const toggleAll = (on: boolean) => setSelectedIds(on ? new Set(shown.map((user) => user.id)) : new Set())
  const clearFilters = () => {
    setSearch('')
    setActivity('any')
    setStatus('all')
  }

  /** Remove selected: one by one, each person gets the email with the note first. */
  const removeSelected = async (note: string) => {
    let removed = 0
    let notEmailed = 0
    for (const user of selected) {
      try {
        const { emailed } = await api.delete<{ emailed: boolean }>(`/users/${user.id}`, { note })
        removed += 1
        if (!emailed) notEmailed += 1
      } catch (error) {
        toast.error(`${user.name}: ${errorMessage(error)}`)
      }
    }
    setSelectedIds(new Set())
    refresh()
    if (removed === 0) return
    const accounts = `${removed} ${removed === 1 ? 'account' : 'accounts'} removed`
    toast.success(
      notEmailed
        ? `${accounts} (${notEmailed} email${notEmailed === 1 ? '' : 's'} didn't go out)`
        : `${accounts} — your note was emailed to each`,
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name or email"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <NativeSelect
          aria-label="Activity"
          value={activity}
          onChange={(e) => setActivity(e.target.value as ActivityFilter)}
        >
          <NativeSelectOption value="any">Any time</NativeSelectOption>
          {(['Active', 'Inactive'] as const).map((group) => (
            <NativeSelectOptGroup key={group} label={group}>
              {ACTIVITY_OPTIONS.filter((option) => option.group === group).map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelectOptGroup>
          ))}
        </NativeSelect>
        <NativeSelect aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
          {STATUS_OPTIONS.map((option) => (
            <NativeSelectOption key={option.value} value={option.value}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        {filtered && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X />
            Clear filters
          </Button>
        )}
        <p className="ml-auto text-sm text-muted-foreground">
          {users.data
            ? filtered
              ? `${shown.length} of ${users.data.length}`
              : `${users.data.length} ${users.data.length === 1 ? 'person' : 'people'}`
            : ''}
          {isInactiveFilter(activity) && shown.length > 0 && ' · longest inactive first'}
        </p>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 px-4 py-2">
          <p className="text-sm font-medium">{selected.length} selected</p>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
            Clear selection
          </Button>
          <div className="ml-auto">
            <RemoveUserButton
              users={selected}
              label={`Remove selected (${selected.length})`}
              variant="destructive"
              onRemove={removeSelected}
            />
          </div>
        </div>
      )}

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
                <EmptyTitle>{filtered ? 'No matches' : 'No users yet'}</EmptyTitle>
                <EmptyDescription>
                  {filtered ? 'No one fits these filters.' : 'Approved access requests become users.'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      aria-label="Select all shown"
                      checked={allSelected ? true : selected.length > 0 ? 'indeterminate' : false}
                      onCheckedChange={(checked) => toggleAll(checked === true)}
                    />
                  </TableHead>
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
                  <TableRow
                    key={user.id}
                    data-state={selectedIds.has(user.id) ? 'selected' : undefined}
                    className={user.pausedAt ? 'opacity-70' : undefined}
                  >
                    <TableCell>
                      <Checkbox
                        aria-label={`Select ${user.name}`}
                        checked={selectedIds.has(user.id)}
                        onCheckedChange={(checked) => toggle(user.id, checked === true)}
                      />
                    </TableCell>
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
                        <RemoveUserButton
                          users={[user]}
                          disabled={remove.isPending}
                          onRemove={(note) => remove.mutateAsync({ user, note })}
                        />
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
