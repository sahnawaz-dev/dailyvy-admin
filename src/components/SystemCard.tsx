import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CircleAlert, CircleCheck, CircleMinus, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { api, errorMessage, type SystemStatus } from '@/lib/api'
import { formatAgo, formatDateTime } from '@/lib/format'

type Level = 'ok' | 'off' | 'problem'

const ICONS: Record<Level, ReactNode> = {
  ok: <CircleCheck className="size-4 text-primary" />,
  off: <CircleMinus className="size-4 text-muted-foreground" />,
  problem: <CircleAlert className="size-4 text-destructive" />,
}

function Row({ level, label, detail }: { level: Level; label: string; detail: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="mt-0.5">{ICONS[level]}</span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </div>
    </div>
  )
}

const EMAIL_SERVICE = { brevo: 'Brevo', smtp: 'SMTP', console: 'printed in the server log only' }

/**
 * Dashboard: is email working, can the server push to phones and browsers —
 * plus "Send test email" (to you). An expired Brevo key shows up here.
 */
export function SystemCard() {
  const queryClient = useQueryClient()
  const status = useQuery({ queryKey: ['system'], queryFn: () => api.get<SystemStatus>('/system') })
  const test = useMutation({
    mutationFn: () => api.post<{ sent: boolean; to: string; error?: string }>('/system/test-email'),
    onSuccess: ({ sent, to, error }) => {
      if (sent) toast.success(`Test email sent to ${to}. Check the inbox (and spam).`)
      else toast.error(`The email didn't go out: ${error}`)
      queryClient.invalidateQueries({ queryKey: ['system'] })
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const data = status.data
  const email = data?.email
  // A failure newer than the last success is a current problem
  const emailProblem =
    email?.lastError && (!email.lastSentAt || new Date(email.lastError.at) > new Date(email.lastSentAt))
  const emailLevel: Level = email?.transport === 'console' ? 'off' : emailProblem ? 'problem' : 'ok'

  return (
    <Card>
      <CardHeader>
        <CardTitle>System</CardTitle>
        <CardDescription>Is everything that sends things to people working?</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {status.isPending ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : status.isError ? (
          <p className="text-sm text-destructive">{status.error.message}</p>
        ) : (
          <div className="divide-y">
            <Row
              level={emailLevel}
              label={`Email (${EMAIL_SERVICE[email!.transport]})`}
              detail={
                emailProblem ? (
                  <span title={formatDateTime(email!.lastError!.at)}>
                    Failed {formatAgo(email!.lastError!.at)}: {email!.lastError!.message}
                  </span>
                ) : email!.lastSentAt ? (
                  <span title={formatDateTime(email!.lastSentAt)}>
                    Last sent {formatAgo(email!.lastSentAt)} · from {email!.from}
                  </span>
                ) : (
                  `Nothing sent since the server started · from ${email!.from}`
                )
              }
            />
            <Row
              level={data!.phonePush ? 'ok' : 'problem'}
              label="Phone notifications (Firebase)"
              detail={data!.phonePush ? 'Ready' : 'Not set up — the phone app schedules reminders itself'}
            />
            <Row
              level={data!.browserPush ? 'ok' : 'problem'}
              label="Browser notifications (Web Push)"
              detail={data!.browserPush ? 'Ready' : 'Not set up — VAPID keys missing on the server'}
            />
            <Row
              level="ok"
              label="Sign-up"
              detail={data!.signupOpen ? 'Open to everyone' : 'Invite-only (people request access)'}
            />
          </div>
        )}
        <div>
          <Button variant="outline" size="sm" disabled={test.isPending} onClick={() => test.mutate()}>
            {test.isPending ? <Spinner /> : <Mail />}
            Send test email
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
