/**
 * @module logging/logger
 *
 * Structured debug logging adapter for frontend diagnostics.
 * Defers logger loading to runtime and suppresses output unless debug mode is enabled.
 *
 * @packageDocumentation
 */

import { type LogEntry, type Logger, fromNullable, getOrElseOption, mapOption, pipe } from '@tsfpp/prelude'

const writeDebug = (entry: LogEntry): void => {
  if (!__BCKTRCK_DEBUG__) return

  void import('consola').then(({ createConsola }) => {
    const logger = createConsola({ level: 4 }).withTag('web')
    logger.debug(entry)
  })
}

const browserLogger: Logger = {
  debug: writeDebug,
  info: writeDebug,
  warn: writeDebug,
  error: writeDebug,
}

const toPayloadString = (payload: unknown): string => {
  if (payload instanceof Error) {
    return payload.message
  }

  if (typeof payload === 'string') {
    return payload
  }

  return JSON.stringify(payload)
}

const toPayloadField = (payload: unknown): Readonly<Record<string, unknown>> => pipe(
  fromNullable(payload),
  mapOption((value) => ({ payload: toPayloadString(value) })),
  getOrElseOption(() => ({})),
)

/**
 * Emit structured debug logs when debug mode is enabled.
 * @param tag Logical logger tag.
 * @param event Dot-separated event name.
 * @param payload Payload for diagnostics. Pass `undefined` when no payload is available.
 * @returns Nothing.
 */
export const debugLog = (tag: string, event: string, payload: unknown): void => {
  const entry: LogEntry = {
    message: event,
    code: tag,
    ...toPayloadField(payload),
  }

  browserLogger.debug(entry)
}
