import { STATUS_LABEL, STATUS_PRECEDENCE } from '../lib/status'
import { STATUS_HUE } from './StatusChip'

/** The key to the document-status bars: colour is never the only cue. */
export function StatusLegend() {
  return (
    <div className="border-t border-rule px-4 py-3">
      <p className="sr-only">Document status key, most serious first</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-muted">
        {STATUS_PRECEDENCE.map((s) => (
          <li key={s} className="flex items-center gap-1.5 whitespace-nowrap">
            <span
              aria-hidden
              className="h-2 w-3.5 rounded-[2px]"
              style={{ background: s === 'pending' ? 'transparent' : STATUS_HUE[s], boxShadow: s === 'pending' ? `inset 0 0 0 1.5px ${STATUS_HUE[s]}` : undefined }}
            />
            {STATUS_LABEL[s]}
          </li>
        ))}
      </ul>
    </div>
  )
}
