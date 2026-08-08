/**
 * Loads the statute rule set once, on mount.
 *
 * This is the app's only async boundary today. It goes through the repository port,
 * so pointing the app at a remote MCP/RAG source later changes the factory config,
 * not this hook.
 */
import { useEffect } from 'react'
import { useWorksheetStore } from '../store/worksheetStore'

export function useRules() {
  const status = useWorksheetStore((s) => s.status)
  const error = useWorksheetStore((s) => s.error)
  const rules = useWorksheetStore((s) => s.rules)
  const loadRules = useWorksheetStore((s) => s.loadRules)

  useEffect(() => {
    if (status === 'idle') void loadRules()
  }, [status, loadRules])

  return { rules, status, error }
}
