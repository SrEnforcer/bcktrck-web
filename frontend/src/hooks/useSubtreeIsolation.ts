/**
 * @module hooks/use-subtree-isolation
 *
 * React hook that derives subtree selection state and compile targets from
 * source content plus user selection mode.
 *
 * @packageDocumentation
 */

import { useEffect, useMemo, useState } from 'react'
import { fromNullable, getNumberField, getStringField, isOk, isRecord, isSome, pipe, toNullable, tryCatchAsync } from '@tsfpp/prelude'
import type { SubtreeEntry } from '@bcktrck/engine'
import {
  buildParentMapFromPreorderDepth,
  computeLowestCommonAncestor,
  pruneDescendantEntriesFromRoots,
  pruneRedundantDescendantsForForestMode,
  sanitizeSelectedSubtreeIds
} from '../lib/subtreeSelection'

/**
 * Selection strategy used when multiple subtrees are selected.
 */
export type SubtreeIsolationMode = 'context' | 'forest'

/**
 * Input required by `useSubtreeIsolation`.
 */
export type UseSubtreeIsolationInput = {
  readonly source: string
  readonly styleSource: string | undefined
  readonly ignoreSourceStyle: boolean
}

/**
 * State and derived values returned by `useSubtreeIsolation`.
 */
export type UseSubtreeIsolationResult = {
  readonly selectedSubtreeIds: readonly string[]
  readonly setSelectedSubtreeIds: React.Dispatch<React.SetStateAction<readonly string[]>>
  readonly subtreeIsolationMode: SubtreeIsolationMode
  readonly setSubtreeIsolationMode: React.Dispatch<React.SetStateAction<SubtreeIsolationMode>>
  readonly collapsedSubtreeRootIds: readonly string[]
  readonly setCollapsedSubtreeRootIds: React.Dispatch<React.SetStateAction<readonly string[]>>
  readonly subtreeEntries: readonly SubtreeEntry[]
  readonly normalizedSelectedSubtreeIds: readonly string[]
  readonly forestSelectionIds: readonly string[]
  readonly effectiveSubtreeId: string | undefined
  readonly effectiveSubtreeIds: readonly string[] | undefined
}

const toPreferredSubtreeEntries = (entries: readonly SubtreeEntry[]): readonly SubtreeEntry[] => {
  const departmentEntries = entries.filter((entry) => entry.kind === 'department')
  return departmentEntries.length > 0 ? departmentEntries : entries
}

const decodeSubtreeEntry = (value: unknown): SubtreeEntry | undefined => {
  if (!isRecord(value)) return undefined

  const id = pipe(
    getStringField(value, 'id'),
    (first) => (isSome(first) ? first : getStringField(value, 'nodeId')),
    (second) => (isSome(second) ? second : getStringField(value, 'handle')),
  )
  const label = pipe(
    getStringField(value, 'label'),
    (first) => (isSome(first) ? first : getStringField(value, 'name')),
    (second) => (isSome(second) ? second : getStringField(value, 'title')),
  )
  const depth = pipe(
    getNumberField(value, 'depth'),
    (first) => (isSome(first) ? first : getNumberField(value, 'level')),
  )
  const kind = pipe(
    getStringField(value, 'kind'),
    (first) => (isSome(first) ? first : getStringField(value, 'type')),
  )

  if (!isSome(id) || !isSome(label) || !isSome(depth)) {
    return undefined
  }

  return {
    id: id.value,
    label: label.value,
    depth: depth.value,
    kind: isSome(kind) && kind.value.length > 0 ? kind.value : 'node',
  }
}

const decodeEntriesFromField = (value: unknown, field: string): readonly SubtreeEntry[] => {
  if (!isRecord(value)) return []
  if (!Array.isArray(value[field])) return []

  return value[field].flatMap((item) => {
    const decoded = decodeSubtreeEntry(item)
    return decoded ? [decoded] : []
  })
}

const decodeEntries = (value: unknown): readonly SubtreeEntry[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const decoded = decodeSubtreeEntry(item)
      return decoded ? [decoded] : []
    })
  }

  const entries = decodeEntriesFromField(value, 'entries')
  if (entries.length > 0) return entries

  const nodes = decodeEntriesFromField(value, 'nodes')
  if (nodes.length > 0) return nodes

  const subtrees = decodeEntriesFromField(value, 'subtrees')
  if (subtrees.length > 0) return subtrees

  if (!isRecord(value)) return []

  const nestedResultEntries = decodeEntriesFromField(value.result, 'entries')
  return nestedResultEntries.length > 0 ? nestedResultEntries : decodeEntriesFromField(value.result, 'nodes')
}

const isAbortLikeError = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false
  }

  const name = getStringField(value, 'name')
  return isSome(name) && name.value === 'AbortError'
}

/**
 * Derive subtree selection state and effective compile targets from source + UI selection.
 * @param input Current source and style isolation inputs.
 * @returns Selection state, derived subtree sets, and effective compile targets.
 */
export const useSubtreeIsolation = (input: UseSubtreeIsolationInput): UseSubtreeIsolationResult => {
  const [selectedSubtreeIds, setSelectedSubtreeIds] = useState<readonly string[]>([])
  const [subtreeIsolationMode, setSubtreeIsolationMode] = useState<SubtreeIsolationMode>('forest')
  const [collapsedSubtreeRootIds, setCollapsedSubtreeRootIds] = useState<readonly string[]>([])
  const [allSubtreeEntries, setAllSubtreeEntries] = useState<readonly SubtreeEntry[]>([])

  useEffect(() => {
    // DEVIATION(1.9): AbortController is required to cancel in-flight browser fetch requests on dependency changes.
    const abortController = new AbortController()

    const loadSubtrees = async (): Promise<void> => {
      const requestBody = {
        source: input.source,
        styleSource: pipe(fromNullable(input.styleSource), toNullable),
        ignoreSourceStyle: input.ignoreSourceStyle,
      }

      const responseResult = await tryCatchAsync(
        () => fetch('/api/subtrees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        signal: abortController.signal,
        }),
        (cause) => cause,
      )

      if (!isOk(responseResult)) {
        if (isAbortLikeError(responseResult.error)) {
          return
        }
        return
      }

      const response = responseResult.value

      if (!response.ok) {
        return
      }

      const payloadResult = await tryCatchAsync(
        () => response.json(),
        (cause) => cause,
      )

      if (!isOk(payloadResult)) {
        return
      }

      const decodedEntries = decodeEntries(payloadResult.value)
      setAllSubtreeEntries(decodedEntries)
    }

    void tryCatchAsync(
      loadSubtrees,
      () => {
        return undefined
      },
    )

    return () => {
      abortController.abort()
    }
  }, [input.source, input.styleSource, input.ignoreSourceStyle])

  const subtreeParentById = useMemo(() => buildParentMapFromPreorderDepth(allSubtreeEntries), [allSubtreeEntries])

  const preferredSubtreeEntries = useMemo<readonly SubtreeEntry[]>(
    () => toPreferredSubtreeEntries(allSubtreeEntries),
    [allSubtreeEntries]
  )

  const normalizedSelectedSubtreeIdsFromPreferredEntries = useMemo(
    () => sanitizeSelectedSubtreeIds(preferredSubtreeEntries, selectedSubtreeIds),
    [preferredSubtreeEntries, selectedSubtreeIds]
  )

  const normalizedCollapsedSubtreeRootIds = useMemo(
    () => sanitizeSelectedSubtreeIds(preferredSubtreeEntries, collapsedSubtreeRootIds),
    [preferredSubtreeEntries, collapsedSubtreeRootIds]
  )

  const activeCollapsedSubtreeRootIds = useMemo(
    () => normalizedCollapsedSubtreeRootIds.filter((id) => normalizedSelectedSubtreeIdsFromPreferredEntries.includes(id)),
    [normalizedCollapsedSubtreeRootIds, normalizedSelectedSubtreeIdsFromPreferredEntries]
  )

  const subtreeEntries = useMemo<readonly SubtreeEntry[]>(
    () => pruneDescendantEntriesFromRoots(preferredSubtreeEntries, subtreeParentById, activeCollapsedSubtreeRootIds),
    [preferredSubtreeEntries, subtreeParentById, activeCollapsedSubtreeRootIds]
  )

  const normalizedSelectedSubtreeIds = useMemo(
    () => sanitizeSelectedSubtreeIds(subtreeEntries, selectedSubtreeIds),
    [subtreeEntries, selectedSubtreeIds]
  )

  const forestSelectionIds = useMemo(
    () => pruneRedundantDescendantsForForestMode(normalizedSelectedSubtreeIds, subtreeParentById),
    [normalizedSelectedSubtreeIds, subtreeParentById]
  )

  const contextSubtreeId = useMemo(
    () => computeLowestCommonAncestor(normalizedSelectedSubtreeIds, subtreeParentById),
    [normalizedSelectedSubtreeIds, subtreeParentById]
  )

  const forestFocusSubtreeId = useMemo(
    () => computeLowestCommonAncestor(forestSelectionIds, subtreeParentById),
    [forestSelectionIds, subtreeParentById]
  )

  const effectiveSubtreeId = useMemo(
    () => (subtreeIsolationMode === 'context' ? contextSubtreeId : forestFocusSubtreeId),
    [subtreeIsolationMode, contextSubtreeId, forestFocusSubtreeId]
  )

  const effectiveSubtreeIds = useMemo(
    () => (subtreeIsolationMode === 'forest' && forestSelectionIds.length > 0 ? forestSelectionIds : undefined),
    [subtreeIsolationMode, forestSelectionIds]
  )

  return {
    selectedSubtreeIds,
    setSelectedSubtreeIds,
    subtreeIsolationMode,
    setSubtreeIsolationMode,
    collapsedSubtreeRootIds: activeCollapsedSubtreeRootIds,
    setCollapsedSubtreeRootIds,
    subtreeEntries,
    normalizedSelectedSubtreeIds,
    forestSelectionIds,
    effectiveSubtreeId,
    effectiveSubtreeIds
  }
}
