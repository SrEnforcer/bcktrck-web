import type { SubtreeEntry } from '@bcktrck/engine'
import { entriesOfMap, flatMapO, fromNullable, getOrElse, intoMap, intoSet, isNone, lookup, mapO, member, pipe } from '@tsfpp/prelude'

/** Parent lookup map keyed by subtree id. */
export type ParentById = ReadonlyMap<string, string>

/**
 * Keep only unique values while preserving original order.
 * @param values Input values.
 * @returns Unique values in first-seen order.
 */
const uniqueInOrder = (values: readonly string[]): readonly string[] =>
  values.reduce<readonly string[]>((acc, value) => (acc.includes(value) ? acc : [...acc, value]), [])

/**
 * Remove unknown subtree ids and deduplicate selection in stable order.
 * @param entries Available subtree entries.
 * @param selectedIds Raw selected ids.
 * @returns Sanitized selected ids.
 */
export const sanitizeSelectedSubtreeIds = (
  entries: readonly SubtreeEntry[],
  selectedIds: readonly string[]
): readonly string[] => {
  const knownIds = intoSet(entries.map((entry) => entry.id))
  return pipe(
    selectedIds,
    (ids) => ids.filter((id) => pipe(knownIds, member(id))),
    uniqueInOrder,
  )
}

/**
 * Build a parent-id map from preorder depth-first subtree entries.
 * @param entries Preorder subtree entries with depth values.
 * @returns Parent lookup keyed by node id.
 */
export const buildParentMapFromPreorderDepth = (entries: readonly SubtreeEntry[]): ParentById =>
  entries
    .reduce<{
      readonly parentById: ParentById
      readonly stack: readonly string[]
    }>((acc, entry) => {
      const parentId = entry.depth > 0 ? acc.stack[entry.depth - 1] : undefined
      const nextParentById = pipe(
        fromNullable(parentId),
        mapO((knownParentId) => intoMap([...entriesOfMap(acc.parentById), [entry.id, knownParentId] as const])),
        getOrElse(() => acc.parentById)
      )
      const nextStack = [...acc.stack.slice(0, entry.depth), entry.id]
      return {
        parentById: nextParentById,
        stack: nextStack
      }
    }, { parentById: intoMap([]), stack: [] })
    .parentById

const buildChainToRoot = (id: string, parentById: ParentById): readonly string[] => {
  const parent = pipe(parentById, lookup(id))
  return isNone(parent) ? [id] : [...buildChainToRoot(parent.value, parentById), id]
}

/**
 * Compute the lowest common ancestor id for selected subtree ids.
 * @param selectedIds Selected subtree ids.
 * @param parentById Parent lookup map.
 * @returns Lowest common ancestor id when available.
 */
export const computeLowestCommonAncestor = (
  selectedIds: readonly string[],
  parentById: ParentById
): string | undefined => {
  if (selectedIds.length === 0) return undefined

  const chains = selectedIds.map((id) => buildChainToRoot(id, parentById))
  const shortestLength = Math.min(...chains.map((chain) => chain.length))

  return Array.from({ length: shortestLength }, (_, index) => index).reduce<string | undefined>((lca, index) => {
    const current = pipe(
      fromNullable(chains[0]),
      flatMapO((chain) => fromNullable(chain[index])),
      getOrElse((): string | undefined => undefined)
    )

    return pipe(
      fromNullable(current),
      mapO((knownCurrent) => (chains.every((chain) => chain[index] === knownCurrent) ? knownCurrent : lca)),
      getOrElse(() => lca)
    )
  }, undefined)
}

const isAncestor = (ancestorId: string, nodeId: string, parentById: ParentById): boolean => {
  const parent = pipe(parentById, lookup(nodeId))
  if (isNone(parent)) return false
  if (parent.value === ancestorId) return true
  return isAncestor(ancestorId, parent.value, parentById)
}

/**
 * Remove descendants that are already covered by selected ancestors in forest mode.
 * @param selectedIds Selected subtree ids.
 * @param parentById Parent lookup map.
 * @returns Forest root ids without redundant descendants.
 */
export const pruneRedundantDescendantsForForestMode = (
  selectedIds: readonly string[],
  parentById: ParentById
): readonly string[] => {
  const unique = uniqueInOrder(selectedIds)
  return pipe(
    unique,
    (ids) => ids.filter((id) => !unique.some((candidate) => candidate !== id && isAncestor(candidate, id, parentById))),
  )
}
