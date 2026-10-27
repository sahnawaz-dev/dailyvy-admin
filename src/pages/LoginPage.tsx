import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AlertCircle, ShieldCheck } from 'lucide-react'
import { Navigate } from 'react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useSession } from '@/auth/session'
import { api, errorMessage, type Admin } from '@/lib/api'

/** Step 1: email + password. Step 2: the 6-digit code we emailed. */
export function LoginPage() {
  const token = useSession((s) => s.token)
  const loginAs = useSession((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'password' | 'code'>('password')

  const sendCode = useMutation({
    mutationFn: () => api.post('/auth/login', { email: email.trim(), password }),
    onSuccess: () => {
      setPassword('')
      setStep('code')
    },
  })
  const verify = useMutation({
    mutationFn: () =>
      api.post<{ token: string; admin: Admin }>('/auth/verify', { email: email.trim(), code }),
    onSuccess: ({ token, admin }) => loginAs(token, admin),
  })

  if (token) return <Navigate to="/" replace />

  const error = step === 'password' ? sendCode.error : verify.error
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (step === 'password' && email.trim() && password) sendCode.mutate()
    if (step === 'code' && code.length === 6) verify.mutate()
  }

  return (
    <main className="grid min-h-svh place-items-center bg-muted/40 p-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-semibold">
          <img src={`${import.meta.env.BASE_URL}favicon-32.png`} alt="" className="size-8" />
          <span className="text-lg">Dailyvy Admin</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{step === 'password' ? 'Log in' : 'Check your email'}</CardTitle>
            <CardDescription>
              {step === 'password'
                ? 'Admins only.'
                : `We sent a 6-digit code to ${email.trim()}. It expires in 10 minutes.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} noValidate>
              <FieldGroup>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle />
                    <AlertDescription>{errorMessage(error)}</AlertDescription>
                  </Alert>
                )}
                {step === 'password' ? (
                  <>
                    <Field>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="username"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </Field>
                    <Button type="submit" disabled={!email.trim() || !password || sendCode.isPending}>
                      {sendCode.isPending && <Spinner />}
                      Continue
                    </Button>
                  </>
                ) : (
                  <>
                    <Field>
                      <FieldLabel htmlFor="code">Login code</FieldLabel>
                      <Input
                        id="code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        autoFocus
                        maxLength={6}
                        className="text-center font-mono text-lg tracking-[0.5em]"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      />
                      <FieldDescription>Didn't get it? Check spam, or start over.</FieldDescription>
                    </Field>
                    <Button type="submit" disabled={code.length !== 6 || verify.isPending}>
                      {verify.isPending ? <Spinner /> : <ShieldCheck />}
                      Verify and log in
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setCode('')
                        verify.reset()
                        setStep('password')
                      }}
                    >
                      Start over
                    </Button>
                  </>
                )}
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
