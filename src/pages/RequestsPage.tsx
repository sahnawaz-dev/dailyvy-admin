import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Inbox, X } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmButton } from '@/components/ConfirmButton'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api, errorMessage, type AccessRequest, type RequestStatus } from '@/lib/api'
import { formatDateTime } from '@/lib/format'

const TABS: { value: RequestStatus; label: string }[] = [
  { value: 'pending', label: 'Waiting' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

export function RequestsPage() {
  const [status, setStatus] = useState<RequestStatus>('pending')
  const queryClient = useQueryClient()
  const requests = useQuery({
    queryKey: ['requests', status],
    queryFn: () => api.get<AccessRequest[]>(`/access-requests?status=${status}`),
  })

  const refresh = () => queryClient.invalidateQueries()
  const approve = useMutation({
    mutationFn: (id: string) => api.post<{ emailed: boolean; user: { email: string } }>(`/access-requests/${id}/approve`),
    onSuccess: ({ emailed, user }) => {
      if (emailed) toast.success(`Approved — the temporary password was emailed to ${user.email}`)
      else toast.warning("Approved, but the email didn't go out. Send a new password from Users.")
      refresh()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
  const reject = useMutation({
    mutationFn: (id: string) => api.post(`/access-requests/${id}/reject`),
    onSuccess: () => {
      toast.success('Request rejected')
      refresh()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
  const busy = approve.isPending || reject.isPending

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Access requests</h1>
        <Tabs value={status} onValueChange={(value) => setStatus(value as RequestStatus)}>
          <TabsList>
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardContent>
          {requests.isPending ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : requests.isError ? (
            <p className="text-sm text-destructive">{requests.error.message}</p>
          ) : requests.data.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Inbox />
                </EmptyMedia>
                <EmptyTitle>Nothing here</EmptyTitle>
                <EmptyDescription>
                  {status === 'pending'
                    ? 'No one is waiting. New requests from the web app show up here.'
                    : `No ${status} requests yet.`}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>How they know Dailyvy</TableHead>
                  <TableHead>{status === 'pending' ? 'Asked' : 'Decided'}</TableHead>
                  <TableHead className="text-right">{status === 'pending' ? 'Decision' : 'Status'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.data.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.name}</TableCell>
                    <TableCell>{request.email}</TableCell>
                    <TableCell className="max-w-xs whitespace-normal text-muted-foreground">{request.source}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(request.decidedAt ?? request.createdAt)}
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <ConfirmButton
                            title={`Reject ${request.name}?`}
                            description="They won't get an account or an email. They can ask again later."
                            confirmLabel="Reject"
                            destructive
                            disabled={busy}
                            onConfirm={() => reject.mutate(request.id)}
                          >
                            <X />
                            Reject
                          </ConfirmButton>
                          <ConfirmButton
                            title={`Approve ${request.name}?`}
                            description={`An account is created for ${request.email} and a temporary password is emailed to them.`}
                            confirmLabel="Approve"
                            variant="default"
                            disabled={busy}
                            onConfirm={() => approve.mutate(request.id)}
                          >
                            <Check />
                            Approve
                          </ConfirmButton>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <Badge variant={request.status === 'approved' ? 'default' : 'secondary'}>
                            {request.status}
                          </Badge>
                        </div>
                      )}
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
