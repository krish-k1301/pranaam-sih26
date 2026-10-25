import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Lock, X } from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { SeverityMark } from '../components/RiskBadge'
import { useStore } from '../state/DemoStore'
import type { Rule, Severity } from '../lib/types'

const live = (r: Rule) => r.versions.find((v) => v.status === 'Live') ?? r.versions[r.versions.length - 1]
const draft = (r: Rule) => r.versions.find((v) => v.status === 'Draft')

function StatusTag({ status }: { status: 'Live' | 'Draft' | 'Retired' }) {
  const cls = status === 'Live' ? 'bg-[#e3f1e8] text-[#1f5c39]' : status === 'Draft' ? 'bg-surface text-action shadow-[inset_0_0_0_1px_var(--color-action)]' : 'bg-active text-muted'
  return <span className={`inline-flex flex-none whitespace-nowrap rounded-[4px] px-1.5 text-[12px] font-medium leading-[18px] ${cls}`}>{status}</span>
}

export default function Rules() {
  const { rules, role } = useStore()
  const [params, setParams] = useSearchParams()
  const openId = params.get('rule')
  const open = rules.find((r) => r.id === openId)
  const admin = role === 'Rule administrator'
  const setOpen = (id: string | null) => {
    const next = new URLSearchParams(params)
    if (id) next.set('rule', id)
    else next.delete('rule')
    setParams(next, { replace: true })
  }
  const live15 = rules.length
  const drafts = rules.filter((r) => draft(r)).length

  return (
    <>
      <TopBar title="Rules" />
      <main id="main" className="px-4 pb-10 pt-5 md:px-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <p className="max-w-[760px] text-[15px] leading-[22px]">
            {live15} rules from the Approval Process Handbook 2024-27 run on every application.{' '}
            {drafts > 0 ? `${drafts} ${drafts === 1 ? 'draft waits' : 'drafts wait'} for approval.` : 'No drafts are waiting for approval.'}
          </p>
          {!admin && (
            <p className="flex items-center gap-1.5 text-[13px] text-muted">
              <Lock size={14} aria-hidden /> Rules are managed by rule administrators.
            </p>
          )}
        </div>
        <section className="rounded-lg bg-surface border border-line">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1000px] border-collapse text-[14px]">
              <thead className="text-[12px] text-muted">
                <tr className="border-b border-line text-left">
                  {['Rule', 'Title', 'APH clause', 'Applies to', 'Severity', 'Version', 'Status', 'Approved'].map((h) => (
                    <th key={h} scope="col" className={`px-3 py-2.5 font-normal ${h === 'Version' ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => {
                  const v = live(r)
                  const dr = draft(r)
                  return (
                    <tr key={r.id} onClick={() => setOpen(r.id)} className={`cursor-pointer border-b border-rule last:border-0 hover:bg-raised ${openId === r.id ? 'bg-active' : ''}`}>
                      <td className="whitespace-nowrap px-3 py-3">
                        <button onClick={(e) => (e.stopPropagation(), setOpen(r.id))} className="font-mono text-[13px] text-action hover:underline">
                          {r.id}
                        </button>
                      </td>
                      <td className="px-3 py-3 font-medium leading-5">{r.title}</td>
                      <td className="px-3 py-3 leading-5 text-muted">
                        {r.clause}
                        <span className="block text-[12px]">{r.edition}</span>
                      </td>
                      <td className="px-3 py-3 text-muted">{r.appliesTo}</td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <SeverityMark severity={v.severity} withLabel />
                      </td>
                      <td className="num whitespace-nowrap px-3 py-3 text-right">
                        v{v.version}
                        {dr && <span className="block text-[12px] text-action">v{dr.version} draft</span>}
                      </td>
                      <td className="px-3 py-3">
                        <StatusTag status={v.status} />
                      </td>
                      <td className="px-3 py-3 text-[13px] leading-5 text-muted">
                        {v.approvedBy?.split(',')[0]}
                        <span className="num block text-[12px]">{v.approvedAt}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <ul className="md:hidden">
            {rules.map((r) => {
              const v = live(r)
              return (
                <li key={r.id} className="border-b border-rule last:border-0">
                  <button onClick={() => setOpen(r.id)} className="block w-full px-4 py-3 text-left">
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-medium leading-5">{r.title}</span>
                      <StatusTag status={v.status} />
                    </span>
                    <span className="mt-1 flex flex-wrap gap-x-2 text-[13px] text-muted">
                      <span className="font-mono text-[12px]">{r.id}</span>· v{v.version} · {r.clause} · <SeverityMark severity={v.severity} withLabel />
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      </main>
      {open && <RulePanel key={open.id} r={open} admin={admin} onClose={() => setOpen(null)} />}
    </>
  )
}

function RulePanel({ r, admin, onClose }: { r: Rule; admin: boolean; onClose: () => void }) {
  const { draftRule, publishRule } = useStore()
  const v = live(r)
  const dr = draft(r)
  const [editing, setEditing] = useState(false)
  const [sev, setSev] = useState<Severity>(dr?.severity ?? v.severity)
  const [msg, setMsg] = useState(dr?.message ?? v.message)
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', k)
    return () => {
      document.removeEventListener('keydown', k)
      prev?.focus()
    }
  }, [onClose])
  const shown = dr ?? v

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-ink/30" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside role="dialog" aria-modal="true" aria-labelledby="rule-h" className="toast-in flex h-full w-full max-w-[560px] flex-col overflow-y-auto bg-surface shadow-[0_0_48px_rgb(22_33_58/0.28)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-surface px-5 py-4">
          <div>
            <p className="flex items-center gap-2 text-[13px] text-muted">
              <span className="font-mono text-[12px] text-ink">{r.id}</span> · {r.clause}, {r.edition}
            </p>
            <h2 id="rule-h" className="mt-1 text-[18px] font-semibold leading-6">
              {r.title}
            </h2>
          </div>
          <button ref={closeRef} onClick={onClose} aria-label="Close rule" className="rounded-md p-1.5 text-muted hover:bg-active">
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-col gap-5 px-5 py-4">
          <div className="flex flex-wrap items-center gap-3 text-[13px]">
            <StatusTag status={shown.status} />
            <span className="num">Version {shown.version}</span>
            <SeverityMark severity={shown.severity} withLabel />
            <span className="text-muted">Applies to {r.appliesTo.toLowerCase()}</span>
          </div>

          <section>
            <h3 className="mb-1.5 text-[13px] font-medium">Expression (JSON-Logic)</h3>
            <pre className="overflow-x-auto rounded-md bg-ink p-3 font-mono text-[12px] leading-[18px] text-[#e7eaf3]">
              <code>{shown.logic}</code>
            </pre>
            <p className="mt-1 text-[12px] text-muted">A finding is raised when the expression is true.</p>
          </section>

          <section>
            <h3 className="mb-1.5 text-[13px] font-medium">Message template</h3>
            <p className="rounded-md bg-raised px-3 py-2 leading-5">{shown.message}</p>
          </section>

          {admin ? (
            editing ? (
              <section className="rounded-lg p-4 border border-line">
                <h3 className="mb-3 font-medium">{dr ? `Edit draft v${dr.version}` : `New draft from v${v.version}`}</h3>
                <label className="block text-[14px] font-medium" htmlFor="sev">
                  Severity
                </label>
                <select id="sev" value={sev} onChange={(e) => setSev(e.target.value as Severity)} className="mt-2 h-9 w-full rounded-md border border-control bg-surface px-2.5 outline-none focus:border-action focus:ring-2 focus:ring-action/25">
                  {(['info', 'minor', 'major', 'critical'] as Severity[]).map((s) => (
                    <option key={s} value={s}>
                      {s[0].toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
                <label className="mt-4 block text-[14px] font-medium" htmlFor="msg">
                  Message template
                </label>
                <textarea id="msg" value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} aria-describedby="msg-h" className="mt-2 w-full rounded-md border border-control px-3 py-2 leading-5 outline-none focus:border-action focus:ring-2 focus:ring-action/25" />
                <p id="msg-h" className="mt-1 text-[12px] text-muted">
                  Placeholders in braces, such as {'{valid_until}'}, are filled from the document.
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => setEditing(false)} className="h-9 rounded-md border border-control px-4 font-medium hover:bg-raised">
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      draftRule(r.id, sev, msg.trim() || v.message)
                      setEditing(false)
                    }}
                    className="h-9 rounded-md bg-action px-4 font-medium text-white hover:bg-action-dark"
                  >
                    Save draft
                  </button>
                </div>
              </section>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setEditing(true)} className="h-9 rounded-md border border-control px-4 font-medium hover:bg-raised active:translate-y-px">
                  {dr ? `Edit draft v${dr.version}` : 'Edit rule'}
                </button>
                {dr && (
                  <button onClick={() => publishRule(r.id, dr.version)} className="h-9 rounded-md bg-action px-4 font-medium text-white hover:bg-action-dark active:translate-y-px">
                    Approve and publish v{dr.version}
                  </button>
                )}
              </div>
            )
          ) : (
            <p className="flex items-center gap-2 rounded-md bg-raised px-3 py-2 text-[13px] text-muted">
              <Lock size={14} aria-hidden /> Rules are managed by rule administrators.
            </p>
          )}

          <section>
            <h3 className="mb-2 text-[13px] font-medium">Version history</h3>
            <ol className="flex flex-col">
              {[...r.versions].reverse().map((ver) => (
                <li key={ver.version} className="grid grid-cols-[44px_1fr] gap-3 border-b border-rule py-2.5 last:border-0">
                  <span className="num pt-px font-semibold">v{ver.version}</span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusTag status={ver.status} />
                      <SeverityMark severity={ver.severity} withLabel />
                    </div>
                    <p className="mt-1 leading-5">{ver.change}</p>
                    <p className="text-[12px] text-muted">{ver.approvedBy ? `Approved by ${ver.approvedBy} on ${ver.approvedAt}` : 'Not yet approved'}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </aside>
    </div>
  )
}
