import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { BASE_AUDIT, BUNDLES, RULES, type AppBundle } from '../data'
import { ACCOUNTS, type Account } from '../data/accounts'
import { sealChain, verifyChain, type ChainVerdict } from '../lib/audit'
import { clearFiles, putFile } from '../lib/files'
import type { AuditEvent, AuditEventBody, AuditType, Review, ReviewAction, ReviewState, Role, Rule, RuleVersion, Severity } from '../lib/types'

const KEY = 'pramaan-demo-v1'
const SESSION_KEY = 'pramaan-session'
const THEME_KEY = 'pramaan-theme'

interface Persisted {
  reviews: Record<string, Review>
  appActions: Record<string, { action: 'rectify' | 'inspect'; message: string; at: string }[]>
  ruleVersions: Record<string, RuleVersion[]>
  userEvents: AuditEventBody[]
  submissions: AppBundle[]
  tamper: boolean
}

const EMPTY: Persisted = { reviews: {}, appActions: {}, ruleVersions: {}, userEvents: [], submissions: [], tamper: false }

const read = <T,>(key: string, fallback: T, parse: (raw: string) => T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : parse(raw)
  } catch {
    return fallback
  }
}
const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* storage unavailable: the demo still works for this visit */
  }
}

const load = (): Persisted => read(KEY, EMPTY, (raw) => ({ ...EMPTY, ...(JSON.parse(raw) as Partial<Persisted>) }))

/** The event the tamper demo edits: the flagship's critical finding. */
const TAMPER_SUBJECT = 'A-2027-000123-F5'

export type Theme = 'light' | 'dark'

export interface Toast {
  id: number
  text: string
}

interface Store {
  user: Account | null
  signIn: (username: string, password: string) => Account | null
  signOut: () => void
  theme: Theme
  setTheme: (t: Theme) => void
  bundles: AppBundle[]
  getBundle: (id: string) => AppBundle | undefined
  submissions: AppBundle[]
  submitApplication: (build: (id: string, at: string) => { bundle: AppBundle; files: Record<string, File> }) => Promise<string>
  reviews: Record<string, Review>
  appActions: Persisted['appActions']
  rules: Rule[]
  role: Role
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

type NewEvent = { type: AuditType; subjectId: string; appId?: string; summary: string; actor?: string; role?: string }

const toIst = (ms: number) => new Date(ms + 5.5 * 3600_000).toISOString().slice(0, 19) + '+05:30'

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [p, setP] = useState<Persisted>(load)
  const [user, setUser] = useState<Account | null>(() =>
    read(SESSION_KEY, null, (raw) => ACCOUNTS.find((a) => a.username === raw) ?? null),
  )
  const [theme, setThemeState] = useState<Theme>(() => read(THEME_KEY, 'light' as Theme, (raw) => (raw === 'dark' ? 'dark' : 'light')))
  const [sealed, setSealed] = useState<AuditEvent[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)

  useEffect(() => write(KEY, JSON.stringify(p)), [p])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.dataset.theme = 'dark'
    else delete root.dataset.theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0a0f19' : '#16213A')
    write(THEME_KEY, theme === 'dark' ? 'dark' : null)
  }, [theme])

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

  const actor = user?.name ?? 'Unknown user'
  const role: Role = user?.power === 'Rule administrator' ? 'Rule administrator' : 'Scrutiny officer'
  const actorRole = user?.power ?? 'Scrutiny officer'

  /** Appends events on the demo clock: never earlier than a minute after the last recorded event. */
  const append = useCallback(
    (prev: Persisted, events: NewEvent[]) => {
      const all = [...BASE_AUDIT, ...prev.userEvents]
      const last = all[all.length - 1]
      const start = Math.max(Date.now(), Date.parse(last.at) + 60_000)
      const bodies: AuditEventBody[] = events.map(({ actor: a, role: r, ...e }, i) => ({
        seq: last.seq + 1 + i,
        at: toIst(start + i * 1000),
        actor: a ?? actor,
        role: r ?? actorRole,
        ...e,
      }))
      return { bodies, at: toIst(start) }
    },
    [actor, actorRole],
  )

  const reviewFinding = useCallback(
    (findingId: string, appId: string, action: ReviewAction, text?: string) => {
      setP((prev) => {
        const { bodies, at } = append(prev, [
          { type: 'Review action', subjectId: findingId, appId, summary: `${VERB[action]}${text ? `: “${text.length > 90 ? `${text.slice(0, 90)}…` : text}”` : ''}` },
        ])
        const review: Review = { state: STATE_FOR[action], reason: action === 'dismiss' ? text : undefined, message: action === 'rectify' ? text : undefined, at, actor }
        return { ...prev, reviews: { ...prev.reviews, [findingId]: review }, userEvents: [...prev.userEvents, ...bodies] }
      })
      toast(VERB[action])
    },
    [append, toast, actor],
  )

  const actOnApplication = useCallback(
    (appId: string, action: 'rectify' | 'inspect', message: string) => {
      setP((prev) => {
        const { bodies, at } = append(prev, [
          {
            type: 'Review action',
            subjectId: appId,
            appId,
            summary: action === 'rectify' ? `Rectification requested for the application: “${message.slice(0, 90)}”` : `Inspection recommended for the application: “${message.slice(0, 90)}”`,
          },
        ])
        const list = [...(prev.appActions[appId] ?? []), { action, message, at }]
        return { ...prev, appActions: { ...prev.appActions, [appId]: list }, userEvents: [...prev.userEvents, ...bodies] }
      })
      toast(action === 'rectify' ? 'Rectification requested' : 'Inspection recommended')
    },
    [append, toast],
  )

  const bundles = useMemo(() => [...BUNDLES, ...p.submissions], [p.submissions])
  const byId = useMemo(() => new Map(bundles.map((b) => [b.app.id, b])), [bundles])

  const submitApplication = useCallback(
    async (build: (id: string, at: string) => { bundle: AppBundle; files: Record<string, File> }) => {
      const n = p.submissions.length
      const id = `A-2027-${String(1101 + n * 7).padStart(6, '0')}`
      const all = [...BASE_AUDIT, ...p.userEvents]
      const at = toIst(Math.max(Date.now(), Date.parse(all[all.length - 1].at) + 60_000))
      const { bundle, files } = build(id, at)
      await Promise.all(Object.entries(files).map(([docId, f]) => putFile(docId, f)))
      setP((prev) => {
        const portal = { actor: `${bundle.app.institution} portal user`, role: 'Applicant' }
        const { bodies } = append(prev, [
          {
            ...portal,
            type: 'Application received',
            subjectId: id,
            appId: id,
            summary: `${bundle.app.category}, ${bundle.app.academicYear}, ${bundle.documents.length} documents, declared intake ${bundle.app.intake}`,
          },
          ...bundle.documents.map((d) => ({
            actor: 'Pramaan ingestion',
            role: 'System',
            type: 'Document ingested' as const,
            subjectId: d.id,
            appId: id,
            summary: `${d.typeLabel}, ${d.upload ? d.upload.name : 'sample document'}, sha256 ${d.sha256.slice(0, 12)}`,
          })),
        ])
        return { ...prev, submissions: [...prev.submissions, bundle], userEvents: [...prev.userEvents, ...bodies] }
      })
      toast('Application submitted')
      return id
    },
    [p.submissions.length, p.userEvents, append, toast],
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
            ? { ...v, status: 'Live', approvedBy: `${actor}, Rule administrator`, approvedAt: date, change: v.change.replace(/^Draft: /, '') }
            : v.status === 'Live'
              ? { ...v, status: 'Retired' }
              : v,
        )
        const { bodies } = append(prev, [{ type: 'Rule published', subjectId: ruleId, summary: `${ruleId} v${version} approved and published` }])
        return { ...prev, ruleVersions: { ...prev.ruleVersions, [ruleId]: versions }, userEvents: [...prev.userEvents, ...bodies] }
      })
      toast('Rule published')
    },
    [append, toast, actor],
  )

  const value: Store = {
    user,
    signIn: (username, password) => {
      const acc = ACCOUNTS.find((a) => a.username === username.trim().toLowerCase() && a.password === password)
      if (acc) {
        setUser(acc)
        write(SESSION_KEY, acc.username)
      }
      return acc ?? null
    },
    signOut: () => {
      setUser(null)
      write(SESSION_KEY, null)
    },
    theme,
    setTheme: setThemeState,
    bundles,
    getBundle: (id) => byId.get(id),
    submissions: p.submissions,
    submitApplication,
    reviews: p.reviews,
    appActions: p.appActions,
    rules,
    role,
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
      void clearFiles()
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
