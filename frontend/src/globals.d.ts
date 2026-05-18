/**
 * @module globals
 *
 * Frontend ambient declarations used by build-time defines and local engine typing.
 *
 * @packageDocumentation
 */

declare const __BCKTRCK_DEBUG__: boolean

declare module '@bcktrck/engine' {
	/**
	 * Parser error produced by the engine parser.
	 */
	export type ParseErr = {
		readonly error: string
		readonly line: number
		readonly col: number
	}

	/**
	 * Engine render configuration bag.
	 */
	export type RenderConfig = Readonly<Record<string, unknown>>

	/**
	 * Subtree metadata returned by the engine for selection UIs.
	 */
	export type SubtreeEntry = {
		readonly kind: 'employee' | 'department' | 'vacancy'
		readonly id: string
		readonly label: string
		readonly depth: number
	}

	/**
	 * Resolver error emitted by the engine semantic pass.
	 */
	export type ResolveError = {
		readonly line: number
		readonly col: number
		readonly message: string
	}

	/**
	 * Successful compile result.
	 */
	export type CompileOk = {
		readonly ok: true
		readonly svg: string
		readonly viewBox: {
			readonly x: number
			readonly y: number
			readonly width: number
			readonly height: number
		}
	}

	/**
	 * Failed compile result.
	 */
	export type CompileErr = {
		readonly ok: false
		readonly parseError: ParseErr | null
		readonly resolveErrors: readonly ResolveError[] | null
	}

	/**
	 * Engine compile output union.
	 */
	export type CompileResult = CompileOk | CompileErr

	/**
	 * Compile options accepted by the engine.
	 */
	export type CompileOptions = {
		readonly subtreeId: string | null
		readonly subtreeIds: readonly string[] | null
		readonly styleSource: string | null
		readonly ignoreSourceStyle: boolean | null
	}

	/**
	 * Default render configuration shipped by the engine.
	 */
	export const defaultRenderConfig: RenderConfig
	/**
	 * Compile bcktrck source into an SVG result.
	 * @param source Raw bcktrck source text.
	 * @param renderConfig Optional render configuration override.
	 * @param options Optional compile options.
	 * @returns Compile result containing SVG or parse/resolve errors.
	 */
	export const compile: (source: string, renderConfig: RenderConfig | null, options: CompileOptions | null) => CompileResult
	/**
	 * List subtree entries from source for selection UIs.
	 * @param source Raw bcktrck source text.
	 * @param options Optional style-related compile options.
	 * @returns Subtree entries in preorder depth-first order.
	 */
	export const listSubtreesFromSource: (source: string, options: Pick<CompileOptions, 'styleSource' | 'ignoreSourceStyle'> | null) => readonly SubtreeEntry[]
	/**
	 * Resolve a named style pack.
	 * @param name Style pack name.
	 * @returns Style pack text when found.
	 */
	export const getStylePack: (name: string) => string | undefined
}
