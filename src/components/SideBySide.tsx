import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { AppDocument } from '../lib/types'
import { DocumentPaper } from './DocumentPaper'

interface Side {
  doc: AppDocument
  appId: string
  institution: string
  fieldKey: string
  current?: boolean
}

const SHEET = 640

/** A window onto the sheet at reading size, scrolled to the matching row. */
function CroppedPaper({ doc, page, fieldKey }: { doc: AppDocument; page: number; fieldKey: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const field = doc.fields.find((f) => f.key === fieldKey)
  useLayoutEffect(() => {
    if (ref.current && field) ref.current.scrollTop = field.bbox.y * SHEET * 1.414 - 120
  }, [field])
  return (
    <div ref={ref} tabIndex={0} aria-label={`${doc.typeLabel}, page ${page}, scrolled to the matching row`} className="h-[300px] overflow-auto rounded-[3px] bg-manila">
      <div style={{ width: SHEET }}>
        <DocumentPaper doc={doc} page={page} highlights={[fieldKey]} />
      </div>
    </div>
  )
}

export function SideBySide({ left, right, matched, similarity }: { left: Side; right: Side; matched: string; similarity: number }) {
  const pageOf = (s: Side) => s.doc.fields.find((f) => f.key === s.fieldKey)?.page ?? 1
  return (
    <div>
      <p className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-semibold">Same faculty ID on two applications</span>
        <span className="num text-muted">
          {matched} · similarity <span className="font-semibold text-ink">{similarity.toFixed(2)}</span>
        </span>
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[left, right].map((s) => (
          <div key={s.doc.id} className="min-w-0">
            <div className="mb-2 text-[13px] leading-[18px]">
              <div className="truncate font-medium text-ink">{s.institution}</div>
              <div className="text-muted">
                {s.current ? (
                  <>
                    This application · <span translate="no" className="font-mono text-[12px]">{s.appId}</span>
                  </>
                ) : (
                  <>
                    Other application ·{' '}
                    <Link to={`/applications/${s.appId}`} translate="no" className="font-mono text-[12px] hover:underline">
                      {s.appId}
                    </Link>
                  </>
                )}{' '}
                · {s.doc.typeLabel.toLowerCase()}, page {pageOf(s)} of {s.doc.pages}
              </div>
            </div>
            <CroppedPaper doc={s.doc} page={pageOf(s)} fieldKey={s.fieldKey} />
          </div>
        ))}
      </div>
    </div>
  )
}
