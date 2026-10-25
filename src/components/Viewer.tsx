import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { AppDocument, DocStatus, Finding } from '../lib/types'
import { getBundle, getDocument } from '../data'
import { DocumentPaper } from './DocumentPaper'
import { SideBySide } from './SideBySide'
import { PhotoPair } from './PhotoPair'
import { RevisionTimeline } from './RevisionTimeline'
import { StatusChip } from './StatusChip'

interface Props {
  doc: AppDocument
  status: DocStatus
  finding?: Finding
  /** Page and fields to show instead of the finding's own (from "Show on the document"). */
  focus?: { page: number; keys: string[] }
}

const btn = 'flex h-8 items-center justify-center rounded-md text-white/85 hover:bg-white/10 disabled:opacity-35 disabled:hover:bg-transparent'

export function Viewer({ doc, status, finding, focus }: Props) {
  const initialPage = focus?.page ?? (finding && finding.documentId === doc.id ? finding.page : 1)
  const [page, setPage] = useState(initialPage)
  const [zoom, setZoom] = useState<'fit' | '100'>('fit')
  useEffect(() => setPage(initialPage), [initialPage, doc.id, finding?.id])

  const mode = focus ? 'document' : (finding?.viewer ?? 'document')
  const highlights = focus?.keys ?? (finding && finding.documentId === doc.id ? finding.fieldKeys : [])
  const cross = finding?.evidence.find((e) => e.kind === 'cross')
  const paged = (mode === 'document' || mode === 'revision') && !doc.photo

  let body: React.ReactNode
  if (mode === 'cross' && cross?.kind === 'cross' && cross.otherDocumentId) {
    const other = getDocument(cross.otherDocumentId)
    const key = finding!.fieldKeys[0]
    body = other ? (
      <div className={zoom === '100' ? 'min-w-[860px]' : ''}>
        <SideBySide
          left={{ doc, appId: doc.appId, institution: getBundle(doc.appId)?.app.institution ?? '', fieldKey: key, current: true }}
          right={{ doc: other, appId: other.appId, institution: cross.otherInstitution, fieldKey: key }}
          matched={cross.matched}
          similarity={cross.similarity}
        />
      </div>
    ) : null
  } else if (mode === 'photo' && cross?.kind === 'cross' && cross.otherPhoto && doc.photo) {
    body = <PhotoPair mine={doc.photo} other={cross.otherPhoto} similarity={cross.similarity} />
  } else {
    body = (
      <div className="flex flex-col gap-5">
        {mode === 'revision' && finding?.revision && <RevisionTimeline {...finding.revision} />}
        <div className={zoom === 'fit' ? 'mx-auto w-full max-w-[640px]' : 'mx-auto w-[760px]'}>
          <DocumentPaper doc={doc} page={page} highlights={highlights} />
        </div>
      </div>
    )
  }

  return (
    <section aria-label="Document evidence viewer" className="min-w-0 overflow-hidden rounded-lg bg-ink text-white">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/10 px-4 py-2.5">
        <div className="min-w-0 basis-full sm:basis-auto sm:flex-1">
          <div className="truncate text-[14px] font-medium leading-5">{doc.typeLabel}</div>
          <div className="truncate text-[12px] leading-4 text-white/65">
            {doc.filename} · {doc.issuer}
          </div>
        </div>
        <span className="rounded-[5px] bg-white p-[1px]">
          <StatusChip status={status} />
        </span>
        <div className="flex items-center gap-1">
          {paged && doc.pages > 1 && (
            <>
              <button className={`${btn} w-8`} onClick={() => setPage((p) => p - 1)} disabled={page <= 1} aria-label="Previous page">
                <ChevronLeft size={17} />
              </button>
              <span className="num min-w-[86px] text-center text-[13px]" aria-live="polite">
                Page {page} of {doc.pages}
              </span>
              <button className={`${btn} w-8`} onClick={() => setPage((p) => p + 1)} disabled={page >= doc.pages} aria-label="Next page">
                <ChevronRight size={17} />
              </button>
            </>
          )}
          {paged && doc.pages === 1 && <span className="px-2 text-[13px] text-white/70">Page 1 of 1</span>}
          {mode !== 'photo' && mode !== 'cross' && !doc.photo && (
            <div className="ml-1 flex rounded-md bg-white/8 p-0.5" role="group" aria-label="Zoom">
              {(['fit', '100'] as const).map((z) => (
                <button
                  key={z}
                  onClick={() => setZoom(z)}
                  aria-pressed={zoom === z}
                  className={`h-7 rounded-[5px] px-2.5 text-[12px] font-medium ${zoom === z ? 'bg-white text-ink' : 'text-white/80 hover:text-white'}`}
                >
                  {z === 'fit' ? 'Fit' : '100%'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="overflow-auto p-4 sm:p-6 [&_.text-muted]:text-white/70 [&_.text-ink]:text-white [&_a]:text-[#aebfff] [&_figcaption]:text-white/70">{body}</div>
    </section>
  )
}
