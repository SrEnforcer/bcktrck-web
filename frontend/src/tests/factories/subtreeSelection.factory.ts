import type { SubtreeEntry } from '@bcktrck/engine'

/**
 * Builds a subtree entry fixture with explicit field control.
 * @param input Entry fixture input.
 * @returns Subtree entry fixture.
 */
export const makeSubtreeEntry = (
  input: Readonly<{
    readonly id: string
    readonly depth: number
    readonly kind: SubtreeEntry['kind']
    readonly label: string
  }>,
): SubtreeEntry => ({
  kind: input.kind,
  id: input.id,
  label: input.label,
  depth: input.depth,
})

/**
 * Builds a department subtree entry fixture with default label equal to id.
 * @param input Department entry fixture input.
 * @returns Department subtree entry fixture.
 */
export const makeDepartmentEntry = (
  input: Readonly<{ readonly id: string; readonly depth: number }>,
): SubtreeEntry => makeSubtreeEntry({
  id: input.id,
  depth: input.depth,
  kind: 'department',
  label: input.id,
})

/**
 * Canonical subtree hierarchy for selection helper tests.
 */
export const sampleSubtreeEntries: ReadonlyArray<SubtreeEntry> = [
  makeDepartmentEntry({ id: 'root', depth: 0 }),
  makeDepartmentEntry({ id: 'ops', depth: 1 }),
  makeDepartmentEntry({ id: 'ops-a', depth: 2 }),
  makeDepartmentEntry({ id: 'ops-b', depth: 2 }),
  makeDepartmentEntry({ id: 'eng', depth: 1 }),
  makeDepartmentEntry({ id: 'eng-a', depth: 2 }),
  makeDepartmentEntry({ id: 'eng-b', depth: 2 }),
]
