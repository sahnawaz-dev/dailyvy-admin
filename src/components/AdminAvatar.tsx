import { initials } from '@/lib/initials'
import { cn } from '@/lib/utils'

/** A circle with the admin's initials (a div, so the collapsed sidebar's "hide the label" rule leaves it alone). */
export function AdminAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary',
        className,
      )}
    >
      {initials(name)}
    </div>
  )
}
