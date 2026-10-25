import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, Search } from 'lucide-react'
import { ALERTS, BUNDLES } from '../data'
import { TopBar } from '../components/TopBar'
import { BandBadge, RiskBadge } from '../components/RiskBadge'
import { StatusMiniBar } from '../components/StatusMiniBar'
import { StatusLegend } from '../components/StatusLegend'
import { useStore } from '../state/DemoStore'
import { deriveBundle } from '../lib/derive'
import { fmtDateTime, fmtDuration, fmtIsoDate } from '../lib/format'
import type { RiskBand } from '../lib/status'
import type { AlertType, Category, Region } from '../lib/types'

type SortKey = 'risk' | 'submitted' | 'findings'

const REGIONS = [...new Set(BUNDLES.map((b) => b.app.region))].sort() as Region[]
const CATEGORIES: Category[] = ['Extension of approval', 'Increase in intake', 'New course']

const ALERT_MARK: Record<AlertType, string> = {
  'Cross-application match': 'bg-ink',
  'Suspected anomaly': 'bg-st-manual',
  'Expired document': 'bg-st-expired',
  'Pending source verification': 'bg-st-source',
  'Missing information': 'bg-faint',
}

function Select<T extends string>({ label, value, options, onChange }: { label: string; value: T | ''; options: { v: T; l: string }[]; onChange: (v: T | '') => void }) {
  return (
    <label className="flex flex-col gap-1 text-[12px] text-muted">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T | '')}
        className="h-9 min-w-[150px] rounded-md border border-control bg-surface px-2.5 text-[14px] text-ink outline-none focus:border-action focus:ring-2 focus:ring-action/25"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function Queue() {
  const { reviews } = useStore()
  const [params, setParams] = useSearchParams()
  const nav = useNavigate()
  const q = params.get('q') ?? ''
  // Every filter and the sort live in the URL, so a filtered queue can be shared, refreshed and navigated back to.
  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v)
    else next.delete(k)
    setParams(next, { replace: true })
  }
  const band = (params.get('band') ?? '') as RiskBand | ''
  const region = (params.get('region') ?? '') as Region | ''
  const category = (params.get('category') ?? '') as Category | ''
  const cross = params.get('cross') === '1'
  const setBand = (v: RiskBand | '') => setParam('band', v)
  const setRegion = (v: Region | '') => setParam('region', v)
  const setCategory = (v: Category | '') => setParam('category', v)
  const setCross = (v: boolean) => setParam('cross', v ? '1' : null)
  const sortKey = (['risk', 'submitted', 'findings'].includes(params.get('sort') ?? '') ? params.get('sort') : 'risk') as SortKey
  const sort = { key: sortKey, dir: (params.get('dir') === 'asc' ? 1 : -1) as 1 | -1 }
  const setSort = (key: SortKey) => {
    const dir = sort.key === key ? (sort.dir === 1 ? 'desc' : 'asc') : 'desc'
    const next = new URLSearchParams(params)
    if (key === 'risk' && dir === 'desc') {
      next.delete('sort')
      next.delete('dir')
    } else {
      next.set('sort', key)
      next.set('dir', dir)
    }
    setParams(next, { replace: true })
  }
  const allAlerts = params.get('alerts') === 'all'
  const setAllAlerts = (v: boolean) => setParam('alerts', v ? 'all' : null)
  const [showFilters, setShowFilters] = useState(Boolean(band || region || category || cross))

  const rows = useMemo(() => BUNDLES.map((b) => ({ b, d: deriveBundle(b, reviews) })), [reviews])

  const summary = useMemo(() => {
    const high = rows.filter((r) => r.d.risk.band === 'high').length
    const awaitingSource = rows.reduce((s, r) => s + (r.d.counts.source_unavailable ?? 0) + (r.d.counts.pending ?? 0), 0)
    const findings = rows.reduce((s, r) => s + r.d.openFindings, 0)
    const avg = rows.reduce((s, r) => s + r.b.checks.reduce((t, c) => t + c.durationMs, 0), 0) / rows.length
    return { total: rows.length, high, awaitingSource, findings, avg }
  }, [rows])

  const lead = useMemo(() => [...rows].sort((a, b) => b.d.risk.score - a.d.risk.score)[0], [rows])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows
      .filter(({ b, d }) => {
        if (band && d.risk.band !== band) return false
        if (region && b.app.region !== region) return false
        if (category && b.app.category !== category) return false
        if (cross && !d.hasCrossMatch) return false
        if (needle && !`${b.app.institution} ${b.app.city} ${b.app.id}`.toLowerCase().includes(needle)) return false
        return true
      })
      .sort((x, y) => {
        const v =
          sort.key === 'risk'
            ? x.d.risk.score - y.d.risk.score || x.b.app.submittedAt.localeCompare(y.b.app.submittedAt)
            : sort.key === 'submitted'
              ? x.b.app.submittedAt.localeCompare(y.b.app.submittedAt)
              : x.d.openFindings - y.d.openFindings
        return v * sort.dir
      })
  }, [rows, q, band, region, category, cross, sort.key, sort.dir])

  const setQ = (v: string) => {
    const next = new URLSearchParams(params)
    if (v) next.set('q', v)
    else next.delete('q')
    setParams(next, { replace: true })
  }

  const sortBtn = (key: SortKey, label: string, align: 'left' | 'right' = 'left') => {
    const active = sort.key === key
    return (
      <th scope="col" aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'} className={`px-2.5 py-2.5 font-normal ${align === 'right' ? 'text-right' : 'text-left'}`}>
        <button onClick={() => setSort(key)} className={`inline-flex min-h-6 items-center gap-1 rounded hover:text-ink ${active ? 'text-ink' : ''}`}>
          {label}
          {active && (sort.dir === -1 ? <ArrowDown size={13} aria-hidden /> : <ArrowUp size={13} aria-hidden />)}
        </button>
      </th>
    )
  }

  const filtersOn = band || region || category || cross || q

  return (
    <>
      <TopBar title="Queue" />
      <main id="main" className="px-4 pb-10 pt-5 md:px-6">
        <p className="mb-4 max-w-[860px] text-[15px] leading-[22px]">
          {summary.high} applications are high risk.{' '}
          <Link to={`/applications/${lead.b.app.id}`} className="font-medium text-action hover:underline">
            {lead.b.app.institution}
          </Link>{' '}
          leads the queue with a score of {lead.d.risk.score}, including a faculty member listed by another institution.
        </p>

        <section aria-label="Queue summary" className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-line border border-line sm:grid-cols-3 lg:grid-cols-5">
          {[
            ['Applications in queue', summary.total],
            ['High risk', summary.high],
            ['Documents awaiting source verification', summary.awaitingSource],
            ['Findings awaiting review', summary.findings],
            ['Average automated check time', fmtDuration(Math.round(summary.avg))],
          ].map(([label, value], i) => (
            <div key={label} className={`bg-surface px-4 py-3 ${i === 4 ? 'col-span-2 sm:col-span-2 lg:col-span-1' : ''}`}>
              <div className="text-[12px] leading-4 text-muted">{label}</div>
              <div className="num mt-1 text-[22px] font-medium leading-7">{value}</div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 gap-5 min-[1360px]:grid-cols-[minmax(0,1fr)_320px]">
          <section aria-labelledby="queue-h" className="min-w-0 rounded-lg bg-surface border border-line">
            <div className="flex flex-wrap items-end gap-3 border-b border-rule p-4">
              <h2 id="queue-h" className="sr-only">
                Applications
              </h2>
              <div className="flex w-full items-end gap-2 lg:hidden">
              <label className="flex min-w-0 flex-1 flex-col gap-1 text-[12px] text-muted">
                Search
                <span className="relative">
                  <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" aria-hidden />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    type="search"
                    name="q"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="Institution or application ID…"
                    className="h-9 w-full rounded-md border border-control bg-surface pl-9 pr-3 text-[14px] text-ink outline-none placeholder:text-faint focus:border-action focus:ring-2 focus:ring-action/25"
                  />
                </span>
              </label>
              <button onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters} className="h-9 flex-none rounded-md border border-control bg-surface px-3 hover:border-ink-2 text-[14px] font-medium sm:hidden">
                Filters{[band, region, category, cross].filter(Boolean).length ? ` (${[band, region, category, cross].filter(Boolean).length})` : ''}
              </button>
              </div>
              <div className={`${showFilters ? 'grid' : 'hidden'} w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:flex-wrap`}>
                <Select label="Risk band" value={band} onChange={setBand} options={[{ v: 'high', l: 'High' }, { v: 'medium', l: 'Medium' }, { v: 'low', l: 'Low' }]} />
                <Select label="Region" value={region} onChange={setRegion} options={REGIONS.map((r) => ({ v: r, l: r }))} />
                <Select label="Category" value={category} onChange={setCategory} options={CATEGORIES.map((c) => ({ v: c, l: c }))} />
                <label className="flex min-h-9 cursor-pointer items-center gap-2 self-end rounded-md px-1 py-1 text-[14px] hover:bg-raised">
                  <input type="checkbox" checked={cross} onChange={(e) => setCross(e.target.checked)} className="size-4 accent-action" />
                  Has cross-application match
                </label>
              </div>
              <p className="num ml-auto self-end pb-2 text-[12px] text-muted">
                {filtered.length} of {rows.length}
                {filtersOn && (
                  <button
                    onClick={() => setParams(new URLSearchParams(), { replace: true })}
                    className="inline-control ml-2 font-medium text-action hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </p>
            </div>

            {filtered.length === 0 ? (
              <p className="m-4 rounded-md border border-dashed border-control px-4 py-3 text-muted">No applications match these filters. Clear a filter or search by application ID.</p>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[860px] border-collapse text-[14px]">
                    <thead className="text-[12px] text-muted">
                      <tr className="border-b border-line">
                        {sortBtn('risk', 'Risk')}
                        <th scope="col" className="px-2.5 py-2.5 text-left font-normal">
                          Application
                        </th>
                        <th scope="col" className="px-2.5 py-2.5 text-left font-normal">
                          Institution
                        </th>
                        <th scope="col" className="px-2.5 py-2.5 text-left font-normal">
                          Category
                        </th>
                        {sortBtn('submitted', 'Submitted', 'right')}
                        <th scope="col" className="px-2.5 py-2.5 text-left font-normal">
                          Documents
                        </th>
                        {sortBtn('findings', 'Open', 'right')}
                        <th scope="col" className="px-2.5 py-2.5 text-left font-normal">
                          Officer
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(({ b, d }) => (
                        <tr
                          key={b.app.id}
                          onClick={() => nav(`/applications/${b.app.id}`)}
                          className="cursor-pointer border-b border-rule last:border-0 hover:bg-raised"
                        >
                          <td className="px-2.5 py-3">
                            <RiskBadge risk={d.risk} />
                          </td>
                          <td className="whitespace-nowrap px-2.5 py-3">
                            <Link to={`/applications/${b.app.id}`} onClick={(e) => e.stopPropagation()} translate="no" className="font-mono text-[13px] text-action hover:underline">
                              {b.app.id}
                            </Link>
                          </td>
                          <td className="min-w-[196px] px-2.5 py-3">
                            <div className="font-medium leading-5">{b.app.institution}</div>
                            <div className="text-[12px] leading-4 text-muted">
                              {b.app.city}, {b.app.state}
                            </div>
                          </td>
                          <td className="min-w-[120px] px-2.5 py-3 leading-5 text-muted">{b.app.category}</td>
                          <td className="num whitespace-nowrap px-2.5 py-3 text-right text-muted">{fmtIsoDate(b.app.submittedAt)}</td>
                          <td className="px-2.5 py-3">
                            <StatusMiniBar counts={d.counts} total={b.documents.length} />
                          </td>
                          <td className="num px-2.5 py-3 text-right">{d.openFindings === 0 ? <span className="text-faint">0</span> : d.openFindings}</td>
                          <td className="whitespace-nowrap px-2.5 py-3 text-muted">{b.app.assignedOfficer}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="md:hidden">
                  {filtered.map(({ b, d }) => (
                    <li key={b.app.id} className="border-b border-rule last:border-0">
                      <Link to={`/applications/${b.app.id}`} className="block px-4 py-3 active:bg-raised">
                        <div className="flex items-start justify-between gap-3">
                          <span className="min-w-0">
                            <span className="block font-medium leading-5">{b.app.institution}</span>
                            <span className="block text-[13px] leading-5 text-muted">
                              <span translate="no" className="font-mono text-[12px]">{b.app.id}</span> · {b.app.city}
                            </span>
                          </span>
                          <span className="flex flex-none items-center gap-1.5">
                            <span className="num font-semibold">{d.risk.score}</span>
                            <BandBadge band={d.risk.band} />
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3 text-[13px] text-muted">
                          <StatusMiniBar counts={d.counts} total={b.documents.length} />
                          <span className="num">{d.openFindings} open findings</span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <StatusLegend />
          </section>

          <aside aria-labelledby="alerts-h" className="self-start rounded-lg bg-surface border border-line">
            <div className="flex items-baseline justify-between border-b border-rule px-4 py-3">
              <h2 id="alerts-h" className="text-[15px] font-semibold">
                Alerts
              </h2>
              <span className="num text-[12px] text-muted">{ALERTS.length} raised by automated checks</span>
            </div>
            <ul>
              {(allAlerts ? ALERTS : ALERTS.slice(0, 10)).map((a) => (
                <li key={a.id} className="border-b border-rule last:border-0">
                  <Link to={`/applications/${a.appId}`} className="flex gap-3 px-4 py-2.5 hover:bg-raised">
                    <span aria-hidden className={`mt-[7px] size-[7px] flex-none rounded-full ${ALERT_MARK[a.type]}`} />
                    <span className="min-w-0">
                      <span className="block text-[12px] leading-4 text-muted">{a.type}</span>
                      <span className="block leading-5">{a.text}</span>
                      <span className="block text-[12px] leading-4 text-muted">
                        <span translate="no" className="font-mono">{a.appId}</span> · {fmtDateTime(a.at)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {ALERTS.length > 10 && (
              <button onClick={() => setAllAlerts(!allAlerts)} className="w-full border-t border-rule px-4 py-2.5 text-left text-[13px] font-medium text-action hover:bg-raised">
                {allAlerts ? 'Show the latest 10' : `View all ${ALERTS.length} alerts`}
              </button>
            )}
          </aside>
        </div>
      </main>
    </>
  )
}
