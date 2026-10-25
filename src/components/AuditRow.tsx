import { Link } from 'react-router-dom'
import type { AuditEvent } from '../lib/types'
import { fmtDateTime, shortHash } from '../lib/format'

export function AuditRow({ e, broken, showApp = true, id }: { e: AuditEvent; broken?: boolean; showApp?: boolean; id?: string }) {
  return (
    <li id={id} className={`scroll-mt-32 grid grid-cols-[36px_minmax(0,1fr)] gap-x-3 sm:grid-cols-[52px_minmax(0,1fr)] border-b border-rule px-4 py-3 last:border-0 lg:grid-cols-[60px_minmax(0,1fr)_230px] ${broken ? 'bg-[#fbeceb]' : ''}`}>
      <span className={`num pt-px text-right text-[13px] ${broken ? 'font-semibold text-stamp' : 'text-muted'}`}>{e.seq}</span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-medium">{e.type}</span>
          <span className="font-mono text-[12px] text-muted">{e.subjectId}</span>
          {showApp && e.appId && e.appId !== e.subjectId && !e.subjectId.startsWith(e.appId) && (
            <Link to={`/applications/${e.appId}`} className="font-mono text-[12px] text-action hover:underline">
              {e.appId}
            </Link>
          )}
        </div>
        <p className="mt-0.5 break-words leading-5">{e.summary}</p>
        <p className="mt-0.5 text-[13px] leading-[18px] text-muted">
          {fmtDateTime(e.at)} · {e.actor}, {e.role}
        </p>
        {broken && <p className="mt-1 text-[12px] font-medium text-stamp">Contents no longer match the stored hash</p>}
      </div>
      <dl className="col-start-2 mt-1.5 grid content-start self-start grid-cols-[40px_1fr] gap-x-2 text-[12px] leading-4 lg:col-start-3 lg:mt-0">
        <dt className="text-muted">hash</dt>
        <dd className={`font-mono ${broken ? 'text-stamp' : ''}`} title={e.hash}>
          {shortHash(e.hash, 16)}
        </dd>
        <dt className="text-muted">prev</dt>
        <dd className="font-mono text-muted" title={e.prevHash}>
          {shortHash(e.prevHash, 16)}
        </dd>
      </dl>
    </li>
  )
}
