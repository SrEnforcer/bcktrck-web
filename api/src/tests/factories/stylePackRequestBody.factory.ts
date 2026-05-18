/**
 * Typed factories for style-pack handler request payloads.
 */
export type StylePackRequestBody = Readonly<{
  readonly choice: string
}>

/**
 * Builds a valid style-pack request payload.
 * @param input Factory input carrying style-pack choice.
 * @returns Valid style-pack request payload.
 */
export const makeStylePackRequestBody = (
  input: Readonly<{ readonly choice: string }>,
): StylePackRequestBody => ({
  choice: input.choice,
})

/**
 * Builds an invalid style-pack payload missing required fields for 422 tests.
 * @returns Invalid style-pack request payload.
 */
export const makeStylePackRequestBodyMissingChoice = (): Readonly<Record<string, unknown>> => ({})
