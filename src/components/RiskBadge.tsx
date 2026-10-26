import type { Risk, RiskBand } from '../lib/status'
import type { Severity } from '../lib/types'

const BAND_LABEL: Record<RiskBand, string> = { high: 'High', medium: 'Medium', low: 'Low' }

/** Risk stays in ink: red is kept for critical findings and mismatches only. */
export function BandBadge({ band }: { band: RiskBand }) {
  const cls =
    band === 'high'
      ? 'bg-ink text-surface'
      : band === 'medium'
        ? 'bg-surface text-ink shadow-[inset_0_0_0_1.5px_var(--color-ink)]'
        : 'bg-active text-muted'
  return <span className={`inline-flex flex-none items-center whitespace-nowrap rounded-[4px] px-1.5 text-[12px] font-medium leading-[18px] ${cls}`}>{BAND_LABEL[band]}</span>
}

export function RiskBadge({ risk }: { risk: Risk }) {
  return (
    <span className="inline-flex items-center gap-2" aria-label={`Risk score ${risk.score}, ${risk.band}`}>
      <span className="num w-6 text-right text-[15px] font-semibold">{risk.score}</span>
      <BandBadge band={risk.band} />
    </span>
  )
}

export function SeverityMark({ severity, withLabel = false }: { severity: Severity; withLabel?: boolean }) {
  const dot =
    severity === 'critical' ? (
      <span className="size-2 rounded-full bg-stamp" />
    ) : severity === 'major' ? (
      <span className="size-2 rounded-full bg-ink" />
    ) : severity === 'minor' ? (
      <span className="size-2 rounded-full shadow-[inset_0_0_0_1.5px_var(--color-ink)]" />
    ) : (
      <span className="size-2 rounded-full shadow-[inset_0_0_0_1.5px_var(--color-faint)]" />
    )
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className="inline-flex">{dot}</span>
      {withLabel ? <span className={severity === 'critical' ? 'text-stamp' : ''}>{severity[0].toUpperCase() + severity.slice(1)}</span> : <span className="sr-only">{severity}</span>}
    </span>
  )
}
