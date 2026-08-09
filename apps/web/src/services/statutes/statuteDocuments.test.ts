/**
 * `STATUTE_DOCUMENTS` is hand-curated, so the tests that matter most are drift
 * guards against the real shipped rule set — not the joins themselves.
 */
import { describe, expect, it } from 'vitest'
import coloradoRuleSet from '../rules/data/co/2026.json'
import {
  STATUTE_DOCUMENTS,
  getStatuteDocuments,
  getDocumentsForRuleSet,
  getDocumentsForCitationTopic,
} from './statuteDocuments'

describe('getStatuteDocuments', () => {
  it('returns all CO documents', () => {
    expect(getStatuteDocuments('CO')).toHaveLength(2)
  })

  it('returns everything when no jurisdiction is given', () => {
    expect(getStatuteDocuments()).toHaveLength(STATUTE_DOCUMENTS.length)
  })

  it('returns nothing for an unknown jurisdiction', () => {
    expect(getStatuteDocuments('ZZ')).toEqual([])
  })
})

describe('getDocumentsForRuleSet', () => {
  it('joins on jurisdiction code', () => {
    const docs = getDocumentsForRuleSet({ jurisdiction: { code: 'CO', name: 'Colorado' } })
    expect(docs.map((d) => d.id).sort()).toEqual(
      ['co-hb25-1159-final-act', 'co-title-14-2024'].sort(),
    )
  })
})

describe('getDocumentsForCitationTopic', () => {
  it('finds the amendment for a schedule topic', () => {
    const docs = getDocumentsForCitationTopic('schedule')
    expect(docs.map((d) => d.id)).toEqual(['co-hb25-1159-final-act'])
  })

  it('finds the base statute for the primary topic', () => {
    const docs = getDocumentsForCitationTopic('primary')
    expect(docs.map((d) => d.id)).toEqual(['co-title-14-2024'])
  })
})

describe('drift guards against the real rule set', () => {
  it('covers every citation topic the shipped rule set declares', () => {
    const topics = Object.keys(coloradoRuleSet.citations)
    const covered = new Set(STATUTE_DOCUMENTS.flatMap((doc) => doc.informsCitationTopics))
    for (const topic of topics) {
      expect(covered.has(topic), `no statute document informs citation topic "${topic}"`).toBe(true)
    }
  })

  it('has unique ids', () => {
    const ids = STATUTE_DOCUMENTS.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has unique file paths', () => {
    const paths = STATUTE_DOCUMENTS.map((d) => d.file.path)
    expect(new Set(paths).size).toBe(paths.length)
  })
})
