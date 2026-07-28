/**
 * Cross-component domain types for the Colorado support estimator.
 */

/**
 * Semantic party identity. Columbine rule: Parent A is always the primary
 * (columbine indigo) color, Parent B is always the accent (sandstone) color.
 * Reused for income columns, the parenting-time bar, and the income-share split
 * so color consistently carries meaning.
 */
export type Party = 'a' | 'b'
