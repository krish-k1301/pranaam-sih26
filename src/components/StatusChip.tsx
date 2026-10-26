import type { DocStatus } from '../lib/types'
import { STATUS_LABEL } from '../lib/status'

export const STATUS_HUE: Record<DocStatus, string> = {
  verified: 'var(--color-st-verified)',
  mismatch: 'var(--color-st-mismatch)',
  expired: 'var(--color-st-expired)',
  manual_review: 'var(--color-st-manual)',
  source_unavailable: 'var(--color-st-source)',
  pending: 'var(--color-st-pending)',
}

export function StatusChip({ status, className = '' }: { status: DocStatus; className?: string }) {
  const hue = STATUS_HUE[status]
  const outlined = status === 'pending'
  return (
    <span
      key={status}
      className={`chip-change inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-[4px] px-2 py-[2px] text-[12px] font-medium leading-[18px] ${className}`}
      style={{
        color: hue,
        background: outlined ? 'var(--color-surface)' : `color-mix(in srgb, ${hue} 12%, var(--color-surface))`,
        boxShadow: outlined ? `inset 0 0 0 1px ${hue}` : undefined,
      }}
    >
      <span
        aria-hidden
        className="size-[7px] rounded-full"
        style={{ background: outlined ? 'transparent' : hue, boxShadow: outlined ? `inset 0 0 0 1.5px ${hue}` : undefined }}
      />
      {STATUS_LABEL[status]}
    </span>
  )
}
