import type { AppDocument, Application, CheckResult, Finding } from '../lib/types'

export interface AppBundle {
  app: Application
  documents: AppDocument[]
  checks: CheckResult[]
  findings: Finding[]
}

import type { CheckKind, CheckOutcome } from '../lib/types'
import type { Rng } from './seed'

/** Realistic run times: rules are instant, issuer services are slow, timeouts hit the 30 s limit. */
export function durationFor(kind: CheckKind, outcome: CheckOutcome, rng: Rng): number {
  if (outcome === 'na') return Math.round(5 + rng() * 20)
  if (kind === 'Source verification') return outcome === 'error' ? 30000 : Math.round(2200 + rng() * 9000)
  const ranges: Record<Exclude<CheckKind, 'Source verification'>, [number, number]> = {
    Rule: [40, 220],
    Reconciliation: [300, 950],
    Authenticity: [600, 2600],
    'Cross-application': [3200, 9400],
    Infrastructure: [500, 1600],
  }
  const [lo, hi] = ranges[kind]
  return Math.round(lo + rng() * (hi - lo))
}
