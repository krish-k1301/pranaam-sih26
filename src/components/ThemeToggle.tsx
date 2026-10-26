import { Moon, Sun } from 'lucide-react'
import { useStore } from '../state/DemoStore'

/** A quiet icon button: no label on screen, a full accessible name and a tooltip. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useStore()
  const next = theme === 'dark' ? 'light' : 'dark'
  const label = `Switch to ${next} appearance`
  return (
    <button onClick={() => setTheme(next)} aria-label={label} title={label} className={`flex size-8 items-center justify-center rounded-md transition-colors ${className}`}>
      {theme === 'dark' ? <Sun size={15} strokeWidth={1.7} aria-hidden /> : <Moon size={15} strokeWidth={1.7} aria-hidden />}
    </button>
  )
}
