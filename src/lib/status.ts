import type { CheckResult, DocStatus, Finding, Review, ReviewState, Severity } from './types'

export const STATUS_LABEL: Record<DocStatus, string> = {
  verified: 'Verified',
  mismatch: 'Mismatch detected',
  expired: 'Expired',
  pending: 'Verification pending',
  source_unavailable: 'Source unavailable',
  manual_review: 'Manual review required',
}

/** Most serious first. A document takes the first status any of its inputs argues for. */
export const STATUS_PRECEDENCE: DocStatus[] = [
  'mismatch',
  'expired',
  'manual_review',
  'source_unavailable',
  'pending',
  'verified',
]

export const SEVERITY_WEIGHT: Record<Severity, number> = { info: 0, minor: 1, major: 3, critical: 8 }

export const SEVERITY_ORDER: Severity[] = ['critical', 'major', 'minor', 'info']

export const REVIEW_LABEL: Record<ReviewState, string> = {
  open: 'Awaiting review',
  confirmed: 'Confirmed',
  dismissed: 'Dismissed',
  rectification_requested: 'Rectification requested',
  inspection_recommended: 'Inspection recommended',
}

export function reviewStateOf(f: Finding, reviews: Record<string, Review>): ReviewState {
  return reviews[f.id]?.state ?? 'open'
}

export function isActive(f: Finding, reviews: Record<string, Review>): boolean {
  return reviewStateOf(f, reviews) !== 'dismissed'
}

export interface DerivedStatus {
  status: DocStatus
  because: string
  findingId?: string
  checkId?: string
}

/**
 * Derive one document's status from its active findings and the checks that ran on it.
 * - An active finding argues for its statusEffect; dismissed findings do not count.
 * - A check that raised a finding speaks only through that finding.
 * - Otherwise: pass → verified, error → source unavailable, fail → manual review.
 * - No checks at all → verification pending.
 */
export function deriveDocumentStatus(
  documentId: string,
  findings: Finding[],
  checks: CheckResult[],
  reviews: Record<string, Review>,
): DerivedStatus {
  const candidates: DerivedStatus[] = []
  for (const f of findings) {
    if (f.documentId !== documentId || !f.statusEffect || !isActive(f, reviews)) continue
    candidates.push({ status: f.statusEffect, because: f.title, findingId: f.id })
  }
  const docChecks = checks.filter((c) => c.documentId === documentId)
  for (const c of docChecks) {
    if (c.findingId) continue
    if (c.outcome === 'pass') candidates.push({ status: 'verified', because: `${c.checkId} passed`, checkId: c.checkId })
    else if (c.outcome === 'error')
      candidates.push({ status: 'source_unavailable', because: `${c.checkId} could not reach the source`, checkId: c.checkId })
    else if (c.outcome === 'fail')
      candidates.push({ status: 'manual_review', because: `${c.checkId} failed`, checkId: c.checkId })
  }
  if (candidates.length === 0) {
    const ran = docChecks.length > 0
    return { status: 'pending', because: ran ? 'Only dismissed findings or non-applicable checks' : 'No checks have run yet' }
  }
  candidates.sort((a, b) => STATUS_PRECEDENCE.indexOf(a.status) - STATUS_PRECEDENCE.indexOf(b.status))
  const top = candidates[0]
  const sameCount = candidates.filter((c) => c.status === top.status).length
  if (top.status === 'verified') {
    return { ...top, because: sameCount > 1 ? `All ${sameCount} checks passed` : top.because }
  }
  return top
}

export type RiskBand = 'low' | 'medium' | 'high'

export interface RiskBreakdownItem {
  findingId: string
  severity: Severity
  weight: number
  title: string
}

export interface Risk {
  score: number
  band: RiskBand
  items: RiskBreakdownItem[]
}

export function bandOf(score: number): RiskBand {
  if (score >= 8) return 'high'
  if (score >= 3) return 'medium'
  return 'low'
}

/** Risk score = sum of severity weights of active findings. */
export function riskScore(findings: Finding[], reviews: Record<string, Review>): Risk {
  const items = findings
    .filter((f) => isActive(f, reviews))
    .map((f) => ({ findingId: f.id, severity: f.severity, weight: SEVERITY_WEIGHT[f.severity], title: f.title }))
    .sort((a, b) => b.weight - a.weight)
  const score = items.reduce((s, i) => s + i.weight, 0)
  return { score, band: bandOf(score), items }
}
