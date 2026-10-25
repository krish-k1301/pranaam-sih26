import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LoaderCircle, ShieldAlert, ShieldCheck } from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { AuditRow } from '../components/AuditRow'
import { useStore } from '../state/DemoStore'
import type { ChainVerdict } from '../lib/audit'
import type { AuditType } from '../lib/types'

const TYPES: AuditType[] = [
  'Application received',
  'Document ingested',
  'Rule applied',
  'Record checked',
  'Source response',
  'Finding created',
  'Alert raised',
  'Review action',
  'Rule published',
]

export default function AuditLog() {
  const { chain, chainReady, verify, tamper, setTamper, tamperSeq } = useStore()
  const [verdict, setVerdict] = useState<ChainVerdict | null>(null)
  const [busy, setBusy] = useState(false)
  const [params, setParams] = useSearchParams()
  const type = (TYPES.includes(params.get('type') as AuditType) ? params.get('type') : '') as AuditType | ''
  const setType = (t: AuditType | '') => {
    const next = new URLSearchParams(params)
    if (t) next.set('type', t)
    else next.delete('type')
    setParams(next, { replace: true })
  }
  const [limit, setLimit] = useState(60)

  useEffect(() => setVerdict(null), [tamper, chain.length])

  const list = useMemo(() => [...chain].reverse().filter((e) => !type || e.type === type), [chain, type])
  const brokenSeq = verdict && !verdict.ok ? verdict.brokenSeq : null

  const run = async () => {
    setBusy(true)
    // Hold the busy state for at least 400 ms so the result never flickers in.
    const [v] = await Promise.all([verify(), new Promise((r) => setTimeout(r, 400))])
    setVerdict(v)
    setBusy(false)
    if (!v.ok) {
      setType('')
      const idx = [...chain].reverse().findIndex((e) => e.seq === v.brokenSeq)
      if (idx >= limit) setLimit(idx + 20)
      requestAnimationFrame(() => document.getElementById(`ev-${v.brokenSeq}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
    }
  }

  return (
    <>
      <TopBar title="Audit log" />
      <main id="main" className="px-4 pb-10 pt-5 md:px-6">
        <p className="mb-4 max-w-[820px] text-[15px] leading-[22px]">
          Every automated step and every officer action is chained: each event’s SHA-256 hash covers its contents and the hash before it, so an edited record breaks the chain at that event.
        </p>

        <section aria-label="Chain verification" className="mb-4 rounded-lg bg-surface border border-line">
          <div className="flex flex-wrap items-center gap-3 p-4">
            <button onClick={run} disabled={!chainReady || busy} aria-busy={busy} className="flex h-9 items-center gap-2 rounded-md bg-action px-4 font-medium text-white hover:bg-action-dark disabled:bg-action/45 active:translate-y-px">
              {busy && <LoaderCircle size={15} className="animate-spin motion-reduce:animate-none" aria-hidden />}
              Verify chain
            </button>
            <div className="min-w-0 flex-1" aria-live="polite">
              {!verdict && <span className="num text-muted">{chainReady ? `${chain.length} events sealed. Recompute every hash to check nothing was changed.` : 'Sealing events…'}</span>}
              {verdict?.ok && (
                <span className="flex items-center gap-2 font-medium text-st-verified">
                  <ShieldCheck size={18} aria-hidden />
                  <span className="num">
                    Chain intact · {verdict.count} events · head <span translate="no" className="font-mono text-[13px]">{verdict.head.slice(0, 4)}…</span>
                  </span>
                </span>
              )}
              {verdict && !verdict.ok && (
                <span className="flex flex-wrap items-center gap-x-2 font-medium text-stamp">
                  <ShieldAlert size={18} aria-hidden />
                  <span className="num">Chain broken at event {verdict.brokenSeq}</span>
                  <span className="font-normal">· {verdict.reason}</span>
                </span>
              )}
            </div>
            <button role="switch" aria-checked={tamper} onClick={() => setTamper(!tamper)} className="flex flex-none items-center gap-2.5 rounded-md py-1 text-left text-[14px]">
              <span aria-hidden className={`flex h-5 w-9 flex-none items-center rounded-full p-0.5 transition-colors ${tamper ? 'bg-stamp' : 'bg-control'}`}>
                <span className={`size-4 rounded-full bg-white transition-transform ${tamper ? 'translate-x-4' : 'translate-x-0'}`} />
              </span>
              <span>Simulate tampering (demo)</span>
            </button>
          </div>
          {tamper && (
            <p className="border-t border-rule bg-raised px-4 py-2 text-[13px] leading-5 text-muted rounded-b-lg">
              Event <span className="num font-medium text-ink">{tamperSeq}</span> has been edited in storage: a critical finding was rewritten as minor. Its stored hash was left alone. Run the verification, then switch this off to restore it.
            </p>
          )}
        </section>

        <section aria-labelledby="events-h" className="rounded-lg bg-surface border border-line">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-rule px-4 py-3">
            <h2 id="events-h" className="text-[15px] font-semibold">
              Events, newest first
            </h2>
            <label className="flex items-center gap-2 text-[13px] text-muted">
              Event type
              <select value={type} onChange={(e) => setType(e.target.value as AuditType | '')} className="h-8 rounded-md border border-control bg-surface px-2 text-[14px] text-ink outline-none focus:border-action focus:ring-2 focus:ring-action/25">
                <option value="">All types</option>
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
          {list.length === 0 ? (
            <p className="m-4 rounded-md border border-dashed border-control px-4 py-3 text-muted">{chainReady ? 'No events of this type yet. Review a finding or publish a rule to add one.' : 'Sealing events…'}</p>
          ) : (
            <ul>
              {list.slice(0, limit).map((e) => (
                <AuditRow key={e.seq} id={`ev-${e.seq}`} e={e} broken={brokenSeq === e.seq} />
              ))}
            </ul>
          )}
          {list.length > limit && (
            <button onClick={() => setLimit((l) => l + 100)} className="num w-full border-t border-rule px-4 py-2.5 text-left text-[13px] font-medium text-action hover:bg-raised">
              Show older events · {list.length - limit} more
            </button>
          )}
        </section>
      </main>
    </>
  )
}
