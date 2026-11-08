import { TriangleAlert } from 'lucide-react'
import { useRouteError } from 'react-router'
import { Button } from '@/components/ui/button'

/** A crash on a page: a calm message with "Try again", instead of a blank / raw error screen. */
export function RouteErrorPage() {
  const error = useRouteError()
  const message = error instanceof Error ? error.message : String(error ?? '')

  return (
    <main className="grid min-h-svh place-items-center bg-muted/40 p-4">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <TriangleAlert className="size-10 text-destructive" aria-hidden />
        <h1 className="text-xl font-semibold">Something went wrong on this page</h1>
        <p className="text-sm text-muted-foreground">
          Try again. If it keeps happening, the server may be updating — wait a minute and reload.
        </p>
        {message && <p className="rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">{message}</p>}
        <div className="flex gap-2">
          <Button onClick={() => window.location.reload()}>Try again</Button>
          <Button variant="outline" onClick={() => window.location.assign(import.meta.env.BASE_URL)}>
            Dashboard
          </Button>
        </div>
      </div>
    </main>
  )
}
