import { fromNullable, getOrElse, mapO, pipe } from '@tsfpp/prelude'

/**
 * Emit structured debug logs when debug mode is enabled.
 * @param tag Logical logger tag.
 * @param event Event description.
 * @param payload Optional payload for diagnostics.
 * @returns Nothing.
 */
export const debugLog = (tag: string, event: string, payload?: unknown): void => {
  if (!__BCKTRCK_DEBUG__) return

  void import('consola').then(({ createConsola }) => {
    const logger = createConsola({ level: 4 }).withTag(`web:${tag}`)
    const hasPayload = pipe(
      fromNullable(payload),
      mapO((value) => {
        logger.debug(event, value)
        return true
      }),
      getOrElse(() => false)
    )

    if (!hasPayload) {
      logger.debug(event)
    }
  })
}
