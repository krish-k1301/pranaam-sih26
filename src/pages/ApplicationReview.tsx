import { useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Check, ChevronDown, ChevronRight, Info, X } from 'lucide-react'
import type { AppBundle } from '../data/bundle'
import { TopBar } from '../components/TopBar'
import { BandBadge, SeverityMark } from '../components/RiskBadge'
import { StatusChip } from '../components/StatusChip'
import { Viewer } from '../components/Viewer'
import { EvidenceCard } from '../components/EvidenceCard'
import { ReviewDialog } from '../components/ReviewDialog'
import { AuditRow } from '../components/AuditRow'
import { useStore } from '../state/DemoStore'
import { useDialog } from '../lib/hooks'
import { deriveBundle, type Derived } from '../lib/derive'
import { REVIEW_LABEL, SEVERITY_ORDER, reviewStateOf } from '../lib/status'
import { fmtDate, fmtDateTime, fmtDuration, fmtIsoDate, pct, shortHash } from '../lib/format'
import type { CheckOutcome, Finding, ReviewAction, ReviewState } from '../lib/types'
import NotFound from './NotFound'

type Tab = 'findings' | 'documents' | 'checks' | 'audit'

export default function ApplicationReview() {
  const { id = '' } = useParams()
  const { getBundle } = useStore()
  const bundle = getBundle(id)
  if (!bundle) return <NotFound />
  return <Review key={id} b={bundle} />
}

function ReviewChip({ state }: { state: ReviewState }) {
  const cls =
    state === 'open'
      ? 'bg-surface text-muted shadow-[inset_0_0_0_1px_var(--color-control)]'
      : state === 'dismissed'
        ? 'bg-active text-muted line-through decoration-1'
        : 'bg-tint-action text-link'
  return (
    <span key={state} className={`chip-change inline-flex flex-none whitespace-nowrap rounded-[4px] px-1.5 text-[12px] font-medium leading-[18px] ${cls}`}>
      {REVIEW_LABEL[state]}
    </span>
  )
}

function Review({ b }: { b: AppBundle }) {
  const store = useStore()
  const { reviews } = store
  const d = useMemo(() => deriveBundle(b, reviews), [b, reviews])
  // Tab, selected finding, open document & breakdown live in the URL so any view can be shared or bookmarked.
  const [params, setParams] = useSearchParams()
  const setParam = (k: string, v: string | null, push = false) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v)
    else next.delete(k)
    setParams(next, { replace: !push })
  }
  const TABS: Tab[] = ['findings', 'documents', 'checks', 'audit']
  const tab: Tab = TABS.includes(params.get('tab') as Tab) ? (params.get('tab') as Tab) : 'findings'
  const setTab = (t: Tab) => setParam('tab', t === 'findings' ? null : t, true)
  const sorted = useMemo(() => [...b.findings].sort((x, y) => SEVERITY_ORDER.indexOf(x.severity) - SEVERITY_ORDER.indexOf(y.severity)), [b])
  const selId = b.findings.some((f) => f.id === params.get('finding')) ? params.get('finding')! : sorted[0]?.id
  const setSelId = (id: string) => setParam('finding', id === sorted[0]?.id ? null : id)
  const [focus, setFocus] = useState<{ docId: string; page: number; keys: string[] } | null>(null)
  const openDoc = b.documents.some((x) => x.id === params.get('doc')) ? params.get('doc') : null
  const setOpenDoc = (id: string | null) => setParam('doc', id, Boolean(id))
  const [dialog, setDialog] = useState<null | { kind: 'dismiss' | 'rectify'; finding: Finding } | { kind: 'app-rectify' | 'app-inspect' }>(null)
  const showBreakdown = params.get('breakdown') === '1'
  const setShowBreakdown = (v: boolean) => setParam('breakdown', v ? '1' : null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    const n = TABS.length
    const j = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1
    if (j < 0) return
    e.preventDefault()
    setTab(TABS[j])
    tabRefs.current[TABS[j]]?.focus()
  }
  const viewerRef = useRef<HTMLDivElement>(null)

  const sel = b.findings.find((f) => f.id === selId)
  const selDoc = b.documents.find((x) => x.id === (focus?.docId ?? sel?.documentId))
  const auditEvents = useMemo(() => store.chain.filter((e) => e.appId === b.app.id).reverse(), [store.chain, b.app.id])
  const appActions = store.appActions[b.app.id] ?? []
  const raised = new Set(b.checks.filter((c) => c.findingId).map((c) => c.findingId)).size

  const select = (fid: string) => {
    setSelId(fid)
    setFocus(null)
    if (window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() => viewerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
  }

  const act = (f: Finding, action: ReviewAction) => {
    if (action === 'dismiss' || action === 'rectify') setDialog({ kind: action, finding: f })
    else store.reviewFinding(f.id, b.app.id, action)
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'findings', label: 'Findings', count: b.findings.length },
    { id: 'documents', label: 'Documents', count: b.documents.length },
    { id: 'checks', label: 'Checks run', count: b.checks.length },
    { id: 'audit', label: 'Audit trail', count: auditEvents.length },
  ]

  return (
    <>
      <TopBar title={b.app.institution} />
      <main id="main" className="px-4 pb-10 pt-4 md:px-6">
        <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1 text-[13px] text-muted">
          <Link to="/" className="hover:text-ink hover:underline">
            Queue
          </Link>
          <ChevronRight size={14} aria-hidden />
          <span translate="no" className="font-mono text-[12px] text-ink">{b.app.id}</span>
        </nav>

        <Header b={b} d={d} showBreakdown={showBreakdown} setShowBreakdown={setShowBreakdown} onRectify={() => setDialog({ kind: 'app-rectify' })} onInspect={() => setDialog({ kind: 'app-inspect' })} />

        {appActions.length > 0 && (
          <ul className="mb-3 flex flex-col gap-1 text-[13px]">
            {appActions.map((a) => (
              <li key={a.at} className="text-muted">
                <span className="font-medium text-ink">{a.action === 'rectify' ? 'Rectification requested' : 'Inspection recommended'}</span> for the application on {fmtDateTime(a.at)}.
              </li>
            ))}
          </ul>
        )}

        <div role="tablist" aria-label="Application sections" className="mb-4 flex gap-5 overflow-x-auto border-b border-line">
          {tabs.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[t.id] = el
              }}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              onKeyDown={(e) => onTabKey(e, i)}
              onClick={() => setTab(t.id)}
              className={`-mb-px flex flex-none items-center gap-1.5 border-b-2 px-1 pb-2.5 pt-1 text-[14px] ${tab === t.id ? 'border-ink font-medium text-ink' : 'border-transparent text-muted hover:text-ink'}`}
            >
              {t.label}
              <span className="num text-[12px] text-muted">{t.count}</span>
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'findings' &&
          (b.findings.length === 0 ? (
            <p className="rounded-lg bg-surface px-4 py-4 border border-line">
              {b.checks.length === 0
                ? `No findings yet. Automated checks are queued for all ${b.documents.length} documents; findings appear here as they finish.`
                : `No findings. All ${b.checks.filter((c) => c.outcome === 'pass').length} checks that apply passed.`}{' '}
              <button onClick={() => setTab('documents')} className="font-medium text-link hover:underline">
                Review the documents
              </button>
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[296px_minmax(0,1fr)_344px]">
              <FindingsList findings={sorted} d={d} b={b} selId={selId} onSelect={select} />
              <div ref={viewerRef} className="min-w-0 scroll-mt-28">
                {selDoc && <Viewer doc={selDoc} status={d.statuses[selDoc.id].status} finding={focus ? undefined : sel} focus={focus ? { page: focus.page, keys: focus.keys } : undefined} />}
                {focus && (
                  <button onClick={() => setFocus(null)} className="mt-2 text-[13px] font-medium text-link hover:underline">
                    Back to the finding’s view
                  </button>
                )}
              </div>
              {sel && (
                <div className="lg:col-start-2 xl:col-start-auto">
                  <EvidencePanel f={sel} b={b} state={reviewStateOf(sel, reviews)} review={reviews[sel.id]} onAct={(a) => act(sel, a)} onShow={(docId, page, key) => setFocus({ docId, page, keys: [key] })} />
                </div>
              )}
            </div>
          ))}

        {tab === 'documents' && <DocumentsTab b={b} d={d} onOpen={setOpenDoc} />}
        {tab === 'checks' && <ChecksTab b={b} raised={raised} />}
        {tab === 'audit' && (
          <section className="rounded-lg bg-surface border border-line">
            {auditEvents.length === 0 ? (
              <p className="px-4 py-3 text-muted">Sealing the audit chain…</p>
            ) : (
              <ul>
                {auditEvents.map((e) => (
                  <AuditRow key={e.seq} e={e} showApp={false} broken={store.tamper && e.seq === store.tamperSeq} />
                ))}
              </ul>
            )}
          </section>
        )}
        </div>
      </main>

      {openDoc && <DocDrawer b={b} d={d} docId={openDoc} onClose={() => setOpenDoc(null)} />}

      {dialog?.kind === 'dismiss' && (
        <ReviewDialog
          title="Dismiss finding"
          description={`“${dialog.finding.title}” will stop counting towards the risk score and the document status. The finding stays on record.`}
          label="Reason for dismissing"
          required
          submitLabel="Dismiss finding"
          onClose={() => setDialog(null)}
          onSubmit={(t) => {
            store.reviewFinding(dialog.finding.id, b.app.id, 'dismiss', t)
            setDialog(null)
          }}
        />
      )}
      {dialog?.kind === 'rectify' && (
        <ReviewDialog
          title="Request rectification"
          description={`The institution will be asked to respond on its ${b.documents.find((x) => x.id === dialog.finding.documentId)?.typeLabel.toLowerCase()}.`}
          label="Message to the institution"
          initial={`Please address the following observation and upload a corrected or current document: ${dialog.finding.reason}`}
          required
          submitLabel="Request rectification"
          onClose={() => setDialog(null)}
          onSubmit={(t) => {
            store.reviewFinding(dialog.finding.id, b.app.id, 'rectify', t)
            setDialog(null)
          }}
        />
      )}
      {(dialog?.kind === 'app-rectify' || dialog?.kind === 'app-inspect') && (
        <ReviewDialog
          title={dialog.kind === 'app-rectify' ? 'Request rectification for the application' : 'Recommend inspection'}
          description={dialog.kind === 'app-rectify' ? 'The institution receives one message covering the whole application.' : 'The regional office is asked to schedule an expert visit committee inspection.'}
          label={dialog.kind === 'app-rectify' ? 'Message to the institution' : 'What the inspection should look at'}
          initial={
            dialog.kind === 'app-rectify'
              ? `Please respond to the observations below and upload corrected documents:\n${b.findings
                  .filter((f) => reviewStateOf(f, reviews) !== 'dismissed' && f.severity !== 'info')
                  .map((f) => `• ${f.reason}`)
                  .join('\n')}`
              : `Verify on site: ${b.findings
                  .filter((f) => f.category === 'Anomaly' && reviewStateOf(f, reviews) !== 'dismissed')
                  .map((f) => f.title.toLowerCase())
                  .join('; ') || 'infrastructure as declared'}.`
          }
          required
          submitLabel={dialog.kind === 'app-rectify' ? 'Request rectification' : 'Recommend inspection'}
          onClose={() => setDialog(null)}
          onSubmit={(t) => {
            store.actOnApplication(b.app.id, dialog.kind === 'app-rectify' ? 'rectify' : 'inspect', t)
            setDialog(null)
          }}
        />
      )}
    </>
  )
}

function Header({
  b,
  d,
  showBreakdown,
  setShowBreakdown,
  onRectify,
  onInspect,
}: {
  b: AppBundle
  d: Derived
  showBreakdown: boolean
  setShowBreakdown: (v: boolean) => void
  onRectify: () => void
  onInspect: () => void
}) {
  const a = b.app
  return (
    <section aria-label="Application summary" className="mb-4 rounded-lg bg-surface border border-line">
      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start">
        <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-6 gap-y-2 text-[13px] sm:grid-cols-3 xl:grid-cols-6">
          {[
            ['Permanent ID', <span translate="no" className="font-mono">{a.permanentId}</span>],
            ['Application', <span translate="no" className="font-mono">{a.id}</span>],
            ['Category', a.category],
            ['Academic year', a.academicYear],
            ['State & region', `${a.city}, ${a.state} · ${a.region}`],
            ['Submitted', fmtDate(a.submittedAt)],
          ].map(([k, v], i) => (
            <div key={i} className="min-w-0">
              <dt className="text-[12px] leading-4 text-muted">{k}</dt>
              <dd className="mt-0.5 leading-5">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap gap-2 lg:flex-none">
          <button onClick={onInspect} className="h-9 rounded-md border border-control bg-surface px-3.5 font-medium hover:border-ink-2 hover:bg-raised active:translate-y-px">
            Recommend inspection…
          </button>
          <button onClick={onRectify} className="h-9 rounded-md bg-action px-3.5 font-medium text-white hover:bg-action-dark active:translate-y-px">
            Request rectification…
          </button>
        </div>
      </div>
      <div className="border-t border-rule px-4 py-3">
        <button onClick={() => setShowBreakdown(!showBreakdown)} aria-expanded={showBreakdown} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-left">
          <span className="text-[13px] text-muted">Risk score</span>
          <span className="num text-[24px] font-semibold leading-7">{d.risk.score}</span>
          <BandBadge band={d.risk.band} />
          <span className="num min-w-0 flex-1 truncate text-[13px] text-muted">
            {d.risk.items.length === 0 ? 'No active findings' : d.risk.items.filter((i) => i.weight > 0).map((i) => `+${i.weight}`).join(' ') + ` from ${d.risk.items.filter((i) => i.weight > 0).length} active findings`}
          </span>
          <span className="flex items-center gap-1 text-[13px] font-medium text-link">
            {showBreakdown ? 'Hide breakdown' : 'Show breakdown'}
            <ChevronDown size={15} className={`transition-transform ${showBreakdown ? 'rotate-180' : ''}`} aria-hidden />
          </span>
        </button>
        {showBreakdown && (
          <div className="mt-3">
            <ul className="flex flex-col gap-1 text-[13px]">
              {d.risk.items.map((i) => (
                <li key={i.findingId} className="grid grid-cols-[36px_76px_1fr] items-baseline gap-2">
                  <span className="num text-right font-semibold">+{i.weight}</span>
                  <SeverityMark severity={i.severity} withLabel />
                  <span>{i.title}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[12px] text-muted">Weights: critical 8, major 3, minor 1, info 0. Low below 3, medium 3–7, high 8 and above. Dismissed findings do not count.</p>
          </div>
        )}
      </div>
      <p className="flex items-start gap-2 border-t border-rule bg-raised px-4 py-2 text-[13px] leading-5 text-muted rounded-b-lg">
        <Info size={15} className="mt-0.5 flex-none" aria-hidden />
        Findings are indicators for review, not conclusions. You make every decision on this application.
      </p>
    </section>
  )
}

const SEV_HEADING = { critical: 'Critical', major: 'Major', minor: 'Minor', info: 'For information' } as const

function FindingsList({ findings, d, b, selId, onSelect }: { findings: Finding[]; d: Derived; b: AppBundle; selId?: string; onSelect: (id: string) => void }) {
  const { reviews } = useStore()
  void d
  return (
    <section aria-label="Findings" className="self-start rounded-lg bg-surface border border-line">
      {SEVERITY_ORDER.map((sev) => {
        const list = findings.filter((f) => f.severity === sev)
        if (!list.length) return null
        return (
          <div key={sev} className="border-b border-rule pb-1 last:border-0">
            <h3 className="flex items-center justify-between px-4 pb-1 pt-3 text-[12px] font-medium text-muted">
              <SeverityMark severity={sev} withLabel={false} />
              <span className="mr-auto pl-2">{SEV_HEADING[sev]}</span>
              <span className="num">{list.length}</span>
            </h3>
            <ul className="px-1.5">
              {list.map((f) => {
                const state = reviewStateOf(f, reviews)
                const doc = b.documents.find((x) => x.id === f.documentId)
                const selected = f.id === selId
                return (
                  <li key={f.id}>
                    <button
                      onClick={() => onSelect(f.id)}
                      aria-current={selected}
                      className={`w-full rounded-md px-2.5 py-2 text-left ${selected ? 'bg-active' : 'hover:bg-raised'} ${state === 'dismissed' ? 'opacity-60' : ''}`}
                    >
                      <span className="block font-medium leading-5">{f.title}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] leading-4 text-muted">
                        <span className="rounded-[3px] bg-raised px-1 text-ink-2 border border-line">{f.category}</span>
                        <span>{doc?.typeLabel}</span>
                        <span className="num">{pct(f.confidence)} confidence</span>
                      </span>
                      <span className="mt-1.5 block">
                        <ReviewChip state={state} />
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </section>
  )
}

const ACTIONS: { a: ReviewAction; label: string; state: ReviewState }[] = [
  { a: 'confirm', label: 'Confirm', state: 'confirmed' },
  { a: 'dismiss', label: 'Dismiss…', state: 'dismissed' },
  { a: 'rectify', label: 'Request rectification…', state: 'rectification_requested' },
  { a: 'inspect', label: 'Recommend inspection', state: 'inspection_recommended' },
]

function EvidencePanel({
  f,
  b,
  state,
  review,
  onAct,
  onShow,
}: {
  f: Finding
  b: AppBundle
  state: ReviewState
  review?: { reason?: string; message?: string; at: string; actor: string }
  onAct: (a: ReviewAction) => void
  onShow: (docId: string, page: number, key: string) => void
}) {
  const { role } = useStore()
  const officer = role === 'Scrutiny officer'
  const isRule = f.checkId.startsWith('R-')
  return (
    <section aria-label="Evidence and actions" className="flex flex-col gap-3">
      <div className="rounded-lg bg-surface p-4 border border-line">
        <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
          <SeverityMark severity={f.severity} withLabel />
          <span>{f.category}</span>
          <span className="num">{pct(f.confidence)} confidence</span>
        </div>
        <h3 className="text-[16px] font-semibold leading-[22px]">{f.title}</h3>
        <p className="mt-1.5 leading-5">{f.reason}</p>
        <dl className="mt-3 grid grid-cols-[88px_1fr] gap-y-1 text-[13px]">
          <dt className="text-muted">{isRule ? 'Rule' : 'Check'}</dt>
          <dd>
            <span translate="no" className="font-mono text-[12px]">{f.checkId}</span> <span className="text-muted">v{f.checkVersion}</span>
            {isRule && (
              <Link to={`/rules?rule=${f.checkId}`} className="ml-2 text-link hover:underline">
                Open rule
              </Link>
            )}
          </dd>
          {f.aphClause && (
            <>
              <dt className="text-muted">APH</dt>
              <dd>{f.aphClause}</dd>
            </>
          )}
          <dt className="text-muted">Document</dt>
          <dd>{b.documents.find((x) => x.id === f.documentId)?.typeLabel}</dd>
          <dt className="text-muted">Raised</dt>
          <dd>{fmtDateTime(f.createdAt)}</dd>
        </dl>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-rule pt-3">
          <span className="text-[12px] text-muted">Review</span>
          <ReviewChip state={state} />
        </div>
        {review && (
          <p className="mt-2 text-[13px] leading-5 text-muted">
            {review.actor}, {fmtDateTime(review.at)}
            {review.reason && <span className="block text-ink">“{review.reason}”</span>}
            {review.message && <span className="block text-ink">“{review.message}”</span>}
          </p>
        )}
        {officer ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {ACTIONS.map(({ a, label, state: s }) => {
              const current = state === s
              return (
                <button
                  key={a}
                  onClick={() => onAct(a)}
                  disabled={current}
                  className={`flex min-h-9 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] font-medium leading-4 active:translate-y-px ${
                    a === 'confirm' && !current ? 'bg-action text-white hover:bg-action-dark' : current ? 'bg-active text-muted' : 'border border-control bg-surface hover:border-ink-2 hover:bg-raised'
                  }`}
                >
                  {current && <Check size={14} aria-hidden />}
                  {a === 'dismiss' && !current && <X size={14} aria-hidden />}
                  {label}
                </button>
              )
            })}
          </div>
        ) : (
          <p className="mt-3 rounded-md bg-raised px-3 py-2 text-[13px] text-muted">Only scrutiny officers act on findings. You can read every finding & its evidence.</p>
        )}
      </div>
      <h4 className="px-1 pt-1 text-[13px] font-medium">Evidence ({f.evidence.length})</h4>
      {f.evidence.map((e, i) => (
        <EvidenceCard key={i} e={e} onShow={onShow} />
      ))}
    </section>
  )
}

function DocumentsTab({ b, d, onOpen }: { b: AppBundle; d: Derived; onOpen: (id: string) => void }) {
  return (
    <section className="rounded-lg bg-surface border border-line">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[980px] border-collapse text-[14px]">
          <thead className="text-[12px] text-muted">
            <tr className="border-b border-line text-left">
              {['Document', 'Issuer', 'Pages', 'Uploaded', 'SHA-256', 'Status', 'Because'].map((h) => (
                <th key={h} scope="col" className={`px-3 py-2.5 font-normal ${h === 'Pages' ? 'text-right' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.documents.map((doc) => {
              const s = d.statuses[doc.id]
              return (
                <tr key={doc.id} onClick={() => onOpen(doc.id)} className="cursor-pointer border-b border-rule align-top last:border-0 hover:bg-raised">
                  <td className="px-3 py-3">
                    <button onClick={(e) => (e.stopPropagation(), onOpen(doc.id))} className="text-left font-medium leading-5 text-link hover:underline">
                      {doc.typeLabel}
                    </button>
                    <div className="text-[12px] leading-4 text-muted">{doc.filename}</div>
                  </td>
                  <td className="max-w-[220px] px-3 py-3 text-muted">{doc.issuer}</td>
                  <td className="num px-3 py-3 text-right">{doc.pages}</td>
                  <td className="num whitespace-nowrap px-3 py-3 text-muted">{fmtIsoDate(doc.uploadedAt)}</td>
                  <td translate="no" className="px-3 py-3 font-mono text-[12px]" title={doc.sha256}>
                    {shortHash(doc.sha256, 12)}
                  </td>
                  <td className="px-3 py-3">
                    <StatusChip status={s.status} />
                  </td>
                  <td className="max-w-[260px] px-3 py-3 text-[13px] leading-5 text-muted">{s.because}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <ul className="md:hidden">
        {b.documents.map((doc) => {
          const s = d.statuses[doc.id]
          return (
            <li key={doc.id} className="border-b border-rule last:border-0">
              <button onClick={() => onOpen(doc.id)} className="block w-full px-4 py-3 text-left">
                <span className="flex items-start justify-between gap-3">
                  <span className="font-medium">{doc.typeLabel}</span>
                  <StatusChip status={s.status} />
                </span>
                <span className="mt-1 block text-[13px] leading-5 text-muted">
                  {doc.issuer} · {doc.pages} {doc.pages === 1 ? 'page' : 'pages'} · <span translate="no" className="font-mono text-[12px]">{shortHash(doc.sha256, 8)}</span>
                </span>
                <span className="block text-[13px] leading-5 text-muted">Because: {s.because}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const OUTCOME: Record<CheckOutcome, { label: string; cls: string }> = {
  pass: { label: 'Pass', cls: 'text-st-verified' },
  fail: { label: 'Fail', cls: 'font-semibold text-ink' },
  na: { label: 'Not applicable', cls: 'text-muted' },
  error: { label: 'Error', cls: 'font-medium text-st-source' },
}

function ChecksTab({ b, raised }: { b: AppBundle; raised: number }) {
  const [only, setOnly] = useState<'all' | 'issues'>('all')
  const list = only === 'all' ? b.checks : b.checks.filter((c) => c.outcome === 'fail' || c.outcome === 'error')
  const total = b.checks.reduce((s, c) => s + c.durationMs, 0)
  return (
    <section className="rounded-lg bg-surface border border-line">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-4 py-3">
        <p className="num font-medium">
          {b.checks.length} checks run · {raised} raised findings
          <span className="ml-2 font-normal text-muted">· {fmtDuration(total)} in all</span>
        </p>
        <div className="flex rounded-md bg-raised p-0.5 border border-line" role="group" aria-label="Show checks">
          {(['all', 'issues'] as const).map((o) => (
            <button key={o} onClick={() => setOnly(o)} aria-pressed={only === o} className={`h-7 rounded-[5px] px-3 text-[13px] ${only === o ? 'bg-surface font-medium shadow-[0_0_0_1px_var(--color-line)]' : 'text-muted'}`}>
              {o === 'all' ? 'All checks' : 'Fail and error only'}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-[14px]">
          <thead className="text-[12px] text-muted">
            <tr className="border-b border-line text-left">
              <th scope="col" className="px-3 py-2.5 font-normal">Check</th>
              <th scope="col" className="px-3 py-2.5 font-normal">What it checks</th>
              <th scope="col" className="px-3 py-2.5 font-normal">Kind</th>
              <th scope="col" className="px-3 py-2.5 font-normal">Outcome</th>
              <th scope="col" className="px-3 py-2.5 font-normal">Document</th>
              <th scope="col" className="px-3 py-2.5 text-right font-normal">Duration</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-muted">
                  {b.checks.length === 0 ? `No checks have run yet. ${b.documents.length} documents are waiting in the automated check queue.` : 'No checks failed or errored.'}
                </td>
              </tr>
            )}
            {list.map((c) => (
              <tr key={c.id} className="border-b border-rule last:border-0">
                <td className="whitespace-nowrap px-3 py-2.5">
                  <span translate="no" className="font-mono text-[12px]">{c.checkId}</span> <span className="text-[12px] text-muted">v{c.version}</span>
                </td>
                <td className="px-3 py-2.5">{c.title}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-muted">{c.kind}</td>
                <td className={`whitespace-nowrap px-3 py-2.5 ${OUTCOME[c.outcome].cls}`}>{OUTCOME[c.outcome].label}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-muted">{b.documents.find((x) => x.id === c.documentId)?.typeLabel ?? 'Application'}</td>
                <td className="num whitespace-nowrap px-3 py-2.5 text-right text-muted">{fmtDuration(c.durationMs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function DocDrawer({ b, d, docId, onClose }: { b: AppBundle; d: Derived; docId: string; onClose: () => void }) {
  const doc = b.documents.find((x) => x.id === docId)!
  const ref = useRef<HTMLButtonElement>(null)
  const panel = useDialog<HTMLDivElement>(onClose, ref)
  const s = d.statuses[doc.id]
  const related = b.findings.filter((f) => f.documentId === doc.id)
  return (
    <div className="fixed inset-0 z-40 flex justify-end overscroll-contain bg-night/50" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panel} role="dialog" aria-modal="true" aria-label={doc.typeLabel} className="toast-in flex h-full w-full max-w-[760px] flex-col overflow-y-auto overscroll-contain bg-page shadow-[0_0_48px_rgb(22_33_58/0.3)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-page px-4 py-3">
          <div>
            <h2 className="text-[16px] font-semibold">{doc.typeLabel}</h2>
            <p className="text-[12px] text-muted">
              Status: {s.because} · <span translate="no" className="font-mono">{shortHash(doc.sha256, 16)}</span>
            </p>
          </div>
          <button ref={ref} onClick={onClose} aria-label="Close document" className="rounded-md p-1.5 text-muted hover:bg-active">
            <X size={18} />
          </button>
        </div>
        <div className="p-4">
          <Viewer doc={doc} status={s.status} />
          {related.length > 0 && (
            <div className="mt-4 rounded-lg bg-surface p-4 border border-line">
              <h3 className="mb-2 font-medium">Findings on this document</h3>
              <ul className="flex flex-col gap-1.5">
                {related.map((f) => (
                  <li key={f.id} className="flex items-center gap-2">
                    <SeverityMark severity={f.severity} />
                    {f.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
