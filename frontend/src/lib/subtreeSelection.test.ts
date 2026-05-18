import type { SubtreeEntry } from '@bcktrck/engine'
import { describe, expect, it } from 'vitest'
import fc from 'fast-check'

import {
  buildParentMapFromPreorderDepth,
  computeLowestCommonAncestor,
  pruneRedundantDescendantsForForestMode,
  sanitizeSelectedSubtreeIds
} from './subtreeSelection'
import {
  makeDepartmentEntry,
  makeSubtreeEntry,
  sampleSubtreeEntries,
} from '../tests/factories/subtreeSelection.factory'

const sampleEntries: ReadonlyArray<SubtreeEntry> = sampleSubtreeEntries

describe('sanitizeSelectedSubtreeIds', () => {
  it('keeps known ids, removes unknown ids, and preserves first occurrence', () => {
    const result = sanitizeSelectedSubtreeIds(sampleEntries, ['eng', 'missing', 'ops', 'eng'])
    expect(result).toEqual(['eng', 'ops'])
  })

  it('drops non-department ids when called with department-only entries', () => {
    const mixedEntries = [
      makeSubtreeEntry({ id: 'root', depth: 0, kind: 'employee', label: 'root' }),
      makeSubtreeEntry({ id: 'eng', depth: 1, kind: 'department', label: 'eng' }),
      makeSubtreeEntry({ id: 'eng-ic', depth: 2, kind: 'employee', label: 'eng-ic' }),
      makeSubtreeEntry({ id: 'ops', depth: 1, kind: 'department', label: 'ops' })
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
      makeDepartmentEntry({ id: 'root-a', depth: 0 }),
      makeDepartmentEntry({ id: 'a-child', depth: 1 }),
      makeDepartmentEntry({ id: 'root-b', depth: 0 }),
      makeDepartmentEntry({ id: 'b-child', depth: 1 })
    ])

    expect(parentById.has('root-a')).toBe(false)
    expect(parentById.has('root-b')).toBe(false)
    expect(parentById.get('a-child')).toBe('root-a')
    expect(parentById.get('b-child')).toBe('root-b')
  })

  it('preserves correct parents for mixed-kind preorder trees', () => {
    const parentById = buildParentMapFromPreorderDepth([
      makeSubtreeEntry({ id: 'root-emp', depth: 0, kind: 'employee', label: 'root-emp' }),
      makeDepartmentEntry({ id: 'dept-a', depth: 1 }),
      makeSubtreeEntry({ id: 'employee-a1', depth: 2, kind: 'employee', label: 'employee-a1' }),
      makeDepartmentEntry({ id: 'dept-b', depth: 1 }),
      makeSubtreeEntry({ id: 'employee-b1', depth: 2, kind: 'employee', label: 'employee-b1' })
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
      makeDepartmentEntry({ id: 'root-a', depth: 0 }),
      makeDepartmentEntry({ id: 'a-child', depth: 1 }),
      makeDepartmentEntry({ id: 'root-b', depth: 0 }),
      makeDepartmentEntry({ id: 'b-child', depth: 1 })
    ])
    expect(computeLowestCommonAncestor(['a-child', 'b-child'], forestParentById)).toBeUndefined()
  })

  it('returns common non-department parent when departments are siblings', () => {
    const parentById = buildParentMapFromPreorderDepth([
      makeSubtreeEntry({ id: 'ceo', depth: 0, kind: 'employee', label: 'ceo' }),
      makeDepartmentEntry({ id: 'dept-fin', depth: 1 }),
      makeSubtreeEntry({ id: 'fin-manager', depth: 2, kind: 'employee', label: 'fin-manager' }),
      makeDepartmentEntry({ id: 'dept-ops', depth: 1 }),
      makeSubtreeEntry({ id: 'ops-manager', depth: 2, kind: 'employee', label: 'ops-manager' })
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

  it('satisfies idempotence law for forest pruning', () => {
    const knownIds = sampleEntries.map((item) => item.id)

    fc.assert(
      fc.property(fc.array(fc.constantFrom(...knownIds), { maxLength: 20 }), (selectedIds) => {
        const once = pruneRedundantDescendantsForForestMode(selectedIds, parentById)
        const twice = pruneRedundantDescendantsForForestMode(once, parentById)

        expect(twice).toEqual(once)
      }),
    )
  })
})

describe('sanitizeSelectedSubtreeIds laws', () => {
  it('satisfies membership law: sanitized ids are subset of known entries', () => {
    const knownIds = sampleEntries.map((item) => item.id)

    fc.assert(
      fc.property(fc.array(fc.string(), { maxLength: 20 }), (selectedIds) => {
        const sanitized = sanitizeSelectedSubtreeIds(sampleEntries, selectedIds)
        expect(sanitized.every((id) => knownIds.includes(id))).toBe(true)
      }),
    )
  })
})
