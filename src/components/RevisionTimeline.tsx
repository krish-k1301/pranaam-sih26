import { Lock, Unlock } from 'lucide-react'

export function RevisionTimeline({ signedBytes, addedBytes }: { signedBytes: number; addedBytes: number }) {
  const total = signedBytes + addedBytes
  const fmt = (n: number) => n.toLocaleString('en-IN')
  return (
    <div className="rounded-md bg-surface p-4 text-(--color-ink) border border-line">
      <p className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4">
        <span className="font-semibold">PDF revisions</span>
        <span className="num text-[12px] text-(--color-muted)">{fmt(total)} bytes in all</span>
      </p>
      <div className="flex h-9 gap-[3px]" role="img" aria-label={`Signed revision bytes 0 to ${fmt(signedBytes)}, later revision adds ${fmt(addedBytes)} bytes not covered by the signature`}>
        <div className="flex flex-[82] items-center gap-2 rounded-l-[3px] bg-ink px-3 text-[12px] font-medium text-surface">
          <Lock size={14} aria-hidden /> Signed
        </div>
        <div
          className="flex flex-[18] items-center justify-center gap-1.5 rounded-r-[3px] text-[12px] font-medium text-st-manual"
          style={{ background: 'color-mix(in srgb, var(--color-st-manual) 14%, var(--color-surface))', boxShadow: 'inset 0 0 0 1.5px var(--color-st-manual)' }}
        >
          <Unlock size={14} aria-hidden /> Added
        </div>
      </div>
      <ol className="mt-3 grid gap-1 text-[13px] sm:grid-cols-2 sm:gap-4">
        <li>
          <span className="font-medium">Signed revision:</span> <span className="num">bytes 0–{fmt(signedBytes)}</span>
        </li>
        <li className="sm:text-right">
          <span className="font-medium">Later revision:</span> <span className="num">+{fmt(addedBytes)} bytes</span>, not covered by signature
        </li>
      </ol>
    </div>
  )
}
