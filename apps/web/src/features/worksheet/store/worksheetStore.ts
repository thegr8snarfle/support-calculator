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
import {
  defaultPreferencesRepository,
  type PreferencesRepository,
} from '../../../services/preferences'
import { DEFAULT_INPUT } from '../../../mocks/supportFixtures'

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
  setAddOnPayer: (lineId: string, party?: Party) => void
  reset: (to?: WorksheetInput) => void
  loadRules: (repo?: RulesRepository, jurisdiction?: string) => Promise<void>
}

/**
 * Overlay a saved parent-name preference onto a worksheet input.
 *
 * Reads the preferences **repository** directly, not the `preferencesStore` Zustand store —
 * that would couple this store to another feature's store; the repository is the same
 * app-level port `loadRules` already reads through (`services/rules`). A saved name wins only
 * when non-blank, so a fresh install with nothing saved yet still shows the seeded demo names.
 * Exported as a pure function so it's testable with a fake repository, independent of the
 * live singleton's module-init timing.
 *
 * @param input - The worksheet input to overlay names onto.
 * @param repo - The preferences repository to read from; defaults to the app singleton.
 */
export function applySavedParentNames(
  input: WorksheetInput,
  repo: PreferencesRepository = defaultPreferencesRepository,
): WorksheetInput {
  const saved = repo.load().parentNames
  return {
    ...input,
    parties: {
      a: { name: saved.a || input.parties.a.name },
      b: { name: saved.b || input.parties.b.name },
    },
  }
}

/** Seeded with the example worksheet so the app has something to show immediately. */
const INITIAL_INPUT: WorksheetInput = applySavedParentNames(structuredClone(DEFAULT_INPUT))

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

  /** Set one shared-cost amount, preserving any attribution already on the line. */
  setAddOn: (lineId, amount) =>
    set((s) => {
      const entry = s.input.addOns[lineId]
      return {
        input: {
          ...s.input,
          addOns: { ...s.input.addOns, [lineId]: { ...entry, amount } },
        },
      }
    }),

  /**
   * Record which parent carries a shared-cost line in full.
   *
   * @param lineId - `AddOnLineSpec.id` from the rule set.
   * @param party - The carrying parent. **Omit to clear** the attribution back to shared;
   *   the key is deleted rather than set to `undefined` so the stored object matches the
   *   optional-property type exactly and never serialises a dangling `paidBy` key.
   */
  setAddOnPayer: (lineId, party) =>
    set((s) => {
      const entry = s.input.addOns[lineId] ?? { amount: 0 }
      const next = { ...entry, paidBy: party }
      if (party === undefined) delete next.paidBy
      return { input: { ...s.input, addOns: { ...s.input.addOns, [lineId]: next } } }
    }),

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
