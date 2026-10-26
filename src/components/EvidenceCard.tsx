import { Building2, Calculator, Database, FileSearch, GitCompareArrows } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Evidence } from '../lib/types'
import { getDocument } from '../data'
import { fmtDateTime, shortHash } from '../lib/format'

const HEAD = {
  region: { icon: FileSearch, label: 'Document region' },
  record: { icon: Database, label: 'AICTE record' },
  issuer: { icon: Building2, label: 'Issuer response' },
  cross: { icon: GitCompareArrows, label: 'Cross-application match' },
  structural: { icon: Calculator, label: 'Computed fact' },
} as const

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[104px_1fr] gap-3 py-[3px]">
      <dt className="text-muted">{k}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  )
}

export function EvidenceCard({ e, onShow }: { e: Evidence; onShow?: (docId: string, page: number, key: string) => void }) {
  const { icon: Icon, label } = HEAD[e.kind]
  return (
    <section className="rounded-md bg-surface p-3 border border-line">
      <h4 className="mb-2 flex items-center gap-2 text-[12px] font-medium text-muted">
        <Icon size={14} aria-hidden />
        {label}
      </h4>
      <dl className="text-[13px] leading-[18px]">
        {e.kind === 'region' && (
          <>
            <Row k="Document">{getDocument(e.documentId)?.typeLabel ?? e.documentId}</Row>
            <Row k="Where">
              Page {e.page} · field {e.fieldKey.startsWith('row_') ? 'faculty_id' : e.fieldKey}
            </Row>
            <Row k="Reads">
              <span className="font-serif text-[14px]">{e.observed}</span>
            </Row>
            {onShow && (
              <div className="pt-1.5">
                <button onClick={() => onShow(e.documentId, e.page, e.fieldKey)} className="text-[13px] font-medium text-link hover:underline">
                  Show on the document
                </button>
              </div>
            )}
          </>
        )}
        {e.kind === 'record' && (
          <>
            <Row k="Source">{e.source}</Row>
            <Row k="Record">{e.recordId}</Row>
            <Row k="Says">{e.statement}</Row>
            <Row k="As of">{e.asOf}</Row>
          </>
        )}
        {e.kind === 'issuer' && (
          <>
            <Row k="Source">{e.sourceName}</Row>
            <Row k="Outcome">
              <span className={e.outcome === 'Confirmed' ? 'font-medium text-st-verified' : 'font-medium text-st-source'}>{e.outcome}</span>
            </Row>
            <Row k="Request">{e.requestRef}</Row>
            <Row k="Response">{e.summary}</Row>
            <Row k="Received">{fmtDateTime(e.at)}</Row>
            <Row k="Response hash">{e.responseHash ? <span translate="no" className="font-mono text-[12px]" title={e.responseHash}>{shortHash(e.responseHash, 16)}</span> : <span className="text-muted">No response body</span>}</Row>
          </>
        )}
        {e.kind === 'cross' && (
          <>
            <Row k="Institution">{e.otherInstitution}</Row>
            <Row k="Application">
              {e.otherAppId.startsWith('A-2027') ? (
                <Link to={`/applications/${e.otherAppId}`} translate="no" className="font-mono text-[12px] text-link hover:underline">
                  {e.otherAppId}
                </Link>
              ) : (
                <span translate="no" className="font-mono text-[12px]">{e.otherAppId}</span>
              )}
              {!e.otherAppId.startsWith('A-2027') && <span className="text-muted"> (2026-27, closed)</span>}
            </Row>
            <Row k="Matched on">{e.matched}</Row>
            <Row k="Similarity">
              <span className="num font-semibold">{e.similarity.toFixed(2)}</span>
            </Row>
          </>
        )}
        {e.kind === 'structural' && (
          <>
            <p className="mb-1.5">{e.fact}</p>
            <div className="rounded bg-raised px-2.5 py-1.5">
              {e.values.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 py-[2px]">
                  <span className="text-muted">{k}</span>
                  <span className="num text-right font-medium">{v}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </dl>
    </section>
  )
}
