import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { BottomBar, NavRail } from './components/NavRail'
import { Toasts } from './components/Toast'
import Queue from './pages/Queue'
import ApplicationReview from './pages/ApplicationReview'
import Rules from './pages/Rules'
import AuditLog from './pages/AuditLog'
import NotFound from './pages/NotFound'

export default function App() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      <NavRail />
      <div className="pb-16 md:pb-0 md:pl-[96px]">
        <Routes>
          <Route path="/" element={<Queue />} />
          <Route path="/applications/:id" element={<ApplicationReview />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/audit" element={<AuditLog />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <BottomBar />
      <Toasts />
    </div>
  )
}
