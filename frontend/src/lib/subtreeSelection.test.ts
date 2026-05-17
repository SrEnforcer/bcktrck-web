import type { SubtreeEntry } from '@bcktrck/engine'
import { describe, expect, it } from 'vitest'

import {
  buildParentMapFromPreorderDepth,
  computeLowestCommonAncestor,
  pruneRedundantDescendantsForForestMode,
  sanitizeSelectedSubtreeIds
} from './subtreeSelection'

const entry = (id: string, depth: number, kind: SubtreeEntry['kind'] = 'department'): SubtreeEntry => ({
  kind,
  id,
  label: id,
  depth
})

const sampleEntries = [
  entry('root', 0),
  entry('ops', 1),
  entry('ops-a', 2),
  entry('ops-b', 2),
  entry('eng', 1),
  entry('eng-a', 2),
  entry('eng-b', 2)
]

describe('sanitizeSelectedSubtreeIds', () => {
  it('keeps known ids, removes unknown ids, and preserves first occurrence', () => {
    const result = sanitizeSelectedSubtreeIds(sampleEntries, ['eng', 'missing', 'ops', 'eng'])
    expect(result).toEqual(['eng', 'ops'])
  })

  it('drops non-department ids when called with department-only entries', () => {
    const mixedEntries = [
      entry('root', 0, 'employee'),
      entry('eng', 1, 'department'),
      entry('eng-ic', 2, 'employee'),
      entry('ops', 1, 'department')
    ]
    const departmentOnlyEntries = mixedEntries.filter((item) => item.kind === 'department')
    const result = sanitizeSelectedSubtreeIds(departmentOnlyEntries, ['eng', 'eng-ic', 'ops', 'eng'])
    expect(result).toEqual(['eng', 'ops'])
  })

  it('returns empty array when selection is empty', () => {
    expect(sanitizeSelectedSubtreeIds(sampleEntries, [])).toEqual([])
  })
})

describe('buildParentMapFromPreorderDepth', () => {
  it('maps parents from preorder depth traversal', () => {
    const parentById = buildParentMapFromPreorderDepth(sampleEntries)
    expect(parentById.get('ops')).toBe('root')
    expect(parentById.get('ops-a')).toBe('ops')
    expect(parentById.get('eng')).toBe('root')
    expect(parentById.get('eng-b')).toBe('eng')
    expect(parentById.has('root')).toBe(false)
  })

  it('supports multiple roots', () => {
    const parentById = buildParentMapFromPreorderDepth([
      entry('root-a', 0),
      entry('a-child', 1),
      entry('root-b', 0),
      entry('b-child', 1)
    ])

    expect(parentById.has('root-a')).toBe(false)
    expect(parentById.has('root-b')).toBe(false)
    expect(parentById.get('a-child')).toBe('root-a')
    expect(parentById.get('b-child')).toBe('root-b')
  })

  it('preserves correct parents for mixed-kind preorder trees', () => {
    const parentById = buildParentMapFromPreorderDepth([
      entry('root-emp', 0, 'employee'),
      entry('dept-a', 1),
      entry('employee-a1', 2, 'employee'),
      entry('dept-b', 1),
      entry('employee-b1', 2, 'employee')
    ])

    expect(parentById.get('dept-a')).toBe('root-emp')
    expect(parentById.get('dept-b')).toBe('root-emp')
    expect(parentById.get('employee-b1')).toBe('dept-b')
  })
})

describe('computeLowestCommonAncestor', () => {
  const parentById = buildParentMapFromPreorderDepth(sampleEntries)

  it('returns the same id for single selection', () => {
    expect(computeLowestCommonAncestor(['ops'], parentById)).toBe('ops')
  })

  it('returns ancestor when one selection is ancestor of another', () => {
    expect(computeLowestCommonAncestor(['ops', 'ops-a'], parentById)).toBe('ops')
  })

  it('returns nearest shared parent for sibling branches', () => {
    expect(computeLowestCommonAncestor(['ops-a', 'ops-b'], parentById)).toBe('ops')
  })

  it('returns root when branches only share the root', () => {
    expect(computeLowestCommonAncestor(['ops-a', 'eng-a'], parentById)).toBe('root')
  })

  it('returns undefined for empty selections', () => {
    expect(computeLowestCommonAncestor([], parentById)).toBeUndefined()
  })

  it('returns undefined for selections from different roots', () => {
    const forestParentById = buildParentMapFromPreorderDepth([
      entry('root-a', 0),
      entry('a-child', 1),
      entry('root-b', 0),
      entry('b-child', 1)
    ])
    expect(computeLowestCommonAncestor(['a-child', 'b-child'], forestParentById)).toBeUndefined()
  })

  it('returns common non-department parent when departments are siblings', () => {
    const parentById = buildParentMapFromPreorderDepth([
      entry('ceo', 0, 'employee'),
      entry('dept-fin', 1),
      entry('fin-manager', 2, 'employee'),
      entry('dept-ops', 1),
      entry('ops-manager', 2, 'employee')
    ])

    expect(computeLowestCommonAncestor(['dept-fin', 'dept-ops'], parentById)).toBe('ceo')
  })
})

describe('pruneRedundantDescendantsForForestMode', () => {
  const parentById = buildParentMapFromPreorderDepth(sampleEntries)

  it('drops descendants when ancestor is selected', () => {
    expect(pruneRedundantDescendantsForForestMode(['ops', 'ops-a', 'eng-a'], parentById)).toEqual(['ops', 'eng-a'])
  })

  it('keeps independent branches', () => {
    expect(pruneRedundantDescendantsForForestMode(['ops-a', 'eng-a'], parentById)).toEqual(['ops-a', 'eng-a'])
  })

  it('is idempotent', () => {
    const once = pruneRedundantDescendantsForForestMode(['ops', 'ops-a', 'ops-a'], parentById)
    const twice = pruneRedundantDescendantsForForestMode(once, parentById)
    expect(twice).toEqual(once)
  })

  it('returns empty selection for empty input', () => {
    expect(pruneRedundantDescendantsForForestMode([], parentById)).toEqual([])
  })
})
