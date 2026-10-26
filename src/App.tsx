import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useScrollRestoration } from './lib/hooks'
import { homeFor, type Power } from './data/accounts'
import { useStore } from './state/DemoStore'
import { BottomBar, NavRail } from './components/NavRail'
import { Toasts } from './components/Toast'
import Login from './pages/Login'
import Queue from './pages/Queue'
import ApplicationReview from './pages/ApplicationReview'
import Rules from './pages/Rules'
import AuditLog from './pages/AuditLog'
import InstitutePortal from './pages/InstitutePortal'
import NotFound from './pages/NotFound'

/** Sends signed-out visitors to sign in, and each account to the area its power allows. */
function Guard({ allow, children }: { allow: Power[]; children: ReactNode }) {
  const { user } = useStore()
  const loc = useLocation()
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />
  if (!allow.includes(user.power)) return <Navigate to={homeFor(user.power)} replace />
  return <>{children}</>
}

const STAFF: Power[] = ['Scrutiny officer', 'Rule administrator']

function OfficerShell({ children }: { children: ReactNode }) {
  return (
    <Guard allow={STAFF}>
      <NavRail />
      <div className="pb-16 md:pb-0 md:pl-[96px]">{children}</div>
      <BottomBar />
    </Guard>
  )
}

export default function App() {
  useScrollRestoration()
  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/institute"
          element={
            <Guard allow={['Institution']}>
              <InstitutePortal />
            </Guard>
          }
        />
        <Route path="/" element={<OfficerShell><Queue /></OfficerShell>} />
        <Route path="/applications/:id" element={<OfficerShell><ApplicationReview /></OfficerShell>} />
        <Route path="/rules" element={<OfficerShell><Rules /></OfficerShell>} />
        <Route path="/audit" element={<OfficerShell><AuditLog /></OfficerShell>} />
        <Route path="*" element={<OfficerShell><NotFound /></OfficerShell>} />
      </Routes>
      <Toasts />
    </div>
  )
}
