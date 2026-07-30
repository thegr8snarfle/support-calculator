import { partyGridCols } from './grid'

/**
 * Two right-aligned party labels aligned over the two input columns, each with
 * its semantic color dot (Parent A = primary, Parent B = accent).
 */
export type PartyHeaderProps = {
  nameA: string
  nameB: string
}

function Label({ name, dotClass }: { name: string; dotClass: string }) {
  return (
    <div className="flex items-center justify-end gap-2 text-[13px] font-semibold">
      <span className={`w-[9px] h-[9px] rounded-full ${dotClass}`} />
      {name}
    </div>
  )
}

export function PartyHeader({ nameA, nameB }: PartyHeaderProps) {
  return (
    <div className={`${partyGridCols} items-end px-1 pb-2`}>
      <div />
      <Label name={nameA} dotClass="bg-primary" />
      <Label name={nameB} dotClass="bg-accent" />
    </div>
  )
}
