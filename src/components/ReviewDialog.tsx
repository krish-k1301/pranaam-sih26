import { useCallback, useId, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useDialog } from '../lib/hooks'

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
  const field = useRef<HTMLTextAreaElement>(null)
  const id = useId()
  const invalid = required && text.trim().length === 0
  const dirty = text !== initial

  // Typed text is not thrown away silently.
  const requestClose = useCallback(() => {
    if (!dirty || window.confirm('Discard what you have written?')) onClose()
  }, [dirty, onClose])
  const panel = useDialog<HTMLDivElement>(requestClose, field)

  const submit = () => {
    setTried(true)
    if (invalid) {
      field.current?.focus()
      return
    }
    onSubmit(text.trim())
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center overscroll-contain bg-night/50 p-0 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && requestClose()}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-t`}
        aria-describedby={`${id}-d`}
        className="toast-in w-full max-w-[520px] overscroll-contain rounded-t-xl bg-surface p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-[0_16px_48px_rgb(22_33_58/0.28)] sm:rounded-lg sm:pb-5"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={`${id}-t`} className="text-[18px] font-semibold leading-6">
            {title}
          </h2>
          <button onClick={requestClose} aria-label="Close" className="-m-1 flex size-8 items-center justify-center rounded text-muted hover:bg-active hover:text-ink">
            <X size={18} aria-hidden />
          </button>
        </div>
        <p id={`${id}-d`} className="mt-1 text-muted">
          {description}
        </p>
        <label htmlFor={`${id}-f`} className="mt-4 block font-medium">
          {label}
          {required && <span className="font-normal text-muted"> (required)</span>}
        </label>
        <textarea
          id={`${id}-f`}
          name="review-text"
          ref={field}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              submit()
            }
          }}
          rows={4}
          autoComplete="off"
          aria-invalid={tried && invalid}
          aria-describedby={`${id}-h`}
          className={`mt-2 w-full resize-y rounded-md border bg-surface px-3 py-2 text-[14px] leading-5 outline-none focus:border-action focus:ring-2 focus:ring-action/25 ${
            tried && invalid ? 'border-stamp' : 'border-control'
          }`}
        />
        <p id={`${id}-h`} aria-live="polite" className={`mt-1 text-[12px] ${tried && invalid ? 'text-stamp' : 'text-faint'}`}>
          {tried && invalid ? 'Write a reason, then submit again. It is kept in the audit trail.' : 'Saved to the audit trail with your name & the time. Ctrl or ⌘ + Enter submits.'}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={requestClose} className="h-9 rounded-md border border-control bg-surface px-4 font-medium hover:border-ink-2 hover:bg-raised active:translate-y-px">
            Cancel
          </button>
          <button onClick={submit} className="h-9 rounded-md bg-action px-4 font-medium text-white hover:bg-action-dark active:translate-y-px">
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
