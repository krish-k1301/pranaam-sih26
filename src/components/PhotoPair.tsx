import type { PhotoSpec } from '../lib/types'

/** A drawn stand-in for an uploaded lab photograph: a room with rows of desks and monitors. */
export function LabPhoto({ spec, label }: { spec: PhotoSpec; label?: string }) {
  const rows = Array.from({ length: spec.rows }, (_, i) => i)
  const hue = spec.hueShift ?? 0
  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-[3px] bg-[#cfc8b8]">
        <svg
          viewBox="0 0 400 250"
          className="block h-auto w-full"
          role="img"
          aria-label={`${spec.caption}, ${spec.institution}, ${spec.year}`}
          style={{ filter: hue ? `hue-rotate(${hue}deg) saturate(${1 + Math.abs(hue) / 60})` : undefined }}
        >
          <g transform={spec.mirrored ? 'translate(400 0) scale(-1 1)' : undefined}>
            <rect width="400" height="250" fill="#ddd6c6" />
            <rect y="0" width="400" height="18" fill="#efebe2" />
            {[70, 200, 330].map((x) => (
              <rect key={x} x={x - 30} y="6" width="60" height="5" rx="2" fill="#fbf8ee" />
            ))}
            <polygon points="0,150 400,150 400,250 0,250" fill="#a99d86" />
            <polygon points="0,150 400,150 400,156 0,156" fill="#958a74" />
            <rect x="26" y="40" width="120" height="70" fill="#f4f3ee" stroke="#9c9586" strokeWidth="2" />
            <path d="M40 60h60M40 74h80M40 88h46" stroke="#5a6a8a" strokeWidth="2" opacity="0.5" />
            <rect x="282" y="34" width="92" height="84" fill="#b9d0d8" stroke="#8d8676" strokeWidth="3" />
            <path d="M328 34v84M282 76h92" stroke="#8d8676" strokeWidth="3" />
            <rect x="170" y="56" width="70" height="40" fill="#3b4250" />
            <text x="205" y="80" textAnchor="middle" fontSize="9" fill="#cfd6e3" fontFamily="IBM Plex Sans, sans-serif">
              {spec.caption.slice(0, 14)}
            </text>
            {rows.map((r) => {
              const y = 136 + r * 34
              const s = 0.8 + r * 0.16
              const count = 5
              const span = 330 * s
              const x0 = 200 - span / 2
              return (
                <g key={r}>
                  <rect x={x0 - 8} y={y + 14 * s} width={span + 16} height={7 * s} fill="#7a5d3e" />
                  <rect x={x0 - 8} y={y + 21 * s} width={span + 16} height={3 * s} fill="#5e4630" />
                  {Array.from({ length: count }, (_, i) => {
                    const cx = x0 + (span / (count - 1)) * i
                    return (
                      <g key={i}>
                        <rect x={cx - 14 * s} y={y - 6 * s} width={28 * s} height={19 * s} rx={1.5} fill="#22272f" />
                        <rect x={cx - 12 * s} y={y - 4 * s} width={24 * s} height={14 * s} fill={i % 2 ? '#4f78a8' : '#5b86b4'} />
                        <rect x={cx - 2 * s} y={y + 13 * s} width={4 * s} height={2 * s} fill="#22272f" />
                        <rect x={cx - 10 * s} y={y + 30 * s} width={20 * s} height={12 * s} rx={3} fill="#2f3a4c" />
                      </g>
                    )
                  })}
                </g>
              )
            })}
          </g>
        </svg>
      </div>
      <figcaption className="mt-2 text-[12px] leading-4 text-muted">
        <span className="font-medium text-ink">{label ?? spec.caption}</span> · {spec.institution} · {spec.year}
      </figcaption>
    </figure>
  )
}

export function PhotoPair({ mine, other, similarity }: { mine: PhotoSpec; other: PhotoSpec; similarity: number }) {
  return (
    <div>
      <p className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-semibold">Same scene in two applications</span>
        <span className="num text-muted">
          Perceptual hash similarity <span className="font-semibold text-ink">{similarity.toFixed(2)}</span>
        </span>
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LabPhoto spec={mine} label={`This application: ${mine.caption}`} />
        <LabPhoto spec={other} label={`Earlier application: ${other.caption}`} />
      </div>
      {other.mirrored && <p className="mt-3 text-[12px] text-muted">The earlier photo is mirrored left to right and colour-shifted; the desk layout and window position still match.</p>}
    </div>
  )
}
