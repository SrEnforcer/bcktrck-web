/**
 * @module lib/subtree-selection
 *
 * Pure helpers for subtree selection normalization and parent/ancestor derivation.
 *
 * @packageDocumentation
 */

import type { SubtreeEntry } from '@bcktrck/engine'
import { entriesOf, findO, flatMapOption, fromNullable, getOrElseOption, intoMap, intoSet, isNone, lookup, mapOption, matchOption, member, none, pipe } from '@tsfpp/prelude'

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
      const ancestorCandidates = acc.stack.slice(0, entry.depth)
      const parentIdOption = entry.depth > 0
        ? findO((value: string) => value.length > 0)([...ancestorCandidates].reverse())
        : none
      const nextParentById = pipe(
        parentIdOption,
        mapOption((knownParentId) => intoMap([...entriesOf(acc.parentById), [entry.id, knownParentId] as const])),
        getOrElseOption(() => acc.parentById)
      )
      const nextStack = [
        ...ancestorCandidates,
        ...Array.from({ length: Math.max(0, entry.depth - ancestorCandidates.length) }, () => ''),
        entry.id,
      ]
      return {
        parentById: nextParentById,
        stack: nextStack
      }
    }, { parentById: intoMap([]), stack: [] })
    .parentById

const buildChainToRoot = (id: string, parentById: ParentById): readonly string[] => {
  const parent = pipe(parentById, lookup(id))
  return matchOption(() => [id], (value: string) => [...buildChainToRoot(value, parentById), id])(parent)
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
      flatMapOption((chain) => fromNullable(chain[index])),
      getOrElseOption((): string | undefined => undefined)
    )

    return pipe(
      fromNullable(current),
      mapOption((knownCurrent) => (chains.every((chain) => chain[index] === knownCurrent) ? knownCurrent : lca)),
      getOrElseOption(() => lca)
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

/**
 * Remove all descendants that are nested under one of the provided root ids.
 * @param entries Entries to filter.
 * @param rootIds Root ids whose descendants should be excluded.
 * @returns Entries without descendants of the provided roots.
 */
export const pruneDescendantEntriesFromRoots = (
  entries: readonly SubtreeEntry[],
  parentById: ParentById,
  rootIds: readonly string[]
): readonly SubtreeEntry[] => {
  const uniqueRoots = uniqueInOrder(rootIds)

  return entries.filter((entry) =>
    !uniqueRoots.some((rootId) => rootId !== entry.id && isAncestor(rootId, entry.id, parentById))
  )
}
