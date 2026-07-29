import type { ReactNode } from 'react'
import { Card } from '../../../components/ui/Card'
import { FieldRow } from '../../../components/ui/FieldRow'
import { PartyHeader } from '../../../components/ui/PartyHeader'
import { Button } from '../../../components/ui/Button'
import { ParentingTimeBar } from './ParentingTimeBar'
import { WORKSHEET_SECTIONS } from '../sections'
import { useStepFlow } from '../../navigation'

const PARENT_A = 'Taylor'
const PARENT_B = 'Blake'

/**
 * The Review step of the guided flow (Worksheet → Review → Results). A read-only,
 * grouped recap of everything the worksheet collects, so the user can confirm the
 * inputs before seeing full results. Values are still static (no calculation); each
 * "Edit" jumps back to that worksheet section, and "See full results" awaits the
 * Results step. See mockups/src/worksheet.html for the source data.
 */
export function ReviewPage() {
  const { back, goTo } = useStepFlow()
  return (
    <div className="max-w-[720px]">
      <div className="mb-6">
        <div className="text-[12px] font-semibold tracking-[0.09em] uppercase text-accent-strong">
          Child Support · Review
        </div>
        <h1 className="font-display font-bold text-[32px] tracking-[-0.02em] my-1.5">
          Review your worksheet.
        </h1>
        <p className="text-text-muted max-w-[56ch] m-0">
          Check each section before you see the full results. Anything can be changed —
          nothing is filed and nothing is saved.
        </p>
      </div>

      {/* Estimate echo — the number being confirmed, kept compact (not the full rail) */}
      <Card className="bg-primary-weak border-transparent">
        <div className="text-[12px] font-semibold tracking-[0.08em] uppercase text-text-muted">
          Estimated monthly support
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="num font-display font-bold text-[40px] tracking-[-0.02em] text-primary">
            $842
          </span>
          <span className="text-[16px] font-semibold text-text-muted">/mo</span>
        </div>
        <p className="mt-1 text-[14px] text-text-muted m-0">
          {PARENT_B} pays {PARENT_A} each month.
        </p>
      </Card>

      {/* 1 · Children */}
      <ReviewSection
        step={1}
        title="Children in this case"
        editLabel="children"
        onEdit={() => goTo('worksheet', WORKSHEET_SECTIONS.children)}
      >
        <FieldRow
          label="Children eligible for support"
          divider={false}
          wide={<ReviewValue>2</ReviewValue>}
        />
      </ReviewSection>

      {/* 2 · Monthly income */}
      <ReviewSection
        step={2}
        title="Monthly income"
        editLabel="monthly income"
        onEdit={() => goTo('worksheet', WORKSHEET_SECTIONS.income)}
      >
        <PartyHeader nameA={PARENT_A} nameB={PARENT_B} />
        <FieldRow
          label="Gross monthly income"
          hint="Wages, salary, tips"
          divider={false}
          a={<ReviewValue>$4,800</ReviewValue>}
          b={<ReviewValue>$6,500</ReviewValue>}
        />
        <FieldRow
          label="Self-employment income"
          hint="Net of business expenses"
          a={<ReviewValue muted>$0</ReviewValue>}
          b={<ReviewValue muted>$0</ReviewValue>}
        />
        <FieldRow
          label="Maintenance"
          hint="Alimony paid or received"
          a={<ReviewValue muted>$0</ReviewValue>}
          b={<ReviewValue muted>$0</ReviewValue>}
        />
        <FieldRow
          label="Support for other children"
          hint="Existing orders"
          a={<ReviewValue muted>$0</ReviewValue>}
          b={<ReviewValue>$450</ReviewValue>}
        />
      </ReviewSection>

      {/* 3 · Parenting time */}
      <ReviewSection
        step={3}
        title="Parenting time"
        editLabel="parenting time"
        onEdit={() => goTo('worksheet', WORKSHEET_SECTIONS.parenting)}
      >
        <ParentingTimeBar nameA={PARENT_A} nameB={PARENT_B} nightsA={219} nightsB={146} />
      </ReviewSection>

      {/* 4 · Monthly shared costs */}
      <ReviewSection
        step={4}
        title="Monthly shared costs"
        editLabel="shared costs"
        onEdit={() => goTo('worksheet', WORKSHEET_SECTIONS.costs)}
      >
        <FieldRow
          label="Work-related childcare"
          divider={false}
          wide={<ReviewValue>$780</ReviewValue>}
        />
        <FieldRow
          label="Children's health insurance"
          hint="Premium for the children's portion"
          wide={<ReviewValue>$240</ReviewValue>}
        />
        <FieldRow
          label="Extraordinary medical"
          hint="Recurring, over $250/yr"
          wide={<ReviewValue>$60</ReviewValue>}
        />
      </ReviewSection>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-8">
        <Button variant="ghost" onClick={back}>Back to worksheet</Button>
        {/* Results step isn't built yet — disabled until that page lands. */}
        <Button variant="primary" disabled title="Full results are coming soon">
          See full results
        </Button>
      </div>
    </div>
  )
}

type ReviewSectionProps = {
  step: number
  title: string
  /** Used to label the Edit control for assistive tech, e.g. "Edit monthly income". */
  editLabel: string
  /** Jump back to this section on the worksheet. */
  onEdit: () => void
  children: ReactNode
}

/**
 * A recap card: the numbered badge + title on the left (mirroring the worksheet's
 * Card header) with a right-aligned Edit link. Built on a bare `Card` surface so the
 * header can carry the Edit affordance, which Card's inline `help` slot can't.
 */
function ReviewSection({ step, title, editLabel, onEdit, children }: ReviewSectionProps) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-none grid place-items-center w-[26px] h-[26px] rounded-lg bg-primary-weak text-primary font-display font-bold text-[13px]">
            {step}
          </div>
          <h2 className="font-display font-semibold text-[18px] tracking-[-0.01em] m-0">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${editLabel}`}
          className="flex-none text-[13px] font-semibold text-primary rounded-sm px-1 py-0.5 hover:underline focus-ring cursor-pointer"
        >
          Edit
        </button>
      </div>
      {children}
    </Card>
  )
}

type ReviewValueProps = {
  /** Dim the value for a zero / empty entry. */
  muted?: boolean
  children: ReactNode
}

/** Right-aligned read-only value, aligned to where the worksheet input sat. */
function ReviewValue({ muted, children }: ReviewValueProps) {
  return (
    <span
      className={
        muted
          ? 'num block text-right text-[15px] text-text-subtle'
          : 'num block text-right text-[15px] font-semibold'
      }
    >
      {children}
    </span>
  )
}
