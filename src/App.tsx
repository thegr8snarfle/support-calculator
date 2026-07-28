import { AppHeader } from './components/worksheet/AppHeader'
import { WorksheetPage } from './components/worksheet/WorksheetPage'

function App() {
  return (
    <div className="min-h-svh bg-bg text-text">
      <AppHeader />
      <main className="max-w-[1240px] mx-auto p-6 lg:p-8">
        <WorksheetPage />
      </main>
    </div>
  )
}

export default App
