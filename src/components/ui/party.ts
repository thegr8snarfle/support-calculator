import type { Party } from '../../types/common'

/** View helper: background-fill utility class for a party's semantic color. */
export const partyFill: Record<Party, string> = {
  a: 'bg-primary',
  b: 'bg-accent',
}
