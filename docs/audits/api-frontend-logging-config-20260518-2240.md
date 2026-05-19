# TSF++ Audit — api,frontend

**Target:** api,frontend
**Focus:** logging,config
**Standard:** @tsfpp/standard v1.3.0
**Date:** 2026-05-18 22:40
**Status:** ✅ Resolved

---

## Summary

All 5 slices have been remediated. All originally reported logging/config MUST violations are resolved.

| Category    | Violations | Deviations | Passed | N/A |
|-------------|-----------|------------|--------|-----|
| Types       | 0         | 0          | 5      | 0   |
| Purity      | 0         | 0          | 5      | 0   |
| Boundary    | 0         | 0          | 5      | 0   |
| Annotations | 0         | 0          | 5      | 0   |
| Complexity  | 0         | 3          | 2      | 3   |
| Prelude     | 0         | 0          | 5      | 0   |
| React       | 0         | 3          | 3      | 2   |
| Data        | 0         | 0          | 0      | 5   |
| Security    | 0         | 0          | 5      | 0   |
| Tests       | 0         | 0          | 0      | 5   |

Resolved changes:
1. Added dedicated API config parsing and validation module and removed direct runtime env access from application paths.
2. Migrated frontend debug logging to a Prelude Logger-port based adapter.
3. Converted frontend logging event messages to dot-separated event names.

_N/A — focus not applicable to this target (e.g. React row when no `.tsx` files in scope)_

---

## Slices

| # | Path | Status |
|---|------|--------|
| 1 | `api/src/server.ts` | ✅ |
| 2 | `frontend/src/logging/logger.ts` | ✅ |
| 3 | `frontend/src/App.tsx` | ✅ |
| 4 | `frontend/src/hooks/useLocalStoragePersistence.ts` | ✅ |
| 5 | `frontend/src/hooks/usePreviewViewport.ts` | ✅ |

---

<!-- Slices are appended below as the audit progresses -->

### Slice 1 — `api/src/server.ts`

**Status:** ✅ Fixed

#### Resolved findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| config-1 | `line 31` | MUST | `process.env['HOST']` is accessed directly in application module; environment access is restricted to a dedicated config loader. |
| config-1 | `line 32` | MUST | `process.env['PORT']` is accessed directly in application module; environment access is restricted to a dedicated config loader. |
| config-1 | `line 34` | MUST | `process.env['MAX_BODY_BYTES']` is accessed directly in application module; environment access is restricted to a dedicated config loader. |
| config-1 | `line 35` | MUST | `process.env['REQUEST_TIMEOUT_MS']` is accessed directly in application module; environment access is restricted to a dedicated config loader. |
| config-1 | `line 36` | MUST | `process.env['RATE_LIMIT_WINDOW_MS']` is accessed directly in application module; environment access is restricted to a dedicated config loader. |
| config-1 | `line 37` | MUST | `process.env['RATE_LIMIT_MAX_REQUESTS']` is accessed directly in application module; environment access is restricted to a dedicated config loader. |
| config-1 | `line 286` | MUST | `process.env['NODE_ENV']` is accessed directly in application module; environment access is restricted to a dedicated config loader. |

#### Checklist

**Types and ADTs (§1)**
- [x] 1.1 — Sum types modelled as tagged discriminated union with literal discriminant
- [x] 1.2 — Exhaustive `switch` ends in `default: return absurd(x)`
- [x] 1.3 — Nominal distinctions via branded types; only smart constructors (`mk*`, `from*`, `as*`) cast with `as`
- [x] 1.4 — No bare `interface` (or `// DEVIATION(1.4): <reason>` present)
- [x] 1.5 — No `any`; `unknown` used at I/O boundaries, narrowed in scope
- [x] 1.6 — No `!`; no `as` outside smart constructor bodies
- [x] 1.8 — No `enum`; use string literal unions or `as const`
- [x] 1.9 — No `class` · `this` · `new` · `instanceof` · `namespace`
- [x] 1.11 — Prelude ADT discriminants accessed via exported guards only (`isOk`, `isSome`)
- [x] 1.12 — Discriminant convention: `_tag` for prelude ADTs · `kind` for domain ADTs

**Immutability (§2–§3)**
- [x] 2.1 — `const` for every binding; no `let` / `var`
- [x] 2.2 — `ReadonlyArray<T>` everywhere; no mutable arrays
- [x] 2.3 — No mutating methods (`push`, `pop`, `splice`, `sort`, `reverse`, `fill`, `copyWithin`)
- [x] 2.4 — No property assignment or `delete` after construction
- [x] 2.5 — `as const` for literal narrowing and config tables
- [x] 3.x — `readonly` on every record field

**Control flow (§4)**
- [x] 4.1 — Every sum-type `switch` is exhaustive; `default: return absurd(x)`
- [x] 4.5 — No truthiness checks on non-booleans (`if (str)`, `if (value)`)
- [x] No `for` · `while` · `do..while`; use `map`, `filter`, `reduce`, `pipe`, or traversal combinators

**Pipelines and effects (§5–§6)**
- [x] 5.1 — Pipelines via `pipe` from `@tsfpp/prelude`
- [x] 6.2 — `throw` only at adapter boundaries; core uses `Result<T, E>`
- [x] 6.3 — No `null`/`undefined` propagation; use `Option<A>`
- [x] 6.6 — `Promise.allSettled` over `Promise.all` when partial failure is meaningful

**Annotations (§7 + ANNOTATION_CODING_STANDARD — cross-cutting, always checked)**
- [x] Module-level JSDoc block present on all files with public exports
- [x] Every exported symbol has a JSDoc block
- [x] `@param` describes domain constraint (not the type); `@returns` describes meaning (not the type)
- [x] `@law` present on all combinators with algebraic properties
- [x] `@example` present on smart constructors and non-obvious combinators
- [x] No comments that paraphrase the code; no commented-out code
- [x] Code markers follow `// MARKER(author, YYYY-MM-DD[, TICKET]): description` format
- [x] Every `eslint-disable` paired with a `// DEVIATION(N.M): <reason>` comment
- [x] For full annotation audit: use `focus=annotations`

**Security (SECURITY_CODING_STANDARD — cross-cutting, always checked)**
- [x] No secrets, credentials, or tokens in source code or committed config
- [x] No sensitive data (PII, credentials, tokens) in error messages or log output
- [x] No `eval`, `Function()`, or dynamic `import()` with user-controlled input
- [x] User input not reflected in error responses without sanitisation
- [x] For full security audit: use `focus=security`

**Boundary and parse (§8)**
- [x] 8.4 — Parse, don't validate: `unknown` converted to domain types at the boundary via smart constructors or Zod

**Size limits (§11)**
- [x] 11.1 — One type / one responsibility per file
- [x] 11.2 — File ≤ 400 LOC (800 absolute max with deviation)
- [x] Function body ≤ 40 lines · cyclomatic complexity ≤ 10 · nesting ≤ 4 · arity ≤ 3

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| — | — | No additional deviations applicable to logging/config findings in this slice. |

### Slice 2 — `frontend/src/logging/logger.ts`

**Status:** ✅ Fixed

#### Resolved findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| log-2 | `line 22` | MUST | Concrete logger library (`consola`) is imported and used directly instead of depending on the `Logger` port from `@tsfpp/prelude`. |

#### Checklist

**Types and ADTs (§1)**
- [x] 1.1 — Sum types modelled as tagged discriminated union with literal discriminant
- [x] 1.2 — Exhaustive `switch` ends in `default: return absurd(x)`
- [x] 1.3 — Nominal distinctions via branded types; only smart constructors (`mk*`, `from*`, `as*`) cast with `as`
- [x] 1.4 — No bare `interface` (or `// DEVIATION(1.4): <reason>` present)
- [x] 1.5 — No `any`; `unknown` used at I/O boundaries, narrowed in scope
- [x] 1.6 — No `!`; no `as` outside smart constructor bodies
- [x] 1.8 — No `enum`; use string literal unions or `as const`
- [x] 1.9 — No `class` · `this` · `new` · `instanceof` · `namespace`
- [x] 1.11 — Prelude ADT discriminants accessed via exported guards only (`isOk`, `isSome`)
- [x] 1.12 — Discriminant convention: `_tag` for prelude ADTs · `kind` for domain ADTs

**Immutability (§2–§3)**
- [x] 2.1 — `const` for every binding; no `let` / `var`
- [x] 2.2 — `ReadonlyArray<T>` everywhere; no mutable arrays
- [x] 2.3 — No mutating methods (`push`, `pop`, `splice`, `sort`, `reverse`, `fill`, `copyWithin`)
- [x] 2.4 — No property assignment or `delete` after construction
- [x] 2.5 — `as const` for literal narrowing and config tables
- [x] 3.x — `readonly` on every record field

**Control flow (§4)**
- [x] 4.1 — Every sum-type `switch` is exhaustive; `default: return absurd(x)`
- [x] 4.5 — No truthiness checks on non-booleans (`if (str)`, `if (value)`)
- [x] No `for` · `while` · `do..while`; use `map`, `filter`, `reduce`, `pipe`, or traversal combinators

**Pipelines and effects (§5–§6)**
- [x] 5.1 — Pipelines via `pipe` from `@tsfpp/prelude`
- [x] 6.2 — `throw` only at adapter boundaries; core uses `Result<T, E>`
- [x] 6.3 — No `null`/`undefined` propagation; use `Option<A>`
- [x] 6.6 — `Promise.allSettled` over `Promise.all` when partial failure is meaningful

**Annotations (§7 + ANNOTATION_CODING_STANDARD — cross-cutting, always checked)**
- [x] Module-level JSDoc block present on all files with public exports
- [x] Every exported symbol has a JSDoc block
- [x] `@param` describes domain constraint (not the type); `@returns` describes meaning (not the type)
- [x] `@law` present on all combinators with algebraic properties
- [x] `@example` present on smart constructors and non-obvious combinators
- [x] No comments that paraphrase the code; no commented-out code
- [x] Code markers follow `// MARKER(author, YYYY-MM-DD[, TICKET]): description` format
- [x] Every `eslint-disable` paired with a `// DEVIATION(N.M): <reason>` comment
- [x] For full annotation audit: use `focus=annotations`

**Security (SECURITY_CODING_STANDARD — cross-cutting, always checked)**
- [x] No secrets, credentials, or tokens in source code or committed config
- [x] No sensitive data (PII, credentials, tokens) in error messages or log output
- [x] No `eval`, `Function()`, or dynamic `import()` with user-controlled input
- [x] User input not reflected in error responses without sanitisation
- [x] For full security audit: use `focus=security`

**Boundary and parse (§8)**
- [x] 8.4 — Parse, don't validate: `unknown` converted to domain types at the boundary via smart constructors or Zod

**Size limits (§11)**
- [x] 11.1 — One type / one responsibility per file
- [x] 11.2 — File ≤ 400 LOC (800 absolute max with deviation)
- [x] Function body ≤ 40 lines · cyclomatic complexity ≤ 10 · nesting ≤ 4 · arity ≤ 3

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| — | — | No deviations covering the logging-port violation in this slice. |

### Slice 3 — `frontend/src/App.tsx`

**Status:** ✅ Fixed

#### Resolved findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| log-4 | `line 179` | MUST | Event message `'explicit session save failed'` is not in required dot-separated event-name format. |
| log-4 | `line 585` | MUST | Event message `'compile success'` is not in required dot-separated event-name format. |
| log-4 | `line 596` | MUST | Event message `'compile error'` is not in required dot-separated event-name format. |

#### Checklist

**Types and ADTs (§1)**
- [x] 1.1 — Sum types modelled as tagged discriminated union with literal discriminant
- [x] 1.2 — Exhaustive `switch` ends in `default: return absurd(x)`
- [x] 1.3 — Nominal distinctions via branded types; only smart constructors (`mk*`, `from*`, `as*`) cast with `as`
- [x] 1.4 — No bare `interface` (or `// DEVIATION(1.4): <reason>` present)
- [x] 1.5 — No `any`; `unknown` used at I/O boundaries, narrowed in scope
- [x] 1.6 — No `!`; no `as` outside smart constructor bodies
- [x] 1.8 — No `enum`; use string literal unions or `as const`
- [x] 1.9 — No `class` · `this` · `new` · `instanceof` · `namespace`
- [x] 1.11 — Prelude ADT discriminants accessed via exported guards only (`isOk`, `isSome`)
- [x] 1.12 — Discriminant convention: `_tag` for prelude ADTs · `kind` for domain ADTs

**Immutability (§2–§3)**
- [x] 2.1 — `const` for every binding; no `let` / `var`
- [x] 2.2 — `ReadonlyArray<T>` everywhere; no mutable arrays
- [x] 2.3 — No mutating methods (`push`, `pop`, `splice`, `sort`, `reverse`, `fill`, `copyWithin`)
- [x] 2.4 — No property assignment or `delete` after construction
- [x] 2.5 — `as const` for literal narrowing and config tables
- [x] 3.x — `readonly` on every record field

**Control flow (§4)**
- [x] 4.1 — Every sum-type `switch` is exhaustive; `default: return absurd(x)`
- [x] 4.5 — No truthiness checks on non-booleans (`if (str)`, `if (value)`)
- [x] No `for` · `while` · `do..while`; use `map`, `filter`, `reduce`, `pipe`, or traversal combinators

**Pipelines and effects (§5–§6)**
- [x] 5.1 — Pipelines via `pipe` from `@tsfpp/prelude`
- [x] 6.2 — `throw` only at adapter boundaries; core uses `Result<T, E>`
- [x] 6.3 — No `null`/`undefined` propagation; use `Option<A>`
- [x] 6.6 — `Promise.allSettled` over `Promise.all` when partial failure is meaningful

**Annotations (§7 + ANNOTATION_CODING_STANDARD — cross-cutting, always checked)**
- [x] Module-level JSDoc block present on all files with public exports
- [x] Every exported symbol has a JSDoc block
- [x] `@param` describes domain constraint (not the type); `@returns` describes meaning (not the type)
- [x] `@law` present on all combinators with algebraic properties
- [x] `@example` present on smart constructors and non-obvious combinators
- [x] No comments that paraphrase the code; no commented-out code
- [x] Code markers follow `// MARKER(author, YYYY-MM-DD[, TICKET]): description` format
- [x] Every `eslint-disable` paired with a `// DEVIATION(N.M): <reason>` comment
- [x] For full annotation audit: use `focus=annotations`

**Security (SECURITY_CODING_STANDARD — cross-cutting, always checked)**
- [x] No secrets, credentials, or tokens in source code or committed config
- [x] No sensitive data (PII, credentials, tokens) in error messages or log output
- [x] No `eval`, `Function()`, or dynamic `import()` with user-controlled input
- [x] User input not reflected in error responses without sanitisation
- [x] For full security audit: use `focus=security`

**Boundary and parse (§8)**
- [x] 8.4 — Parse, don't validate: `unknown` converted to domain types at the boundary via smart constructors or Zod

**Size limits (§11)**
- [x] 11.1 — One type / one responsibility per file
- [x] 11.2 — File ≤ 400 LOC (800 absolute max with deviation)
- [x] Function body ≤ 40 lines · cyclomatic complexity ≤ 10 · nesting ≤ 4 · arity ≤ 3

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| DEVIATION(11.2) | `236` | Root component size exception documented in code. |
| DEVIATION(11.1) | `237` | Composition-point scope exception documented in code. |

### Slice 4 — `frontend/src/hooks/useLocalStoragePersistence.ts`

**Status:** ✅ Fixed

#### Resolved findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| log-4 | `line 52` | MUST | Event message `'persist source failed'` is not in required dot-separated event-name format. |
| log-4 | `line 59` | MUST | Event message `'persist editor panel width failed'` is not in required dot-separated event-name format. |
| log-4 | `line 67` | MUST | Event message `'persist editor font size failed'` is not in required dot-separated event-name format. |
| log-4 | `line 75` | MUST | Event message `'persist print page format failed'` is not in required dot-separated event-name format. |
| log-4 | `line 83` | MUST | Event message `'persist theme preference failed'` is not in required dot-separated event-name format. |
| log-4 | `line 91` | MUST | Event message `'persist style pack preference failed'` is not in required dot-separated event-name format. |

#### Checklist

**Types and ADTs (§1)**
- [x] 1.1 — Sum types modelled as tagged discriminated union with literal discriminant
- [x] 1.2 — Exhaustive `switch` ends in `default: return absurd(x)`
- [x] 1.3 — Nominal distinctions via branded types; only smart constructors (`mk*`, `from*`, `as*`) cast with `as`
- [x] 1.4 — No bare `interface` (or `// DEVIATION(1.4): <reason>` present)
- [x] 1.5 — No `any`; `unknown` used at I/O boundaries, narrowed in scope
- [x] 1.6 — No `!`; no `as` outside smart constructor bodies
- [x] 1.8 — No `enum`; use string literal unions or `as const`
- [x] 1.9 — No `class` · `this` · `new` · `instanceof` · `namespace`
- [x] 1.11 — Prelude ADT discriminants accessed via exported guards only (`isOk`, `isSome`)
- [x] 1.12 — Discriminant convention: `_tag` for prelude ADTs · `kind` for domain ADTs

**Immutability (§2–§3)**
- [x] 2.1 — `const` for every binding; no `let` / `var`
- [x] 2.2 — `ReadonlyArray<T>` everywhere; no mutable arrays
- [x] 2.3 — No mutating methods (`push`, `pop`, `splice`, `sort`, `reverse`, `fill`, `copyWithin`)
- [x] 2.4 — No property assignment or `delete` after construction
- [x] 2.5 — `as const` for literal narrowing and config tables
- [x] 3.x — `readonly` on every record field

**Control flow (§4)**
- [x] 4.1 — Every sum-type `switch` is exhaustive; `default: return absurd(x)`
- [x] 4.5 — No truthiness checks on non-booleans (`if (str)`, `if (value)`)
- [x] No `for` · `while` · `do..while`; use `map`, `filter`, `reduce`, `pipe`, or traversal combinators

**Pipelines and effects (§5–§6)**
- [x] 5.1 — Pipelines via `pipe` from `@tsfpp/prelude`
- [x] 6.2 — `throw` only at adapter boundaries; core uses `Result<T, E>`
- [x] 6.3 — No `null`/`undefined` propagation; use `Option<A>`
- [x] 6.6 — `Promise.allSettled` over `Promise.all` when partial failure is meaningful

**Annotations (§7 + ANNOTATION_CODING_STANDARD — cross-cutting, always checked)**
- [x] Module-level JSDoc block present on all files with public exports
- [x] Every exported symbol has a JSDoc block
- [x] `@param` describes domain constraint (not the type); `@returns` describes meaning (not the type)
- [x] `@law` present on all combinators with algebraic properties
- [x] `@example` present on smart constructors and non-obvious combinators
- [x] No comments that paraphrase the code; no commented-out code
- [x] Code markers follow `// MARKER(author, YYYY-MM-DD[, TICKET]): description` format
- [x] Every `eslint-disable` paired with a `// DEVIATION(N.M): <reason>` comment
- [x] For full annotation audit: use `focus=annotations`

**Security (SECURITY_CODING_STANDARD — cross-cutting, always checked)**
- [x] No secrets, credentials, or tokens in source code or committed config
- [x] No sensitive data (PII, credentials, tokens) in error messages or log output
- [x] No `eval`, `Function()`, or dynamic `import()` with user-controlled input
- [x] User input not reflected in error responses without sanitisation
- [x] For full security audit: use `focus=security`

**Boundary and parse (§8)**
- [x] 8.4 — Parse, don't validate: `unknown` converted to domain types at the boundary via smart constructors or Zod

**Size limits (§11)**
- [x] 11.1 — One type / one responsibility per file
- [x] 11.2 — File ≤ 400 LOC (800 absolute max with deviation)
- [x] Function body ≤ 40 lines · cyclomatic complexity ≤ 10 · nesting ≤ 4 · arity ≤ 3

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| — | — | No deviations covering the logging event-format violations in this slice. |

### Slice 5 — `frontend/src/hooks/usePreviewViewport.ts`

**Status:** ✅ Fixed

#### Resolved findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| log-4 | `line 125` | MUST | Event message `'persist preview zoom failed'` is not in required dot-separated event-name format. |
| log-4 | `line 130` | MUST | Event message `'persist preview offset failed'` is not in required dot-separated event-name format. |

#### Checklist

**Types and ADTs (§1)**
- [x] 1.1 — Sum types modelled as tagged discriminated union with literal discriminant
- [x] 1.2 — Exhaustive `switch` ends in `default: return absurd(x)`
- [x] 1.3 — Nominal distinctions via branded types; only smart constructors (`mk*`, `from*`, `as*`) cast with `as`
- [x] 1.4 — No bare `interface` (or `// DEVIATION(1.4): <reason>` present)
- [x] 1.5 — No `any`; `unknown` used at I/O boundaries, narrowed in scope
- [x] 1.6 — No `!`; no `as` outside smart constructor bodies
- [x] 1.8 — No `enum`; use string literal unions or `as const`
- [x] 1.9 — No `class` · `this` · `new` · `instanceof` · `namespace`
- [x] 1.11 — Prelude ADT discriminants accessed via exported guards only (`isOk`, `isSome`)
- [x] 1.12 — Discriminant convention: `_tag` for prelude ADTs · `kind` for domain ADTs

**Immutability (§2–§3)**
- [x] 2.1 — `const` for every binding; no `let` / `var`
- [x] 2.2 — `ReadonlyArray<T>` everywhere; no mutable arrays
- [x] 2.3 — No mutating methods (`push`, `pop`, `splice`, `sort`, `reverse`, `fill`, `copyWithin`)
- [x] 2.4 — No property assignment or `delete` after construction
- [x] 2.5 — `as const` for literal narrowing and config tables
- [x] 3.x — `readonly` on every record field

**Control flow (§4)**
- [x] 4.1 — Every sum-type `switch` is exhaustive; `default: return absurd(x)`
- [x] 4.5 — No truthiness checks on non-booleans (`if (str)`, `if (value)`)
- [x] No `for` · `while` · `do..while`; use `map`, `filter`, `reduce`, `pipe`, or traversal combinators

**Pipelines and effects (§5–§6)**
- [x] 5.1 — Pipelines via `pipe` from `@tsfpp/prelude`
- [x] 6.2 — `throw` only at adapter boundaries; core uses `Result<T, E>`
- [x] 6.3 — No `null`/`undefined` propagation; use `Option<A>`
- [x] 6.6 — `Promise.allSettled` over `Promise.all` when partial failure is meaningful

**Annotations (§7 + ANNOTATION_CODING_STANDARD — cross-cutting, always checked)**
- [x] Module-level JSDoc block present on all files with public exports
- [x] Every exported symbol has a JSDoc block
- [x] `@param` describes domain constraint (not the type); `@returns` describes meaning (not the type)
- [x] `@law` present on all combinators with algebraic properties
- [x] `@example` present on smart constructors and non-obvious combinators
- [x] No comments that paraphrase the code; no commented-out code
- [x] Code markers follow `// MARKER(author, YYYY-MM-DD[, TICKET]): description` format
- [x] Every `eslint-disable` paired with a `// DEVIATION(N.M): <reason>` comment
- [x] For full annotation audit: use `focus=annotations`

**Security (SECURITY_CODING_STANDARD — cross-cutting, always checked)**
- [x] No secrets, credentials, or tokens in source code or committed config
- [x] No sensitive data (PII, credentials, tokens) in error messages or log output
- [x] No `eval`, `Function()`, or dynamic `import()` with user-controlled input
- [x] User input not reflected in error responses without sanitisation
- [x] For full security audit: use `focus=security`

**Boundary and parse (§8)**
- [x] 8.4 — Parse, don't validate: `unknown` converted to domain types at the boundary via smart constructors or Zod

**Size limits (§11)**
- [x] 11.1 — One type / one responsibility per file
- [x] 11.2 — File ≤ 400 LOC (800 absolute max with deviation)
- [x] Function body ≤ 40 lines · cyclomatic complexity ≤ 10 · nesting ≤ 4 · arity ≤ 3

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| DEVIATION(11.1) | `76` | Hook combines tightly coupled viewport interaction concerns as documented. |
