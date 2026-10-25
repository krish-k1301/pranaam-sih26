import { useEffect, useId, useRef, useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  title: string
  description: string
  label: string
  initial?: string
  required?: boolean
  submitLabel: string
  onSubmit: (text: string) => void
  onClose: () => void
}

/** A modal that asks for written text. When `required`, submission is blocked until there is some. */
export function ReviewDialog({ title, description, label, initial = '', required = false, submitLabel, onSubmit, onClose }: Props) {
  const [text, setText] = useState(initial)
  const [tried, setTried] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const id = useId()
  const empty = text.trim().length === 0
  const invalid = required && empty

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && panel.current) {
        const els = panel.current.querySelectorAll<HTMLElement>('button, textarea')
        const first = els[0]
        const last = els[els.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      prev?.focus()
    }
  }, [onClose])

  const submit = () => {
    setTried(true)
    if (invalid) {
      ref.current?.focus()
      return
    }
    onSubmit(text.trim())
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-t`}
        className="toast-in w-full max-w-[520px] rounded-t-xl bg-surface p-5 shadow-[0_16px_48px_rgb(22_33_58/0.28)] sm:rounded-lg"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={`${id}-t`} className="text-[18px] font-semibold leading-6">
            {title}
          </h2>
          <button onClick={onClose} aria-label="Close" className="-m-1 rounded p-1 text-muted hover:bg-active">
            <X size={18} />
          </button>
        </div>
        <p className="mt-1 text-muted">{description}</p>
        <label htmlFor={`${id}-f`} className="mt-4 block font-medium">
          {label}
          {required && <span className="font-normal text-muted"> (required)</span>}
        </label>
        <textarea
          id={`${id}-f`}
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          aria-invalid={tried && invalid}
          aria-describedby={`${id}-h`}
          className={`mt-2 w-full resize-y rounded-md border bg-surface px-3 py-2 text-[14px] leading-5 outline-none focus:border-action focus:ring-2 focus:ring-action/25 ${
            tried && invalid ? 'border-stamp' : 'border-control'
          }`}
        />
        <p id={`${id}-h`} className={`mt-1 text-[12px] ${tried && invalid ? 'text-stamp' : 'text-faint'}`}>
          {tried && invalid ? 'Write a reason before dismissing. It is kept in the audit trail.' : 'Saved to the audit trail with your name and the time.'}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="h-9 rounded-md border border-control bg-surface px-4 font-medium hover:bg-raised active:translate-y-px">
            Cancel
          </button>
          <button
            onClick={submit}
            aria-disabled={invalid}
            className={`h-9 rounded-md px-4 font-medium text-white active:translate-y-px ${invalid ? 'bg-action/45' : 'bg-action hover:bg-action-dark'}`}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
