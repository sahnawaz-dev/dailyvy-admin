import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useSession } from '@/auth/session'
import { api, errorMessage } from '@/lib/api'

/** Same rules as the server (common/validators/password.js). */
function passwordProblem(password: string) {
  if (password.length < 8) return 'At least 8 characters'
  if (!/[a-z]/.test(password)) return 'Add a lowercase letter'
  if (!/[A-Z]/.test(password)) return 'Add an uppercase letter'
  if (!/\d/.test(password)) return 'Add a number'
  return null
}

export function ChangePasswordPage() {
  const setToken = useSession((s) => s.setToken)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')

  const change = useMutation({
    mutationFn: () =>
      api.post<{ token: string }>('/auth/change-password', { currentPassword: current, newPassword: next }),
    onSuccess: ({ token }) => {
      setToken(token) // this tab stays logged in; others are logged out
      setCurrent('')
      setNext('')
      setConfirm('')
      toast.success('Password changed. Other admin tabs were logged out.')
    },
  })

  const nextProblem = next ? passwordProblem(next) : null
  const confirmProblem = confirm && confirm !== next ? "Passwords don't match" : null
  const canSubmit = current && next && !nextProblem && confirm === next

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (canSubmit) change.mutate()
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Change password</h1>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Your admin password</CardTitle>
          <CardDescription>Logging in still needs the code we email you.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} noValidate>
            <FieldGroup>
              {change.isError && (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertDescription>{errorMessage(change.error)}</AlertDescription>
                </Alert>
              )}
              <Field>
                <FieldLabel htmlFor="current">Current password</FieldLabel>
                <Input
                  id="current"
                  type="password"
                  autoComplete="current-password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                />
              </Field>
              <Field data-invalid={Boolean(nextProblem)}>
                <FieldLabel htmlFor="next">New password</FieldLabel>
                <Input
                  id="next"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(nextProblem)}
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                />
                {nextProblem ? (
                  <FieldError>{nextProblem}</FieldError>
                ) : (
                  <FieldDescription>8+ characters with upper- and lowercase letters and a number.</FieldDescription>
                )}
              </Field>
              <Field data-invalid={Boolean(confirmProblem)}>
                <FieldLabel htmlFor="confirm">Confirm new password</FieldLabel>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(confirmProblem)}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                {confirmProblem && <FieldError>{confirmProblem}</FieldError>}
              </Field>
              <Button type="submit" disabled={!canSubmit || change.isPending}>
                {change.isPending && <Spinner />}
                Change password
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
