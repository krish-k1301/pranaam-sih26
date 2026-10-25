import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { BASE_AUDIT, RULES } from '../data'
import { sealChain, verifyChain, type ChainVerdict } from '../lib/audit'
import type { AuditEvent, AuditEventBody, AuditType, Review, ReviewAction, ReviewState, Role, Rule, RuleVersion, Severity } from '../lib/types'

const KEY = 'pramaan-demo-v1'
export const OFFICER = 'K. Sharma'

interface Persisted {
  reviews: Record<string, Review>
  appActions: Record<string, { action: 'rectify' | 'inspect'; message: string; at: string }[]>
  ruleVersions: Record<string, RuleVersion[]>
  userEvents: AuditEventBody[]
  role: Role
  tamper: boolean
}

const EMPTY: Persisted = { reviews: {}, appActions: {}, ruleVersions: {}, userEvents: [], role: 'Scrutiny officer', tamper: false }

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<Persisted>) }
  } catch {
    return EMPTY
  }
}

function save(p: Persisted) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* storage unavailable: the demo still works for this visit */
  }
}

/** The event the tamper demo edits: the flagship's critical finding. */
const TAMPER_SUBJECT = 'A-2027-000123-F5'

export interface Toast {
  id: number
  text: string
}

interface Store {
  reviews: Record<string, Review>
  appActions: Persisted['appActions']
  rules: Rule[]
  role: Role
  setRole: (r: Role) => void
  chain: AuditEvent[]
  chainReady: boolean
  tamper: boolean
  tamperSeq: number | null
  setTamper: (on: boolean) => void
  verify: () => Promise<ChainVerdict>
  reviewFinding: (findingId: string, appId: string, action: ReviewAction, text?: string) => void
  actOnApplication: (appId: string, action: 'rectify' | 'inspect', message: string) => void
  draftRule: (ruleId: string, severity: Severity, message: string) => void
  publishRule: (ruleId: string, version: number) => void
  reset: () => void
  toasts: Toast[]
  toast: (text: string) => void
}

const Ctx = createContext<Store | null>(null)

const STATE_FOR: Record<ReviewAction, ReviewState> = {
  confirm: 'confirmed',
  dismiss: 'dismissed',
  rectify: 'rectification_requested',
  inspect: 'inspection_recommended',
}

const VERB: Record<ReviewAction, string> = {
  confirm: 'Finding confirmed',
  dismiss: 'Finding dismissed',
  rectify: 'Rectification requested',
  inspect: 'Inspection recommended',
}

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [p, setP] = useState<Persisted>(load)
  const [sealed, setSealed] = useState<AuditEvent[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)

  useEffect(() => save(p), [p])

  useEffect(() => {
    let live = true
    sealChain([...BASE_AUDIT, ...p.userEvents]).then((c) => live && setSealed(c))
    return () => {
      live = false
    }
  }, [p.userEvents])

  const tamperSeq = useMemo(() => sealed.find((e) => e.subjectId === TAMPER_SUBJECT && e.type === 'Finding created')?.seq ?? null, [sealed])

  const chain = useMemo(() => {
    if (!p.tamper || tamperSeq === null) return sealed
    return sealed.map((e) => (e.seq === tamperSeq ? { ...e, summary: e.summary.replace('critical', 'minor') } : e))
  }, [sealed, p.tamper, tamperSeq])

  const toast = useCallback((text: string) => {
    const id = ++toastId.current
    setToasts((t) => [...t, { id, text }])
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600)
  }, [])

  const append = useCallback((prev: Persisted, e: { type: AuditType; subjectId: string; appId?: string; summary: string }) => {
    const all = [...BASE_AUDIT, ...prev.userEvents]
    const last = all[all.length - 1]
    const at = new Date(Math.max(Date.now(), Date.parse(last.at) + 60_000))
    const ist = new Date(at.getTime() + 5.5 * 3600_000).toISOString().slice(0, 19) + '+05:30'
    const body: AuditEventBody = { seq: last.seq + 1, at: ist, actor: OFFICER, role: prev.role, ...e }
    return { body, at: ist }
  }, [])

  const reviewFinding = useCallback(
    (findingId: string, appId: string, action: ReviewAction, text?: string) => {
      setP((prev) => {
        const { body, at } = append(prev, {
          type: 'Review action',
          subjectId: findingId,
          appId,
          summary: `${VERB[action]}${text ? `: “${text.length > 90 ? `${text.slice(0, 90)}…` : text}”` : ''}`,
        })
        const review: Review = {
          state: STATE_FOR[action],
          reason: action === 'dismiss' ? text : undefined,
          message: action === 'rectify' ? text : undefined,
          at,
          actor: OFFICER,
        }
        return { ...prev, reviews: { ...prev.reviews, [findingId]: review }, userEvents: [...prev.userEvents, body] }
      })
      toast(VERB[action])
    },
    [append, toast],
  )

  const actOnApplication = useCallback(
    (appId: string, action: 'rectify' | 'inspect', message: string) => {
      setP((prev) => {
        const { body, at } = append(prev, {
          type: 'Review action',
          subjectId: appId,
          appId,
          summary: action === 'rectify' ? `Rectification requested for the application: “${message.slice(0, 90)}”` : `Inspection recommended for the application: “${message.slice(0, 90)}”`,
        })
        const list = [...(prev.appActions[appId] ?? []), { action, message, at }]
        return { ...prev, appActions: { ...prev.appActions, [appId]: list }, userEvents: [...prev.userEvents, body] }
      })
      toast(action === 'rectify' ? 'Rectification requested' : 'Inspection recommended')
    },
    [append, toast],
  )

  const rules = useMemo<Rule[]>(() => RULES.map((r) => ({ ...r, versions: p.ruleVersions[r.id] ?? r.versions })), [p.ruleVersions])

  const draftRule = useCallback(
    (ruleId: string, severity: Severity, message: string) => {
      setP((prev) => {
        const base = prev.ruleVersions[ruleId] ?? RULES.find((r) => r.id === ruleId)!.versions
        const live = base.find((v) => v.status === 'Live') ?? base[base.length - 1]
        const withoutDraft = base.filter((v) => v.status !== 'Draft')
        const next = Math.max(...base.map((v) => v.version)) + (base.some((v) => v.status === 'Draft') ? 0 : 1)
        const changes = [severity !== live.severity ? `severity ${live.severity} → ${severity}` : '', message !== live.message ? 'message reworded' : '']
          .filter(Boolean)
          .join('; ')
        const draft: RuleVersion = { version: next, severity, message, logic: live.logic, change: changes ? `Draft: ${changes}.` : 'Draft with no changes yet.', status: 'Draft' }
        return { ...prev, ruleVersions: { ...prev.ruleVersions, [ruleId]: [...withoutDraft, draft] } }
      })
      toast('Draft saved')
    },
    [toast],
  )

  const publishRule = useCallback(
    (ruleId: string, version: number) => {
      setP((prev) => {
        const base = prev.ruleVersions[ruleId] ?? RULES.find((r) => r.id === ruleId)!.versions
        const date = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10)
        const versions = base.map((v): RuleVersion =>
          v.version === version
            ? { ...v, status: 'Live', approvedBy: `${OFFICER}, Rule administrator`, approvedAt: date, change: v.change.replace(/^Draft: /, '') }
            : v.status === 'Live'
              ? { ...v, status: 'Retired' }
              : v,
        )
        const { body } = append(prev, { type: 'Rule published', subjectId: ruleId, summary: `${ruleId} v${version} approved and published` })
        return { ...prev, ruleVersions: { ...prev.ruleVersions, [ruleId]: versions }, userEvents: [...prev.userEvents, body] }
      })
      toast('Rule published')
    },
    [append, toast],
  )

  const value: Store = {
    reviews: p.reviews,
    appActions: p.appActions,
    rules,
    role: p.role,
    setRole: (role) => setP((prev) => ({ ...prev, role })),
    chain,
    chainReady: sealed.length > 0,
    tamper: p.tamper,
    tamperSeq,
    setTamper: (tamper) => setP((prev) => ({ ...prev, tamper })),
    verify: () => verifyChain(chain),
    reviewFinding,
    actOnApplication,
    draftRule,
    publishRule,
    reset: () => {
      setP(EMPTY)
      toast('Demo data reset')
    },
    toasts,
    toast,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore must be used inside DemoStoreProvider')
  return s
}
