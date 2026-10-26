import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import type { AppDocument } from '../lib/types'
import { fmtBytes, getFile } from '../lib/files'

/** Shows a file an institution uploaded: images and PDFs inline, anything else as a file card. */
export function UploadedFile({ doc }: { doc: AppDocument }) {
  const [url, setUrl] = useState<string | null>(null)
  const [missing, setMissing] = useState(false)
  useEffect(() => {
    let live = true
    let made: string | null = null
    getFile(doc.id).then((blob) => {
      if (!live) return
      if (!blob) return setMissing(true)
      made = URL.createObjectURL(blob)
      setUrl(made)
    })
    return () => {
      live = false
      if (made) URL.revokeObjectURL(made)
    }
  }, [doc.id])

  const u = doc.upload!
  const card = (
    <div className="flex items-center gap-3 rounded-md bg-white/6 px-4 py-3">
      <FileText size={20} className="flex-none text-white/70" aria-hidden />
      <div className="min-w-0 text-[13px] leading-[18px]">
        <p className="truncate font-medium text-white">{u.name}</p>
        <p className="text-white/70">
          {u.mime || 'Unknown type'} · {fmtBytes(u.size)}
        </p>
        {missing && <p className="mt-1 text-white/70">The file is stored in the browser it was uploaded from, so it cannot be previewed here.</p>}
      </div>
    </div>
  )
  if (!url) return card
  if (u.mime.startsWith('image/')) {
    return (
      <figure className="m-0">
        <img src={url} alt={`${doc.typeLabel} uploaded by the institution`} className="mx-auto max-h-[70vh] w-auto max-w-full rounded-[3px]" />
        <figcaption className="mt-2 text-[12px] text-white/70">
          {u.name} · {fmtBytes(u.size)}
        </figcaption>
      </figure>
    )
  }
  if (u.mime === 'application/pdf') {
    return (
      <div className="flex flex-col gap-3">
        <iframe src={url} title={`${doc.typeLabel}, uploaded PDF`} className="h-[72vh] w-full rounded-[3px] bg-white" />
        {card}
      </div>
    )
  }
  return card
}
