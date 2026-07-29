import { useEffect, useState } from 'react'
import { useStepFlow } from '../../navigation'

type Theme = 'light' | 'dark'

/** Top app bar: brand, guided-flow steps, and the light/dark theme toggle. */
export function AppHeader() {
  const [theme, setTheme] = useState<Theme>('light')
  const { current, steps, goTo } = useStepFlow()

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

      <nav className="hidden sm:flex items-center gap-2 text-[13px] text-text-subtle" aria-label="Progress">
        {steps.map((step, i) => {
          const active = step.id === current
          return (
            <span key={step.id} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true">·</span>}
              <button
                type="button"
                onClick={() => goTo(step.id)}
                aria-current={active ? 'step' : undefined}
                className={`focus-ring rounded-sm flex items-center gap-2 px-1 py-0.5 cursor-pointer hover:text-text ${
                  active ? 'text-text font-semibold' : ''
                }`}
              >
                <span
                  className={`w-[7px] h-[7px] rounded-full ${active ? 'bg-primary' : 'bg-border-strong'}`}
                />
                {step.label}
              </button>
            </span>
          )
        })}
        {/* Results has no page yet — shown as a disabled, non-navigable step. */}
        <span className="flex items-center gap-2">
          <span aria-hidden="true">·</span>
          <span
            aria-disabled="true"
            className="flex items-center gap-2 px-1 py-0.5 opacity-60 cursor-not-allowed"
          >
            <span className="w-[7px] h-[7px] rounded-full bg-border-strong" />
            Results
          </span>
        </span>
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
