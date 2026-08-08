import {
  AppHeader,
  WorksheetPage,
  ReviewPage,
  ResultsPage,
  useRules,
  ValidationProvider,
} from './features/worksheet'
import { StepFlowProvider, useStepFlow } from './features/navigation'

/** App shell: header + the active step's page. Reads the current step from the flow. */
function AppShell() {
  const { current } = useStepFlow()
  // Load the statute rule set once for the whole flow (the app's only async boundary).
  useRules()
  return (
    <div className="min-h-svh overflow-x-clip bg-bg text-text">
      <AppHeader />
      <main className="max-w-[1240px] mx-auto p-4 sm:p-6 lg:p-8">
        {current === 'review' ? (
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
    // ValidationProvider sits inside StepFlowProvider and outside every step page: all
    // three steps read the estimate, and `useSupportEstimate` is itself a validation
    // consumer, so the context has to span the whole flow rather than the worksheet alone.
    <StepFlowProvider>
      <ValidationProvider>
        <AppShell />
      </ValidationProvider>
    </StepFlowProvider>
  )
}

export default App
