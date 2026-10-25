import type { AppBundle } from '../data/bundle'
import type { DocStatus, Review } from './types'
import { deriveDocumentStatus, reviewStateOf, riskScore, type DerivedStatus, type Risk } from './status'

export interface Derived {
  risk: Risk
  statuses: Record<string, DerivedStatus>
  counts: Partial<Record<DocStatus, number>>
  openFindings: number
  hasCrossMatch: boolean
}

export function deriveBundle(b: AppBundle, reviews: Record<string, Review>): Derived {
  const statuses: Record<string, DerivedStatus> = {}
  const counts: Partial<Record<DocStatus, number>> = {}
  for (const d of b.documents) {
    const s = deriveDocumentStatus(d.id, b.findings, b.checks, reviews)
    statuses[d.id] = s
    counts[s.status] = (counts[s.status] ?? 0) + 1
  }
  return {
    risk: riskScore(b.findings, reviews),
    statuses,
    counts,
    openFindings: b.findings.filter((f) => f.severity !== 'info' && reviewStateOf(f, reviews) === 'open').length,
    hasCrossMatch: b.findings.some((f) => f.checkId.startsWith('XAPP') && reviewStateOf(f, reviews) !== 'dismissed'),
  }
}
