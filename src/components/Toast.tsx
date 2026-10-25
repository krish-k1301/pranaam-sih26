import { CheckCircle2 } from 'lucide-react'
import { useStore } from '../state/DemoStore'

export function Toasts() {
  const { toasts } = useStore()
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6">
      {toasts.map((t) => (
        <div key={t.id} className="toast-in flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-[14px] font-medium text-white shadow-[0_8px_24px_rgb(22_33_58/0.25)]">
          <CheckCircle2 size={16} aria-hidden />
          {t.text}
        </div>
      ))}
    </div>
  )
}
