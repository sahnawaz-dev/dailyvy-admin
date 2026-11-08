import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, ShieldMinus } from 'lucide-react'
import { toast } from 'sonner'
import { AdminAvatar } from '@/components/AdminAvatar'
import { ConfirmButton } from '@/components/ConfirmButton'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useSession } from '@/auth/session'
import { api, errorMessage, type Admin } from '@/lib/api'
import { formatAgo, formatDate, formatDateTime } from '@/lib/format'

/**
 * Users page → Admins tab: who has admin-panel access. The owner can make an
 * admin a plain user again (from the Users tab: a user an admin).
 */
export function AdminsTab() {
  const me = useSession((s) => s.admin)
  const isOwner = me?.role === 'owner'
  const queryClient = useQueryClient()
  const admins = useQuery({ queryKey: ['admins'], queryFn: () => api.get<Admin[]>('/admins') })

  const makeUser = useMutation({
    mutationFn: (admin: Admin) =>
      api.post<{ createdUser: boolean; emailed: boolean }>(`/admins/${admin.id}/make-user`),
    onSuccess: ({ createdUser }, admin) => {
      toast.success(
        createdUser
          ? `${admin.name} is a user now — an app account was created and the login emailed`
          : `${admin.name} is a user now (admin access removed)`,
      )
      queryClient.invalidateQueries()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        {isOwner
          ? 'Make a user an admin from the Users tab. Admins have their own login (password + emailed code).'
          : 'Only the owner can add or remove admins.'}
      </p>
      <Card>
        <CardContent>
          {admins.isPending ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : admins.isError ? (
            <p className="text-sm text-destructive">{admins.error.message}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead>Admin since</TableHead>
                  {isOwner && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.data.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <AdminAvatar name={admin.name} />
                        <div className="min-w-0">
                          <p className="font-medium">
                            {admin.name}
                            {admin.id === me?.id && <span className="text-muted-foreground"> (you)</span>}
                          </p>
                          <p className="text-muted-foreground">{admin.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={admin.role === 'owner' ? 'default' : 'secondary'}>
                        {admin.role === 'owner' && <ShieldCheck />}
                        {admin.role === 'owner' ? 'Owner' : 'Admin'}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="whitespace-nowrap text-muted-foreground"
                      title={admin.lastLoginAt ? formatDateTime(admin.lastLoginAt) : undefined}
                    >
                      {admin.lastLoginAt ? formatAgo(admin.lastLoginAt) : 'never'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(admin.createdAt)}
                    </TableCell>
                    {isOwner && (
                      <TableCell>
                        <div className="flex justify-end">
                          {admin.role !== 'owner' && (
                            <ConfirmButton
                              title={`Make ${admin.name} a user?`}
                              description={`Their admin-panel access ends right away. If ${admin.email} has no Dailyvy app account yet, one is created and the login is emailed.`}
                              confirmLabel="Make user"
                              destructive
                              disabled={makeUser.isPending}
                              onConfirm={() => makeUser.mutate(admin)}
                            >
                              <ShieldMinus />
                              Make user
                            </ConfirmButton>
                          )}
                        </div>
                      </TableCell>
                    )}
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
