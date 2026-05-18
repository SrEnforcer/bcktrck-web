/**
 * Typed factories for subtrees handler request payloads.
 */
export type SubtreesRequestBody = Readonly<{
  readonly source: string
  readonly styleSource: string | null
  readonly ignoreSourceStyle: boolean
}>

/**
 * Builds a valid subtrees request payload.
 * @param input Factory input carrying source text.
 * @returns Valid subtrees request payload.
 */
export const makeSubtreesRequestBody = (
  input: Readonly<{ readonly source: string }>,
): SubtreesRequestBody => ({
  source: input.source,
  styleSource: null,
  ignoreSourceStyle: false,
})

/**
 * Builds an invalid subtrees payload missing the required source field.
 * @returns Invalid subtrees request payload.
 */
export const makeSubtreesRequestBodyMissingSource = (): Readonly<Record<string, unknown>> => ({
  styleSource: null,
  ignoreSourceStyle: false,
})
