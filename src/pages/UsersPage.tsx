import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Search, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmButton } from '@/components/ConfirmButton'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api, errorMessage, type User } from '@/lib/api'
import { formatDate } from '@/lib/format'

export function UsersPage() {
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()
  const users = useQuery({ queryKey: ['users'], queryFn: () => api.get<User[]>('/users') })

  const resetPassword = useMutation({
    mutationFn: (user: User) => api.post(`/users/${user.id}/reset-password`),
    onSuccess: (_data, user) => toast.success(`A new temporary password was emailed to ${user.email}`),
    onError: (error) => toast.error(errorMessage(error)),
  })
  const remove = useMutation({
    mutationFn: (user: User) => api.delete(`/users/${user.id}`),
    onSuccess: (_data, user) => {
      toast.success(`${user.name}'s account was removed`)
      queryClient.invalidateQueries()
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
        <h1 className="text-2xl font-semibold">
          Users {users.data && <span className="text-muted-foreground">({users.data.length})</span>}
        </h1>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Timezone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>
                      <span className="mr-2">{user.email}</span>
                      {!user.emailVerified && <Badge variant="outline">not verified</Badge>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(user.registeredAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.timezone}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <ConfirmButton
                          title={`New password for ${user.name}?`}
                          description={`A new temporary password is emailed to ${user.email}. Their current password stops working and they're logged out on every device.`}
                          confirmLabel="Send new password"
                          disabled={resetPassword.isPending}
                          onConfirm={() => resetPassword.mutate(user)}
                        >
                          <KeyRound />
                          New password
                        </ConfirmButton>
                        <ConfirmButton
                          title={`Remove ${user.name}?`}
                          description="Their account and ALL their data (habits, tasks, focus history, challenges) are deleted for good. This can't be undone."
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
