import { useState } from 'react'
import {
  AppHeader,
  WorksheetPage,
  ReviewPage,
  ResultsPage,
  useRules,
  ValidationProvider,
} from './features/worksheet'
import { StepFlowProvider, useStepFlow } from './features/navigation'
import { ThemeProvider } from './features/preferences'
import { StatuteDocumentsPage } from './features/statutes'

/** Which top-level screen is showing — separate from `StepFlowState`, which only
 *  knows about the linear worksheet/review/results progression. The statute library
 *  is a non-linear escape hatch from that flow, not a fourth step in it. */
type AppView = 'flow' | 'statutes'

/** App shell: header + the active screen. Reads the current step from the flow. */
function AppShell() {
  const { current } = useStepFlow()
  const [view, setView] = useState<AppView>('flow')
  // Load the statute rule set once for the whole flow (the app's only async boundary).
  useRules()
  return (
    <div className="min-h-svh overflow-x-clip bg-bg text-text">
      <AppHeader onOpenStatutes={() => setView('statutes')} />
      <main className="max-w-[1240px] mx-auto p-4 sm:p-6 lg:p-8">
        {view === 'statutes' ? (
          <StatuteDocumentsPage onBack={() => setView('flow')} />
        ) : current === 'review' ? (
          <ReviewPage />
        ) : current === 'results' ? (
          <ResultsPage />
        ) : (
          <WorksheetPage />
        )}
      </main>
    </div>
  )
}

function App() {
  return (
    // ThemeProvider is outermost because the theme is app-wide chrome, not flow state — the
    // header's toggle lives above the steps, and nothing about the theme depends on where
    // the user is in the worksheet.
    <ThemeProvider>
      {/*
        ValidationProvider sits inside StepFlowProvider and outside every step page: all
        three steps read the estimate, and `useSupportEstimate` is itself a validation
        consumer, so the context has to span the whole flow rather than the worksheet alone.
      */}
      <StepFlowProvider>
        <ValidationProvider>
          <AppShell />
        </ValidationProvider>
      </StepFlowProvider>
    </ThemeProvider>
  )
}

export default App
