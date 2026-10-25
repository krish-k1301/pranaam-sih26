import type { AuditEvent, AuditEventBody } from './types'

export const GENESIS = '0'.repeat(64)

/** Canonical JSON: object keys sorted, no whitespace, undefined dropped. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(',')}}`
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}

export function bodyOf(e: AuditEventBody): AuditEventBody {
  return {
    seq: e.seq,
    at: e.at,
    actor: e.actor,
    role: e.role,
    type: e.type,
    subjectId: e.subjectId,
    appId: e.appId,
    summary: e.summary,
  }
}

/** hash = SHA-256(canonical JSON of the event body + prevHash) */
export async function hashEvent(body: AuditEventBody, prevHash: string): Promise<string> {
  return sha256Hex(canonicalJson(bodyOf(body)) + prevHash)
}

export async function sealChain(bodies: AuditEventBody[], prevHash = GENESIS): Promise<AuditEvent[]> {
  const out: AuditEvent[] = []
  let prev = prevHash
  for (const b of bodies) {
    const hash = await hashEvent(b, prev)
    out.push({ ...bodyOf(b), prevHash: prev, hash })
    prev = hash
  }
  return out
}

export type ChainVerdict =
  | { ok: true; count: number; head: string }
  | { ok: false; count: number; brokenSeq: number; reason: string }

export async function verifyChain(events: AuditEvent[]): Promise<ChainVerdict> {
  let prev = GENESIS
  for (const e of events) {
    if (e.prevHash !== prev) {
      return { ok: false, count: events.length, brokenSeq: e.seq, reason: 'Previous hash does not match the event before it' }
    }
    const recomputed = await hashEvent(e, prev)
    if (recomputed !== e.hash) {
      return { ok: false, count: events.length, brokenSeq: e.seq, reason: 'Stored hash does not match the event contents' }
    }
    prev = e.hash
  }
  return { ok: true, count: events.length, head: prev }
}
