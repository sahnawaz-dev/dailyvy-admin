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
  user: User
  disabled?: boolean
  /** Resolves once removed (the dialog then closes); rejects to keep it open. */
  onRemove: (note: string) => Promise<unknown>
}

/** "Remove" asks why: the note is required and emailed to the person before their account goes. */
export function RemoveUserButton({ user, disabled, onRemove }: RemoveUserButtonProps) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const ready = note.trim().length >= MIN_NOTE

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
        <Button size="sm" variant="ghost" disabled={disabled}>
          <Trash2 />
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {user.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Their account and ALL their data (habits, tasks, focus history, challenges) are deleted for good. This
            can't be undone. To just stop them for now, use Pause.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Field>
          <FieldLabel htmlFor={`remove-note-${user.id}`}>Why? (emailed to {user.email})</FieldLabel>
          <Textarea
            id={`remove-note-${user.id}`}
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
            Email and remove
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
