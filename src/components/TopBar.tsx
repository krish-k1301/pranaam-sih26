import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Bell, ChevronDown, RotateCcw, Search } from 'lucide-react'
import { ALERTS } from '../data'
import { OFFICER, useStore } from '../state/DemoStore'
import type { Role } from '../lib/types'
import { fmtDateTime } from '../lib/format'
import { Wordmark } from './NavRail'

function useOutside(ref: React.RefObject<HTMLElement | null>, onOut: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onOut()
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onOut()
    document.addEventListener('mousedown', h)
    document.addEventListener('keydown', k)
    return () => {
      document.removeEventListener('mousedown', h)
      document.removeEventListener('keydown', k)
    }
  }, [ref, onOut, active])
}

export function TopBar({ title }: { title: string }) {
  const { role, setRole, reset } = useStore()
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const nav = useNavigate()
  const [menu, setMenu] = useState(false)
  const [bell, setBell] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLDivElement>(null)
  useOutside(menuRef, () => setMenu(false), menu)
  useOutside(bellRef, () => setBell(false), bell)
  useEffect(() => setQ(params.get('q') ?? ''), [params])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    nav(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : '/')
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-page">
      <div className="flex h-12 items-center gap-3 bg-ink px-4 md:hidden">
        <Link to="/" aria-label="Pramaan, queue">
          <Wordmark compact />
        </Link>
      </div>
      <div className="flex h-14 items-center gap-3 px-4 md:px-6">
        <h1 className="min-w-0 flex-1 truncate text-[18px] font-semibold leading-6 md:flex-none md:text-[20px]">{title}</h1>
        <form onSubmit={submit} role="search" className="relative ml-auto hidden w-[320px] lg:block">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search institution or application ID"
            aria-label="Search institution or application ID"
            className="h-9 w-full rounded-md border border-control bg-surface pl-9 pr-3 text-[14px] outline-none placeholder:text-faint focus:border-action focus:ring-2 focus:ring-action/25"
          />
        </form>
        <div ref={bellRef} className="relative lg:ml-0">
          <button
            onClick={() => setBell((b) => !b)}
            aria-expanded={bell}
            aria-label={`Alerts, ${ALERTS.length} new`}
            className="relative flex size-9 items-center justify-center rounded-md text-ink-2 hover:bg-active"
          >
            <Bell size={18} strokeWidth={1.7} />
            <span className="num absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-stamp px-1 text-center text-[11px] font-semibold leading-[18px] text-white">{ALERTS.length}</span>
          </button>
          {bell && (
            <div className="absolute right-0 top-11 z-30 w-[min(360px,calc(100vw-32px))] rounded-lg bg-surface py-2 shadow-[0_12px_32px_rgb(22_33_58/0.18)] border border-line">
              <p className="px-4 pb-2 pt-1 text-[12px] text-muted">Latest automated alerts</p>
              <ul className="max-h-[340px] overflow-y-auto">
                {ALERTS.slice(0, 8).map((a) => (
                  <li key={a.id}>
                    <Link to={`/applications/${a.appId}`} onClick={() => setBell(false)} className="block px-4 py-2 hover:bg-raised">
                      <span className="block text-[12px] text-muted">
                        {a.type} · {fmtDateTime(a.at)}
                      </span>
                      <span className="block truncate">{a.text}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div ref={menuRef} className="relative">
          <button onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-haspopup="menu" className="flex h-10 items-center gap-2 rounded-md px-1.5 text-left hover:bg-active">
            <span aria-hidden className="flex size-8 items-center justify-center rounded-full bg-[#dfe5f6] text-[12px] font-semibold text-action-dark">
              KS
            </span>
            <span className="hidden leading-4 sm:block">
              <span className="block text-[13px] font-medium">{OFFICER}</span>
              <span className="block text-[12px] text-muted">{role === 'Scrutiny officer' ? 'Scrutiny officer, Western region' : 'Rule administrator'}</span>
            </span>
            <ChevronDown size={15} className="text-muted" aria-hidden />
          </button>
          {menu && (
            <div role="menu" className="absolute right-0 top-12 z-30 w-[280px] rounded-lg bg-surface p-2 shadow-[0_12px_32px_rgb(22_33_58/0.18)] border border-line">
              <p className="px-2 pb-1 pt-1 text-[12px] text-muted">Act as</p>
              {(['Scrutiny officer', 'Rule administrator'] as Role[]).map((r) => (
                <button
                  key={r}
                  role="menuitemradio"
                  aria-checked={role === r}
                  onClick={() => {
                    setRole(r)
                    setMenu(false)
                  }}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-raised ${role === r ? 'font-medium' : ''}`}
                >
                  {r}
                  {role === r && <span className="size-2 rounded-full bg-action" aria-hidden />}
                </button>
              ))}
              <div className="my-2 border-t border-rule" />
              <button
                role="menuitem"
                onClick={() => {
                  reset()
                  setMenu(false)
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-raised"
              >
                <RotateCcw size={15} className="text-muted" aria-hidden />
                Reset demo data
              </button>
              <p className="px-2 pb-1 pt-1 text-[12px] leading-4 text-muted">Clears reviews, rule drafts and audit entries made in this browser.</p>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
