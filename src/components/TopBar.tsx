import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, Moon, RotateCcw, Search } from 'lucide-react'
import { ALERTS, BASE_AUDIT } from '../data'
import { useStore } from '../state/DemoStore'
import { fmtDateTime } from '../lib/format'
import { useTitle } from '../lib/hooks'
import { Wordmark } from './NavRail'

/** Closes a popover on an outside click or Escape, and returns focus to its trigger on Escape. */
function usePopover(open: boolean, setOpen: (v: boolean) => void) {
  const wrap = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => wrap.current && !wrap.current.contains(e.target as Node) && setOpen(false)
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener('mousedown', h)
    document.addEventListener('keydown', k)
    return () => {
      document.removeEventListener('mousedown', h)
      document.removeEventListener('keydown', k)
    }
  }, [open, setOpen])
  return { wrap, trigger }
}

export function TopBar({ title }: { title: string }) {
  useTitle(title)
  const { user, signOut, theme, setTheme, reset, reviews, chain, submissions } = useStore()
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const nav = useNavigate()
  const [menu, setMenu] = useState(false)
  const [bell, setBell] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const m = usePopover(menu, setMenu)
  const b = usePopover(bell, setBell)
  useEffect(() => setQ(params.get('q') ?? ''), [params])
  useEffect(() => {
    if (!menu) setConfirmReset(false)
  }, [menu])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    nav(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : '/')
  }
  const reviewed = Object.keys(reviews).length

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-page">
      <div className="flex h-12 items-center gap-3 bg-night px-4 pt-[env(safe-area-inset-top)] md:hidden">
        <Link to="/" aria-label="Pramaan, queue" className="control flex items-center">
          <Wordmark compact />
        </Link>
      </div>
      <div className="flex h-14 items-center gap-3 px-4 md:px-6">
        <h1 className="min-w-0 flex-1 truncate text-[18px] font-semibold leading-6 md:flex-none md:text-[20px]">{title}</h1>
        <form onSubmit={submit} role="search" className="relative ml-auto hidden w-[320px] lg:block">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" aria-hidden />
          <input
            type="search"
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search institution or application ID…"
            aria-label="Search institution or application ID"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            className="h-9 w-full rounded-md border border-control bg-surface pl-9 pr-3 text-[14px] outline-none placeholder:text-faint hover:border-ink-2 focus:border-action focus:ring-2 focus:ring-action/25"
          />
        </form>
        <div ref={b.wrap} className="relative">
          <button
            ref={b.trigger}
            onClick={() => setBell(!bell)}
            aria-expanded={bell}
            aria-controls="alerts-popover"
            aria-label={`Alerts, ${ALERTS.length} new`}
            className="relative flex size-9 items-center justify-center rounded-md text-ink-2 hover:bg-active hover:text-ink"
          >
            <Bell size={18} strokeWidth={1.7} aria-hidden />
            <span aria-hidden className="num absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-stamp px-1 text-center text-[11px] font-semibold leading-[18px] text-white">
              {ALERTS.length}
            </span>
          </button>
          {bell && (
            <div id="alerts-popover" className="absolute right-0 top-11 z-30 w-[min(360px,calc(100vw-32px))] rounded-lg bg-surface py-2 shadow-[0_12px_32px_rgb(22_33_58/0.18)] border border-line">
              <p className="px-4 pb-2 pt-1 text-[12px] text-muted">Latest automated alerts</p>
              <ul className="max-h-[340px] overflow-y-auto overscroll-contain">
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
              <Link to="/" onClick={() => setBell(false)} className="mx-4 mt-1 block border-t border-rule pt-2 text-[13px] font-medium text-link hover:underline">
                See every alert in the queue
              </Link>
            </div>
          )}
        </div>
        <div ref={m.wrap} className="relative">
          <button
            ref={m.trigger}
            onClick={() => setMenu(!menu)}
            aria-expanded={menu}
            aria-controls="user-popover"
            className="flex h-10 items-center gap-2 rounded-md px-1.5 text-left hover:bg-active"
          >
            <span aria-hidden className="flex size-8 items-center justify-center rounded-full bg-tint-action text-[12px] font-semibold text-link">
              {user?.initials}
            </span>
            <span className="hidden leading-4 sm:block">
              <span className="block text-[13px] font-medium">{user?.name}</span>
              <span className="block text-[12px] text-muted">{user?.detail}</span>
            </span>
            <span className="sr-only">, account & role</span>
            <ChevronDown size={15} className="text-muted" aria-hidden />
          </button>
          {menu && (
            <div id="user-popover" className="absolute right-0 top-12 z-30 w-[288px] rounded-lg bg-surface p-2 shadow-[0_12px_32px_rgb(22_33_58/0.18)] border border-line">
              <p className="px-2 pb-2 pt-1 text-[12px] leading-4 text-muted">
                Signed in as <span className="font-medium text-ink">{user?.name}</span>
                <br />
                {user?.detail}
              </p>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-pressed={theme === 'dark'}
                className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-raised"
              >
                <span className="flex items-center gap-2">
                  <Moon size={15} className="text-muted" aria-hidden />
                  Dark appearance
                </span>
                <span className="text-[12px] text-muted">{theme === 'dark' ? 'On' : 'Off'}</span>
              </button>
              <div className="my-2 border-t border-rule" />
              {!confirmReset ? (
                <button onClick={() => setConfirmReset(true)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-raised">
                  <RotateCcw size={15} className="text-muted" aria-hidden />
                  Reset demo data…
                </button>
              ) : (
                <div className="rounded-md bg-raised p-2.5" role="group" aria-label="Confirm reset">
                  <p className="text-[13px] leading-5">
                    This clears {reviewed} {reviewed === 1 ? 'review' : 'reviews'}, {submissions.length} portal {submissions.length === 1 ? 'submission' : 'submissions'}, any rule drafts & {Math.max(0, chain.length - BASE_AUDIT.length)} audit entries made in this browser.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      autoFocus
                      onClick={() => {
                        reset()
                        setMenu(false)
                      }}
                      className="h-8 rounded-md bg-ink px-3 text-[13px] font-medium text-surface hover:bg-ink-2"
                    >
                      Reset demo data
                    </button>
                    <button onClick={() => setConfirmReset(false)} className="h-8 rounded-md border border-control bg-surface px-3 text-[13px] font-medium hover:border-ink-2 hover:bg-page">
                      Keep my changes
                    </button>
                  </div>
                </div>
              )}
              <div className="my-2 border-t border-rule" />
              <button
                onClick={() => {
                  signOut()
                  nav('/login', { replace: true })
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-raised"
              >
                <LogOut size={15} className="text-muted" aria-hidden />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
