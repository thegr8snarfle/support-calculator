import { useEffect, useState } from 'react'
import { useStepFlow } from '../../navigation'

type Theme = 'light' | 'dark'

/** Top app bar: brand, guided-flow steps, and the light/dark theme toggle. */
export function AppHeader() {
  const [theme, setTheme] = useState<Theme>('light')
  const { current, steps, goTo, canGoTo } = useStepFlow()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <header className="flex items-center gap-4 px-6 py-4 bg-surface border-b border-border">
      <div className="flex items-center gap-3">
        <img
          src="/favicon.svg"
          alt=""
          width={30}
          height={30}
          loading="lazy"
          className="w-[30px] h-[30px]"
        />
        <div className="text-[15px]">
          <span className="text-text-muted text-[13px]">Colorado Support Estimator</span>
        </div>
      </div>

      <div className="flex-1" />

      <nav className="hidden sm:flex items-center gap-2 text-[13px] text-text-subtle" aria-label="Progress">
        {steps.map((step, i) => {
          const active = step.id === current
          // Steps ahead of an unfinished worksheet stay unreachable, so a chip can
          // never open a Review/Results page built from incomplete input.
          const reachable = canGoTo(step.id)
          return (
            <span key={step.id} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true">·</span>}
              <button
                type="button"
                onClick={() => goTo(step.id)}
                disabled={!reachable}
                aria-current={active ? 'step' : undefined}
                title={reachable ? undefined : 'Finish the worksheet first'}
                className={`focus-ring rounded-sm flex items-center gap-2 px-1 py-0.5 cursor-pointer hover:text-text disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:text-text-subtle ${
                  active ? 'text-text font-semibold' : ''
                }`}
              >
                <span
                  className={`w-[7px] h-[7px] rounded-full ${
                    active
                      ? 'bg-primary'
                      : step.status === 'complete'
                        ? 'bg-positive'
                        : 'bg-border-strong'
                  }`}
                />
                {step.label}
              </button>
            </span>
          )
        })}
      </nav>

      <button
        type="button"
        onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        className="focus-ring flex items-center gap-[7px] rounded-pill border border-border px-3 py-[5px] text-[12px] text-text-muted cursor-pointer hover:bg-surface-2"
      >
        <span className="w-[11px] h-[11px] rounded-full bg-primary" />
        <span className="w-[11px] h-[11px] rounded-full bg-accent -ml-1" />
        Theme
      </button>
    </header>
  )
}
