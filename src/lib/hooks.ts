import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input:not([type="hidden"]), select, [tabindex]:not([tabindex="-1"])'

/**
 * Modal behaviour per the WAI-ARIA dialog pattern: focus moves in, Tab stays inside,
 * Escape closes, and focus returns to whatever opened it.
 */
export function useDialog<T extends HTMLElement>(onClose: () => void, initial?: React.RefObject<HTMLElement | null>) {
  const ref = useRef<T>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const first = initial?.current ?? ref.current?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        close.current()
      }
      if (e.key !== 'Tab' || !ref.current) return
      const els = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null)
      if (!els.length) return
      const a = els[0]
      const z = els[els.length - 1]
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault()
        z.focus()
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault()
        a.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      opener?.focus()
    }
  }, [initial])
  return ref
}

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title === 'Pramaan' ? 'Pramaan' : `${title} · Pramaan`
  }, [title])
}

/** Back and Forward return to the earlier scroll position; new navigations start at the top. */
export function useScrollRestoration() {
  const { key, pathname } = useLocation()
  const type = useNavigationType()
  const prevKey = useRef(key)
  useEffect(() => {
    try {
      history.scrollRestoration = 'manual'
    } catch {
      /* not supported */
    }
  }, [])
  // Record the position as the reader scrolls: by the time a route changes, the new page has already
  // replaced the old one and the browser has clamped scrollY to it.
  useEffect(() => {
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        try {
          sessionStorage.setItem(`scroll:${prevKey.current}`, String(window.scrollY))
        } catch {
          /* storage unavailable */
        }
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])
  const prevPath = useRef(pathname)
  useLayoutEffect(() => {
    const samePage = prevPath.current === pathname
    prevPath.current = pathname
    prevKey.current = key
    if (samePage && type !== 'POP') return
    let y = 0
    if (type === 'POP') {
      try {
        y = Number(sessionStorage.getItem(`scroll:${key}`) ?? 0)
      } catch {
        y = 0
      }
    }
    // Content can arrive a moment later (the audit chain seals asynchronously), so keep trying briefly.
    let tries = 0
    const restore = () => {
      window.scrollTo(0, y)
      if (Math.abs(window.scrollY - y) > 2 && tries++ < 60) requestAnimationFrame(restore)
    }
    requestAnimationFrame(restore)
  }, [pathname, key, type])
}
