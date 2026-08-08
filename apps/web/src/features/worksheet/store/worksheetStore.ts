/**
 * Worksheet state (Zustand).
 *
 * Holds the user's input plus the loaded rule set, and nothing else — no derived
 * figures. The estimate is computed by the pure engine in `useSupportEstimate`, so
 * there is exactly one place where state and calculation meet and no cached totals
 * can go stale.
 *
 * `loadRules` takes the repository as an argument (defaulting to the app singleton)
 * so tests inject a fake without module mocking, keeping the API-layer seam explicit.
 */
import { create } from 'zustand'
import type { Party } from '../../../types/common'
import type { SupportRuleSet } from '../../../types/rules'
import type { WorksheetInput } from '../../../types/support'
import {
  DEFAULT_JURISDICTION,
  defaultRulesRepository,
  type RulesRepository,
} from '../../../services/rules'
import { SAMPLE_WORKSHEET } from '../../../mocks/supportFixtures'

export type RulesStatus = 'idle' | 'loading' | 'ready' | 'error'

export type WorksheetState = {
  input: WorksheetInput
  rules: SupportRuleSet | null
  status: RulesStatus
  error: string | null

  setPartyName: (party: Party, name: string) => void
  setChildrenCount: (count: number) => void
  setIncome: (lineId: string, party: Party, amount: number) => void
  setNights: (party: Party, nights: number) => void
  setAddOn: (lineId: string, amount: number) => void
  reset: (to?: WorksheetInput) => void
  loadRules: (repo?: RulesRepository, jurisdiction?: string) => Promise<void>
}

/** Seeded with the example worksheet so the app has something to show immediately. */
const INITIAL_INPUT: WorksheetInput = structuredClone(SAMPLE_WORKSHEET)

export const useWorksheetStore = create<WorksheetState>((set, get) => ({
  input: INITIAL_INPUT,
  rules: null,
  status: 'idle',
  error: null,

  setPartyName: (party, name) =>
    set((s) => ({
      input: { ...s.input, parties: { ...s.input.parties, [party]: { name } } },
    })),

  setChildrenCount: (count) =>
    set((s) => ({ input: { ...s.input, childrenCount: Math.max(0, count) } })),

  setIncome: (lineId, party, amount) =>
    set((s) => {
      const line = s.input.income[lineId] ?? { a: 0, b: 0 }
      return {
        input: {
          ...s.input,
          income: { ...s.input.income, [lineId]: { ...line, [party]: amount } },
        },
      }
    }),

  /**
   * Record one parent's overnights **exactly as entered** — deliberately unclamped.
   *
   * An out-of-range count (900, or 365 opposite another 365) is kept so
   * `validateWorksheet` can see it and the UI can point at it. Clamping here would make the
   * field and the store silently disagree, which is the bug this replaced: the user sees
   * 900, the estimate is computed from 365, and nothing says so. Non-finite values are
   * still rejected — those are a parse artifact, not something the user can see or fix.
   */
  setNights: (party, nights) =>
    set((s) => ({
      input: {
        ...s.input,
        parentingTime: {
          ...s.input.parentingTime,
          [party]: Number.isFinite(nights) ? nights : 0,
        },
      },
    })),

  setAddOn: (lineId, amount) =>
    set((s) => ({
      input: { ...s.input, addOns: { ...s.input.addOns, [lineId]: amount } },
    })),

  reset: (to = INITIAL_INPUT) => set({ input: structuredClone(to) }),

  loadRules: async (
    repo: RulesRepository = defaultRulesRepository,
    jurisdiction: string = DEFAULT_JURISDICTION,
  ) => {
    if (get().status === 'loading') return
    set({ status: 'loading', error: null })
    try {
      const rules = await repo.getRuleSet({ jurisdiction })
      set({ rules, status: 'ready', error: null })
    } catch (err) {
      set({
        rules: null,
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to load support rules.',
      })
    }
  },
}))
