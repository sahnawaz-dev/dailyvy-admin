import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LogOut, Mail, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { AdminAvatar } from '@/components/AdminAvatar'
import { ChangePasswordCard } from '@/components/ChangePasswordCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { useSession } from '@/auth/session'
import { api, errorMessage, type Admin } from '@/lib/api'
import { formatAgo, formatDate, formatDateTime } from '@/lib/format'

const ROLE_LABEL: Record<NonNullable<Admin['role']>, string> = { admin: 'Admin' }

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  )
}

/** The admin's own account: details, how they sign in, password, log out. */
export function AccountPage() {
  const setAdmin = useSession((s) => s.setAdmin)
  const logout = useSession((s) => s.logout)
  const queryClient = useQueryClient()
  const me = useQuery({ queryKey: ['me'], queryFn: () => api.get<Admin>('/auth/me') })
  const [name, setName] = useState('')

  // Keep the sidebar's name in step with the server, and fill the form once loaded
  useEffect(() => {
    if (!me.data) return
    setAdmin(me.data)
    setName(me.data.name) // eslint-disable-line react-hooks/set-state-in-effect -- form starts from the loaded value
  }, [me.data, setAdmin])

  const rename = useMutation({
    mutationFn: () => api.patch<Admin>('/auth/me', { name: name.trim() }),
    onSuccess: (admin) => {
      setAdmin(admin)
      queryClient.setQueryData(['me'], admin)
      toast.success('Name saved')
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const admin = me.data
  const nameChanged = admin && name.trim() && name.trim() !== admin.name
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (nameChanged) rename.mutate()
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Account</h1>

      {me.isPending ? (
        <Skeleton className="h-48 max-w-2xl" />
      ) : me.isError ? (
        <p className="text-sm text-destructive">{me.error.message}</p>
      ) : (
        <div className="grid max-w-5xl gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <AdminAvatar name={admin!.name} className="size-14 text-lg" />
                <div className="min-w-0">
                  <CardTitle className="truncate text-lg">{admin!.name}</CardTitle>
                  <CardDescription className="truncate">{admin!.email}</CardDescription>
                  <Badge className="mt-1.5">
                    <ShieldCheck />
                    {ROLE_LABEL[admin!.role ?? 'admin']}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} noValidate>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="admin-name">Name</FieldLabel>
                    <div className="flex gap-2">
                      <Input
                        id="admin-name"
                        autoComplete="name"
                        maxLength={80}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                      <Button type="submit" disabled={!nameChanged || rename.isPending}>
                        {rename.isPending && <Spinner />}
                        Save
                      </Button>
                    </div>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="admin-email">Email</FieldLabel>
                    <Input id="admin-email" value={admin!.email} disabled readOnly />
                    <p className="text-xs text-muted-foreground">
                      Your login, and where login codes are sent. To change it, create a new admin with{' '}
                      <code className="rounded bg-muted px-1">npm run admin:create</code>.
                    </p>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sign-in</CardTitle>
              <CardDescription>
                Logging in needs your password and a 6-digit code sent to your email. A login lasts at most 8 hours
                and ends when you close the tab.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="divide-y">
                <Detail label="This login">
                  {admin!.lastLoginAt ? formatDateTime(admin!.lastLoginAt) : '—'}
                </Detail>
                <Detail label="Previous login">
                  {admin!.previousLoginAt ? (
                    <span title={formatDateTime(admin!.previousLoginAt)}>{formatAgo(admin!.previousLoginAt)}</span>
                  ) : (
                    'none before this one'
                  )}
                </Detail>
                <Detail label="Admin since">{formatDate(admin!.createdAt)}</Detail>
                <Detail label="Login codes go to">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="size-3.5 text-muted-foreground" />
                    {admin!.email}
                  </span>
                </Detail>
              </div>
              <p className="text-xs text-muted-foreground">
                Don't recognise the previous login? Change your password: every other admin tab is logged out.
              </p>
              <div>
                <Button variant="outline" onClick={logout}>
                  <LogOut />
                  Log out
                </Button>
              </div>
            </CardContent>
          </Card>

          <ChangePasswordCard />
        </div>
      )}
    </div>
  )
}
