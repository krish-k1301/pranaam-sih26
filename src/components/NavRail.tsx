import { NavLink } from 'react-router-dom'
import { BookCheck, Inbox, ScrollText } from 'lucide-react'

export const NAV = [
  { to: '/', label: 'Queue', icon: Inbox, end: true },
  { to: '/rules', label: 'Rules', icon: BookCheck, end: false },
  { to: '/audit', label: 'Audit log', icon: ScrollText, end: false },
]

export function Mark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="6" fill="#EADFC2" />
      <path d="M9 7h9.5a6 6 0 0 1 0 12H13v6H9z" fill="none" stroke="#16213A" strokeWidth="2.6" strokeLinejoin="round" />
      <circle cx="18" cy="13" r="2.2" fill="#B3261E" />
    </svg>
  )
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex ${compact ? 'items-center gap-2' : 'flex-col items-center gap-1.5'}`}>
      <Mark className={compact ? 'size-7' : 'size-8'} />
      <div className={compact ? '' : 'text-center'}>
        <div className="text-[15px] font-semibold leading-5 text-white">Pramaan</div>
        <div lang="hi" className={`font-deva text-[12px] font-medium leading-4 text-white/70 ${compact ? 'hidden' : ''}`}>
          प्रमाण
        </div>
      </div>
    </div>
  )
}

export function NavRail() {
  return (
    <nav aria-label="Main" className="fixed inset-y-0 left-0 z-30 hidden w-[96px] flex-col items-stretch bg-ink py-5 md:flex">
      <NavLink to="/" className="mx-auto mb-7 rounded-md px-1">
        <Wordmark />
      </NavLink>
      <ul className="flex flex-col gap-1 px-2">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-md py-2.5 text-[12px] leading-4 transition-colors ${
                  isActive ? 'bg-white/12 text-white' : 'text-white/70 hover:bg-white/6 hover:text-white'
                }`
              }
            >
              <Icon size={18} strokeWidth={1.6} aria-hidden />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
      <p className="mt-auto px-4 text-center text-[11px] leading-4 text-white/60">Synthetic data</p>
    </nav>
  )
}

export function BottomBar() {
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 bg-ink pb-[env(safe-area-inset-bottom)] md:hidden">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `flex h-14 flex-col items-center justify-center gap-0.5 text-[12px] ${isActive ? 'text-white' : 'text-white/65'}`}
        >
          {({ isActive }) => (
            <>
              <Icon size={18} strokeWidth={1.6} aria-hidden />
              <span className={isActive ? 'font-medium' : ''}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
