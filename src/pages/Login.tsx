import { useId, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { ACCOUNTS, homeFor, type Account } from '../data/accounts'
import { Mark } from '../components/NavRail'
import { ThemeToggle } from '../components/ThemeToggle'
import { useStore } from '../state/DemoStore'
import { useTitle } from '../lib/hooks'

/** Who can go where. Officers & administrators work the queue; institutions file applications. */
const POWERS: { power: Account['power']; does: string }[] = [
  { power: 'Scrutiny officer', does: 'Reviews findings & decides on applications' },
  { power: 'Rule administrator', does: 'Drafts & publishes APH rules' },
  { power: 'Institution', does: 'Files an application & uploads documents' },
]

function Sheets() {
  // A stack of three file sheets, the product's own object, drawn in the palette.
  return (
    <svg viewBox="0 0 320 220" className="w-full max-w-[340px]" aria-hidden>
      <g transform="rotate(-7 160 110)">
        <rect x="70" y="26" width="170" height="190" rx="3" fill="#d9cba6" />
      </g>
      <g transform="rotate(4 160 110)">
        <rect x="78" y="18" width="170" height="190" rx="3" fill="#e2d6b5" />
      </g>
      <rect x="84" y="12" width="170" height="196" rx="3" fill="#eadfc2" />
      <circle cx="108" cy="38" r="11" fill="none" stroke="#2a2418" strokeWidth="1.6" />
      <rect x="126" y="31" width="92" height="6" rx="1" fill="#2a2418" opacity=".8" />
      <rect x="126" y="42" width="60" height="4" rx="1" fill="#2a2418" opacity=".45" />
      <rect x="98" y="58" width="142" height="1.5" fill="#2a2418" opacity=".5" />
      {[74, 86, 98, 110, 122, 134, 146].map((y, i) => (
        <rect key={y} x="98" y={y} width={i % 3 === 2 ? 96 : 142} height="4" rx="1" fill="#2a2418" opacity=".28" />
      ))}
      <rect x="94" y="152" width="152" height="16" rx="2" fill="none" stroke="#2a4bb8" strokeWidth="2.2" />
      <rect x="94" y="142" width="52" height="11" rx="2" fill="#2a4bb8" />
      <text x="99" y="150.5" fontSize="7.5" fill="#fff" fontFamily="IBM Plex Sans, sans-serif">
        valid_until
      </text>
      <rect x="100" y="158" width="64" height="4" rx="1" fill="#2a2418" opacity=".5" />
      <circle cx="222" cy="188" r="13" fill="none" stroke="#3d4f99" strokeWidth="1.4" opacity=".6" />
    </svg>
  )
}

export default function Login() {
  useTitle('Sign in')
  const { user, signIn } = useStore()
  const nav = useNavigate()
  const loc = useLocation()
  const next = new URLSearchParams(loc.search).get('next')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const userRef = useRef<HTMLInputElement>(null)
  const passRef = useRef<HTMLInputElement>(null)
  const id = useId()

  if (user) return <Navigate to={homeFor(user.power)} replace />

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) {
      setError('Enter your username.')
      userRef.current?.focus()
      return
    }
    if (!password) {
      setError('Enter your password.')
      passRef.current?.focus()
      return
    }
    const acc = signIn(username, password)
    if (!acc) {
      setError('That username and password do not match. Check both, or use one of the demo accounts below.')
      passRef.current?.select()
      return
    }
    const home = homeFor(acc.power)
    // Only follow ?next= when it belongs to the area this account may use.
    const allowed = next && (acc.power === 'Institution' ? next.startsWith('/institute') : !next.startsWith('/institute')) ? next : home
    nav(allowed, { replace: true })
  }

  const fill = (a: Account) => {
    setUsername(a.username)
    setPassword(a.password)
    setError('')
    passRef.current?.focus()
  }

  return (
    <div className="grid min-h-dvh grid-cols-1 bg-page lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="relative hidden flex-col justify-between bg-night px-12 py-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <Mark className="size-9" />
          <div>
            <div translate="no" className="text-[17px] font-semibold leading-5">
              Pramaan
            </div>
            <div lang="hi" translate="no" className="font-deva text-[13px] leading-4 text-white/70">
              प्रमाण
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start gap-8">
          <Sheets />
          <div className="max-w-[440px]">
            <p className="text-[26px] font-semibold leading-[34px]">Every approval decision, backed by its evidence.</p>
            <p className="mt-3 text-[15px] leading-[22px] text-white/75">
              Decision support for AICTE scrutiny of extension-of-approval applications: documents checked against records, issuers & the Approval Process Handbook. Officers decide.
            </p>
          </div>
        </div>
        <p className="text-[12px] text-white/60">Prototype for SIH26261 · All data is synthetic</p>
      </section>

      <section className="flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="flex items-center gap-2.5 lg:hidden">
            <Mark className="size-8" />
            <span translate="no" className="text-[16px] font-semibold">
              Pramaan
            </span>
          </div>
          <ThemeToggle className="text-muted hover:bg-active hover:text-ink" />
        </div>

        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">
          <h1 className="text-[24px] font-semibold leading-8">Sign in</h1>
          <p className="mt-1 text-muted">Your account decides where you land: the scrutiny queue, or your institution’s application.</p>

          <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-4">
            <div>
              <label htmlFor={`${id}-u`} className="block font-medium">
                Username
              </label>
              <input
                id={`${id}-u`}
                ref={userRef}
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ksharma…"
                aria-invalid={Boolean(error) && !username.trim()}
                aria-describedby={error ? `${id}-e` : undefined}
                className="mt-2 h-10 w-full rounded-md border border-control bg-surface px-3 text-[15px] outline-none placeholder:text-faint hover:border-ink-2 focus:border-action focus:ring-2 focus:ring-action/25"
              />
            </div>
            <div>
              <label htmlFor={`${id}-p`} className="block font-medium">
                Password
              </label>
              <div className="relative mt-2">
                <input
                  id={`${id}-p`}
                  ref={passRef}
                  name="password"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(error) && Boolean(username.trim())}
                  aria-describedby={error ? `${id}-e` : undefined}
                  className="h-10 w-full rounded-md border border-control bg-surface pl-3 pr-11 text-[15px] outline-none hover:border-ink-2 focus:border-action focus:ring-2 focus:ring-action/25"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                  aria-pressed={show}
                  className="inline-control absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded text-muted hover:text-ink"
                >
                  {show ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
                </button>
              </div>
            </div>
            <p id={`${id}-e`} aria-live="polite" className={`min-h-5 text-[13px] leading-5 ${error ? 'text-stamp' : ''}`}>
              {error}
            </p>
            <button type="submit" className="flex h-10 items-center justify-center gap-2 rounded-md bg-action font-medium text-white hover:bg-action-dark active:translate-y-px">
              Sign in
              <ArrowRight size={16} aria-hidden />
            </button>
          </form>

          <section aria-labelledby={`${id}-demo`} className="mt-8">
            <h2 id={`${id}-demo`} className="text-[13px] font-medium">
              Demo accounts
            </h2>
            <p className="mt-0.5 text-[13px] text-muted">Choose one to fill the form, then sign in.</p>
            <ul className="mt-3 overflow-hidden rounded-lg border border-line bg-surface">
              {ACCOUNTS.map((a) => {
                const p = POWERS.find((x) => x.power === a.power)!
                return (
                  <li key={a.username} className="border-b border-rule last:border-0">
                    <button type="button" onClick={() => fill(a)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left hover:bg-raised">
                      <span aria-hidden className="flex size-8 flex-none items-center justify-center rounded-full bg-tint-action text-[12px] font-semibold text-link">
                        {a.initials}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium leading-5">{a.power}</span>
                        <span className="block text-[12px] leading-4 text-muted">{p.does}</span>
                      </span>
                      <span translate="no" className="flex-none text-right font-mono text-[12px] leading-4 text-muted">
                        {a.username}
                        <br />
                        {a.password}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </section>
    </div>
  )
}
