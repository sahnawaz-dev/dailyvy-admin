import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import type { User } from '@/lib/api'

const MIN_NOTE = 5
const MAX_NOTE = 1000

interface RemoveUserButtonProps {
  /** One user (the row's Remove) or several (Remove selected). */
  users: User[]
  /** The trigger: "Remove" on a row, "Remove selected (3)" for a selection. */
  label?: string
  variant?: 'ghost' | 'destructive'
  disabled?: boolean
  /** Resolves once removed (the dialog then closes); rejects to keep it open. */
  onRemove: (note: string) => Promise<unknown>
}

/** "Remove" asks why: the note is required and emailed to each person before their account goes. */
export function RemoveUserButton({
  users,
  label = 'Remove',
  variant = 'ghost',
  disabled,
  onRemove,
}: RemoveUserButtonProps) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const ready = note.trim().length >= MIN_NOTE
  const single = users.length === 1 ? users[0] : null
  const noteId = `remove-note-${single?.id ?? 'selected'}`

  const remove = async () => {
    setBusy(true)
    try {
      await onRemove(note.trim())
      setOpen(false)
      setNote('')
    } catch {
      // the error toast is shown by the caller; keep the dialog and the note
    } finally {
      setBusy(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant={variant} disabled={disabled || users.length === 0}>
          <Trash2 />
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {single ? `Remove ${single.name}?` : `Remove ${users.length} users?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {single ? 'Their account and ALL their data' : 'Their accounts and ALL their data'} (habits, tasks, focus
            history, challenges) are deleted for good. This can't be undone. To just stop someone for now, use Pause.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {!single && (
          <ul className="max-h-32 overflow-y-auto rounded-md border px-3 py-2 text-sm">
            {users.map((user) => (
              <li key={user.id} className="truncate">
                {user.name} <span className="text-muted-foreground">· {user.email}</span>
              </li>
            ))}
          </ul>
        )}
        <Field>
          <FieldLabel htmlFor={noteId}>
            Why? {single ? `(emailed to ${single.email})` : '(emailed to each of them)'}
          </FieldLabel>
          <Textarea
            id={noteId}
            rows={4}
            maxLength={MAX_NOTE}
            placeholder="e.g. This account has been inactive for over a year, so we're freeing up the spot."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <FieldDescription>
            They get an email with this note before the account is removed. At least {MIN_NOTE} characters.
          </FieldDescription>
        </Field>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={!ready || busy} onClick={remove}>
            {busy && <Spinner />}
            {single ? 'Email and remove' : `Email and remove ${users.length}`}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
