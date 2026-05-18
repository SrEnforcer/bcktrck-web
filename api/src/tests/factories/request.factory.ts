/**
 * Factory for Fetch API JSON requests used by API handler tests.
 */
export type JsonRequestInput = Readonly<{
  readonly path: string
  readonly body: unknown
}>

/**
 * Builds a JSON request for API handler tests.
 * @param input Request factory input.
 * @returns Fetch API request instance.
 */
export const makeJsonRequest = (input: JsonRequestInput): Request => {
  // DEVIATION(1.9): Request construction is required for Fetch API handler tests.
  // eslint-disable-next-line no-restricted-syntax -- DEVIATION(1.9): adapter-boundary test input.
  return new Request(`http://localhost${input.path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input.body),
  })
}
