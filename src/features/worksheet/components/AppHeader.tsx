import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

type Step = { label: string; active?: boolean }

const steps: Step[] = [
  { label: 'Worksheet', active: true },
  { label: 'Review' },
  { label: 'Results' },
]

/** Top app bar: brand, guided-flow steps, and the light/dark theme toggle. */
export function AppHeader() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <header className="flex items-center gap-4 px-6 py-4 bg-surface border-b border-border">
      <div className="flex items-center gap-3">
        <div className="grid place-items-center w-[30px] h-[30px] rounded-[9px] bg-linear-[150deg,var(--primary),var(--accent)] text-white font-display font-bold shadow-sm">
          C
        </div>
        <div className="text-[15px]">
          <b className="font-display font-bold tracking-[-0.01em]">Columbine</b>{' '}
          <span className="text-text-muted text-[13px]">Colorado Support Estimator</span>
        </div>
      </div>

      <div className="flex-1" />

      <nav className="hidden sm:flex items-center gap-2 text-[13px] text-text-subtle">
        {steps.map((step, i) => (
          <span key={step.label} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">·</span>}
            <span className={step.active ? 'flex items-center gap-2 text-text font-semibold' : 'flex items-center gap-2'}>
              <span
                className={`w-[7px] h-[7px] rounded-full ${step.active ? 'bg-primary' : 'bg-border-strong'}`}
              />
              {step.label}
            </span>
          </span>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        className="focus-ring flex items-center gap-[7px] rounded-pill border border-border px-3 py-[5px] text-[12px] text-text-muted cursor-pointer hover:bg-surface-2"
      >
        <span className="w-[11px] h-[11px] rounded-full bg-primary" />
        <span className="w-[11px] h-[11px] rounded-full bg-accent -ml-1" />
        Columbine
      </button>
    </header>
  )
}
