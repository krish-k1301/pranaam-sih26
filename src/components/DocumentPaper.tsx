import type { AppDocument, ExtractedField } from '../lib/types'
import { hashString, mulberry32 } from '../data/seed'
import { LabPhoto } from './PhotoPair'

interface Props {
  doc: AppDocument
  page: number
  highlights?: string[]
  /** Fixed sheet width in px; omit to fit the container. */
  width?: number
}

const pctBox = (f: ExtractedField) => ({
  left: `${f.bbox.x * 100}%`,
  top: `${f.bbox.y * 100}%`,
  width: `${f.bbox.w * 100}%`,
  height: `${f.bbox.h * 100}%`,
})

function cols(n: number) {
  if (n === 5) return '1.25fr 1.55fr 1.55fr 0.6fr 0.85fr'
  if (n === 3) return '0.9fr 2fr 0.9fr'
  return `repeat(${n}, 1fr)`
}

function Field({ f }: { f: ExtractedField }) {
  switch (f.kind) {
    case 'title':
      return <div className="text-center text-[3.5cqw] font-bold leading-tight tracking-[0.01em]">{f.value}</div>
    case 'subtitle':
      return <div className="text-[2.4cqw] font-semibold">{f.value}</div>
    case 'ref':
      return <div className="paper-text">{f.value}</div>
    case 'para':
      return <p className="paper-text text-justify">{f.value}</p>
    case 'kv':
      return (
        <div className="paper-text grid grid-cols-[34%_1fr] gap-[2cqw]">
          <span>{f.label}</span>
          <span className="font-semibold">{f.value}</span>
        </div>
      )
    case 'thead':
    case 'row':
      return (
        <div
          className={`grid h-full items-center gap-[1.2cqw] px-[0.8cqw] text-[1.75cqw] leading-tight ${f.kind === 'thead' ? 'border-y border-manila-ink/50 font-semibold' : 'border-b border-manila-ink/15'}`}
          style={{ gridTemplateColumns: cols(f.cells?.length ?? 1) }}
        >
          {f.cells?.map((c, i) => (
            <span key={i} className="truncate">
              {c}
            </span>
          ))}
        </div>
      )
    case 'sign':
      return (
        <div className="flex h-full flex-col items-center justify-end text-center">
          {!f.value.startsWith('(') && (
            <svg viewBox="0 0 120 30" className="mb-[0.4cqw] w-[60%]" aria-hidden>
              <path d="M4 22c10-14 18-16 20-8s-6 12 2 6 12-18 18-10-4 10 4 6 10-14 16-8 2 8 10 4 14-6 22-4" fill="none" stroke="#24305e" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          )}
          <div className="w-full border-t border-manila-ink/60 pt-[0.6cqw] text-[1.8cqw] italic">{f.value}</div>
        </div>
      )
    case 'stamp':
      return (
        <div className="flex h-full items-center justify-center">
          <div className="flex aspect-square w-full -rotate-12 items-center justify-center rounded-full border-[0.45cqw] border-double border-[#3d4f99]/60 p-[1.2cqw] text-center text-[1.25cqw] font-semibold leading-tight text-[#3d4f99]/70">
            {f.value}
          </div>
        </div>
      )
    case 'qr':
      return (
        <div className="flex h-full flex-col items-center gap-[0.6cqw]">
          <QrMark seed={f.value} />
          <span className="text-[1.3cqw]">Scan to verify</span>
        </div>
      )
    case 'note':
      return <div className="paper-text italic opacity-80">{f.value}</div>
  }
}

function QrMark({ seed }: { seed: string }) {
  const r = mulberry32(hashString(seed))
  const n = 21
  const cells: [number, number][] = []
  const finder = (x: number, y: number) => (x < 7 && y < 7) || (x > n - 8 && y < 7) || (x < 7 && y > n - 8)
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!finder(x, y) && r() > 0.52) cells.push([x, y])
  const eye = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} fill="#2a2418" />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="var(--color-manila)" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="#2a2418" />
    </g>
  )
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} className="aspect-square w-full" aria-hidden shapeRendering="crispEdges">
      {cells.map(([x, y]) => (
        <rect key={`${x}.${y}`} x={x} y={y} width={1} height={1} fill="#2a2418" />
      ))}
      {eye(0, 0)}
      {eye(n - 7, 0)}
      {eye(0, n - 7)}
    </svg>
  )
}

function Seal() {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden>
      <circle cx="20" cy="20" r="18" fill="none" stroke="#2a2418" strokeWidth="1.4" />
      <circle cx="20" cy="20" r="14" fill="none" stroke="#2a2418" strokeWidth="0.7" />
      <path d="M20 9l3 7h7l-5.5 4.5 2 7.5-6.5-4.5-6.5 4.5 2-7.5L10 16h7z" fill="#2a2418" opacity="0.8" />
    </svg>
  )
}

export function DocumentPaper({ doc, page, highlights = [], width }: Props) {
  if (doc.photo) {
    return (
      <div style={{ width }} className="w-full">
        <LabPhoto spec={doc.photo} />
      </div>
    )
  }
  const fields = doc.fields.filter((f) => f.page === page)
  const flagged = fields.filter((f) => highlights.includes(f.key))
  return (
    <div className="paper w-full" style={width ? { width, flex: 'none' } : undefined} aria-label={`${doc.typeLabel}, page ${page} of ${doc.pages}`} role="img">
      {page === 1 ? (
        <div className="absolute inset-x-[9%] top-[2.6%] flex h-[7.4%] items-center gap-[2.4cqw] border-b-[0.5cqw] border-double border-manila-ink/70 pb-[1cqw]">
          <div className="aspect-square h-full flex-none">
            <Seal />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[2.9cqw] font-bold leading-tight">{doc.issuer}</div>
            <div className="truncate text-[1.9cqw] opacity-80">{doc.issuerLine}</div>
          </div>
        </div>
      ) : (
        <div className="absolute inset-x-[9%] top-[2.6%] truncate border-b border-manila-ink/30 pb-[0.6cqw] text-[1.75cqw] opacity-75">
          {doc.issuer} · {doc.typeLabel}
        </div>
      )}
      <span className="absolute right-[3%] top-[1.2%] font-sans text-[1.8cqw] text-manila-ink/60">Synthetic sample</span>
      {fields.map((f) => (
        <div key={f.key} className="absolute" style={pctBox(f)}>
          <Field f={f} />
        </div>
      ))}
      {flagged.map((f) => (
        <div
          key={`hl-${f.key}`}
          className="flag-in pointer-events-none absolute rounded-[2px] ring-2 ring-action"
          style={{
            left: `calc(${f.bbox.x * 100}% - 0.8cqw)`,
            top: `calc(${f.bbox.y * 100}% - 0.6cqw)`,
            width: `calc(${f.bbox.w * 100}% + 1.6cqw)`,
            height: `calc(${f.bbox.h * 100}% + 1.2cqw)`,
            background: 'rgb(42 75 184 / 0.07)',
          }}
        >
          <span className="absolute -top-[19px] left-[-2px] whitespace-nowrap rounded-t-[3px] bg-action px-1.5 font-sans text-[11px] font-medium leading-[17px] text-white">
            {f.label ?? f.key}
          </span>
        </div>
      ))}
      <span className="absolute inset-x-0 bottom-[2%] text-center text-[1.8cqw] opacity-70">
        Page {page} of {doc.pages}
      </span>
    </div>
  )
}
