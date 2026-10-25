import type { DocStatus } from '../lib/types'
import { STATUS_LABEL, STATUS_PRECEDENCE } from '../lib/status'
import { STATUS_HUE } from './StatusChip'

export function StatusMiniBar({ counts, total }: { counts: Partial<Record<DocStatus, number>>; total: number }) {
  const parts = STATUS_PRECEDENCE.filter((s) => (counts[s] ?? 0) > 0)
  const label = parts.map((s) => `${counts[s]} ${STATUS_LABEL[s].toLowerCase()}`).join(', ')
  return (
    <div className="flex items-center gap-2" title={label}>
      <div role="img" aria-label={`${total} documents: ${label}`} className="flex h-2 w-[104px] flex-none gap-[2px] overflow-hidden rounded-[2px]">
        {parts.map((s) => (
          <span
            key={s}
            style={{
              flexGrow: counts[s],
              background: s === 'pending' ? 'var(--color-surface)' : STATUS_HUE[s],
              boxShadow: s === 'pending' ? `inset 0 0 0 1.5px ${STATUS_HUE[s]}` : undefined,
            }}
          />
        ))}
      </div>
      <span className="num text-[12px] text-faint">{total}</span>
    </div>
  )
}
