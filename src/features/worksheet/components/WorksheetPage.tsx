import { Card } from '../../../components/ui/Card'
import { CurrencyInput } from '../../../components/ui/CurrencyInput'
import { NumberInput } from '../../../components/ui/NumberInput'
import { FieldRow } from '../../../components/ui/FieldRow'
import { PartyHeader } from '../../../components/ui/PartyHeader'
import { NumberStepper } from '../../../components/ui/NumberStepper'
import { HelpTip } from '../../../components/ui/HelpTip'
import { ParentingTimeBar } from './ParentingTimeBar'
import { ResultsRail } from './ResultsRail'

const PARENT_A = 'Taylor'
const PARENT_B = 'Blake'

/**
 * The Colorado child-support worksheet. Presentational reproduction of
 * mockups/src/worksheet.html — every value is a static prop; no calculation.
 */
export function WorksheetPage() {
  return (
    <>
      <div className="mb-6">
        <div className="text-[12px] font-semibold tracking-[0.09em] uppercase text-accent-strong">
          Child Support · Unified Worksheet
        </div>
        <h1 className="font-display font-bold text-[32px] tracking-[-0.02em] my-1.5">
          Let&rsquo;s estimate monthly support.
        </h1>
        <p className="text-text-muted max-w-[56ch] m-0">
          Enter each parent&rsquo;s income, time with the children, and shared costs. Your
          estimate updates as you go — nothing is filed and nothing is saved.
        </p>
      </div>

      <div className="grid gap-8 items-start lg:grid-cols-[1fr_340px]">
        {/* LEFT: worksheet */}
        <div>
          {/* 1. Children */}
          <Card step={1} title="Children in this case" hint="How many children is this support order for?">
            <div className="flex items-center gap-4">
              <NumberStepper value={2} />
              <span className="text-[13px] text-text-muted">
                Only children the two parents share and who are eligible for support.
              </span>
            </div>
          </Card>

          {/* 2. Monthly income */}
          <Card
            step={2}
            title="Monthly income"
            hint="Gross monthly amounts, before taxes."
            help={<HelpTip label="Use gross income before taxes and deductions — wages, salary, tips, and self-employment net income." />}
          >
            <PartyHeader nameA={PARENT_A} nameB={PARENT_B} />
            <FieldRow
              label="Gross monthly income"
              hint="Wages, salary, tips"
              divider={false}
              a={<CurrencyInput defaultValue="4,800" />}
              b={<CurrencyInput defaultValue="6,500" />}
            />
            <FieldRow
              label="Self-employment income"
              hint="Net of business expenses"
              a={<CurrencyInput placeholder="0" />}
              b={<CurrencyInput defaultValue="0" />}
            />
            <FieldRow
              label="Maintenance"
              hint="Alimony paid or received"
              a={<CurrencyInput placeholder="0" />}
              b={<CurrencyInput placeholder="0" />}
            />
            <FieldRow
              label="Support for other children"
              hint="Existing orders"
              a={<CurrencyInput placeholder="0" />}
              b={<CurrencyInput defaultValue="450" />}
            />
          </Card>

          {/* 3. Parenting time (signature) */}
          <Card
            step={3}
            title="Parenting time"
            hint="Overnights with each parent per year (out of 365)."
            help={<HelpTip label="Overnights are counted per the parenting-time schedule in your order." />}
          >
            <FieldRow
              label="Overnights per year"
              divider={false}
              a={<NumberInput defaultValue="219" />}
              b={<NumberInput defaultValue="146" />}
            />
            <ParentingTimeBar nameA={PARENT_A} nameB={PARENT_B} nightsA={219} nightsB={146} />
          </Card>

          {/* 4. Monthly shared costs */}
          <Card step={4} title="Monthly shared costs" hint="Added to the obligation and split by income share.">
            <FieldRow label="Work-related childcare" divider={false} wide={<CurrencyInput defaultValue="780" />} />
            <FieldRow
              label="Children's health insurance"
              hint="Premium for the children's portion"
              wide={<CurrencyInput defaultValue="240" />}
            />
            <FieldRow
              label="Extraordinary medical"
              hint="Recurring, over $250/yr"
              wide={<CurrencyInput defaultValue="60" />}
            />
          </Card>
        </div>

        {/* RIGHT: results rail */}
        <aside className="lg:sticky lg:top-6">
          <ResultsRail
            amount="$842"
            payer={PARENT_B}
            recipient={PARENT_A}
            nameA={PARENT_A}
            nameB={PARENT_B}
            combinedIncome="$11,300"
            shareA={42.5}
            shareB={57.5}
            basicObligation="$1,986"
            parentingAdjustment="−$612"
            addOns="$1,080"
            netLabel="Blake's share, net"
            netTotal="$842"
            citation={
              <>
                Estimate only, using Colorado&rsquo;s unified child-support guideline (
                <code className="text-text-muted">C.R.S. §14-10-115</code>, schedule effective
                March 1, 2026). Courts may deviate. Not legal advice.
              </>
            }
          />
        </aside>
      </div>
    </>
  )
}
