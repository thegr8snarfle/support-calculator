import { AppHeader, WorksheetPage, ReviewPage, ResultsPage } from './features/worksheet'
import { StepFlowProvider, useStepFlow } from './features/navigation'

/** App shell: header + the active step's page. Reads the current step from the flow. */
function AppShell() {
  const { current } = useStepFlow()
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
    <StepFlowProvider>
      <AppShell />
    </StepFlowProvider>
  )
}

export default App
