import { useEffect, useMemo, useState } from 'react'
import { fromNullable, fromUnknownArrayOf, getNumberField, getOrElse, getStringField, isNone, isRecord, isSome, mapO, pipe } from '@tsfpp/prelude'
import type { SubtreeEntry } from '@bcktrck/engine'
import {
  buildParentMapFromPreorderDepth,
  computeLowestCommonAncestor,
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
  readonly subtreeEntries: readonly SubtreeEntry[]
  readonly normalizedSelectedSubtreeIds: readonly string[]
  readonly forestSelectionIds: readonly string[]
  readonly effectiveSubtreeId: string | undefined
  readonly effectiveSubtreeIds: readonly string[] | undefined
}

const isSubtreeEntry = (value: unknown): value is SubtreeEntry => {
  if (!isRecord(value)) return false
  const kind = getStringField(value, 'kind')
  const id = getStringField(value, 'id')
  const label = getStringField(value, 'label')
  const depth = getNumberField(value, 'depth')
  const validKind = isSome(kind) && (kind.value === 'employee' || kind.value === 'department' || kind.value === 'vacancy')

  return validKind && isSome(id) && isSome(label) && isSome(depth)
}

const decodeEntries = (value: unknown): readonly SubtreeEntry[] => {
  if (!isRecord(value)) return []
  const entries = fromUnknownArrayOf(isSubtreeEntry)(value.entries)
  return isSome(entries) ? entries.value : []
}

/**
 * Derive subtree selection state and effective compile targets from source + UI selection.
 * @param input Current source and style isolation inputs.
 * @returns Selection state, derived subtree sets, and effective compile targets.
 */
export const useSubtreeIsolation = (input: UseSubtreeIsolationInput): UseSubtreeIsolationResult => {
  const [selectedSubtreeIds, setSelectedSubtreeIds] = useState<readonly string[]>([])
  const [subtreeIsolationMode, setSubtreeIsolationMode] = useState<SubtreeIsolationMode>('forest')
  const [allSubtreeEntries, setAllSubtreeEntries] = useState<readonly SubtreeEntry[]>([])

  useEffect(() => {
    const abortController = new AbortController()

    const loadSubtrees = async (): Promise<void> => {
      const response = await fetch('/api/subtrees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: input.source,
          styleSource: pipe(fromNullable(input.styleSource), getOrElse((): string | null => null)),
          ignoreSourceStyle: input.ignoreSourceStyle,
        }),
        signal: abortController.signal,
      }).catch(() => undefined)

      const responseOption = fromNullable(response)

      const isResponseOk = pipe(
        responseOption,
        mapO((candidate) => candidate.ok),
        getOrElse(() => false)
      )
      if (!isResponseOk) {
        setAllSubtreeEntries([])
        return
      }

      if (isNone(responseOption)) {
        return
      }

      const payload = await responseOption.value.json().catch(() => undefined)
      setAllSubtreeEntries(decodeEntries(payload))
    }

    loadSubtrees().catch(() => {
      setAllSubtreeEntries([])
    })

    return () => {
      abortController.abort()
    }
  }, [input.source, input.styleSource, input.ignoreSourceStyle])

  const subtreeEntries = useMemo<readonly SubtreeEntry[]>(
    () => allSubtreeEntries.filter((entry) => entry.kind === 'department'),
    [allSubtreeEntries]
  )

  const subtreeParentById = useMemo(
    () => buildParentMapFromPreorderDepth(allSubtreeEntries),
    [allSubtreeEntries]
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
    subtreeEntries,
    normalizedSelectedSubtreeIds,
    forestSelectionIds,
    effectiveSubtreeId,
    effectiveSubtreeIds
  }
}
