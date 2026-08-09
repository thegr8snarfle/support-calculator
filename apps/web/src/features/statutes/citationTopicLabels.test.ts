import { describe, expect, it } from 'vitest'
import coloradoRuleSet from '../../services/rules/data/co/2026.json'
import { humanizeCitationTopic } from './citationTopicLabels'

describe('humanizeCitationTopic', () => {
  it('has a label for every citation topic the shipped rule set declares', () => {
    for (const topic of Object.keys(coloradoRuleSet.citations)) {
      const label = humanizeCitationTopic(topic)
      expect(label).not.toBe('')
      // A mapped topic reads as prose, not a bare camelCase key echoed back.
      expect(label).not.toBe(topic)
    }
  })

  it('falls back to a humanized key for an unmapped topic', () => {
    expect(humanizeCitationTopic('someFutureTopic')).toBe('Some future topic')
  })
})
