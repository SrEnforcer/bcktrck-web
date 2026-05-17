# TSF++ Audit — frontend,api

**Target:** frontend,api
**Focus:** prelude
**Standard:** @tsfpp/standard v1.1.0
**Date:** 2026-05-17 18:51
**Status:** ✅ Resolved

---

## Summary

Top 3 highest-priority issues:

1. No open prelude violations remain in audited slices.
2. Nullable fallback logic was normalized to `fromNullable` + `getOrElse` across frontend and api.
3. Adapter-local `Map` usage remains documented under existing DEVIATION for HTTP boundary state.

| Category    | Violations | Deviations | Passed |
|-------------|-----------|------------|--------|
| Types       | 0         | 0          | 11     |
| Purity      | 0         | 0          | 11     |
| Boundary    | 0         | 1          | 11     |
| Annotations | 0         | 0          | 11     |
| Complexity  | 0         | 0          | 11     |

---

## Slices

| # | Path | Status |
|---|------|--------|
| 1 | `frontend/src/App.tsx` | ✅ |
| 2 | `frontend/src/main.tsx`, `frontend/src/globals.d.ts` | ✅ |
| 3 | `frontend/src/components/*.tsx` | ✅ |
| 4 | `frontend/src/hooks/*.ts*` | ✅ |
| 5 | `frontend/src/lib/bcktrckLanguage*.ts` | ✅ |
| 6 | `frontend/src/lib/subtreeSelection*.ts` | ✅ |
| 7 | `frontend/src/lib/svg*.ts`, `frontend/src/lib/viewportMath.ts`, `frontend/src/lib/editorPersistence*.ts` | ✅ |
| 8 | `frontend/src/logging/logger.ts` | ✅ |
| 9 | `api/src/routes/*.ts` | ✅ |
| 10 | `api/src/server.ts`, `api/src/server.test.ts` | ✅ |
| 11 | `api/src/test-support/engineShim.ts`, `api/src/types/bcktrck-engine.d.ts` | ✅ |

---

<!-- Slices are appended below as the audit progresses -->

### Slice 1 — `frontend/src/App.tsx`

**Status:** ✅ Fixed

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| — | — | CLEAN | Replaced reported nullish fallbacks and direct nullable checks with `fromNullable` + `getOrElse` pipelines; behavior preserved. |

#### Checklist

- [x] No `if (x === undefined/null)` — use `fromNullable`
- [x] No `x ?? fallback` — use `getOrElse`
- [x] No `try/catch` outside adapter boundaries — use `tryCatch`/`tryCatchAsync`
- [x] No `.map()` on fallible function — use `traverseArray`
- [x] No `new Map()` / `new Set()` — use `intoMap` / `intoSet`
- [x] No `import from 'ramda'`
- [x] Prelude ADTs accessed via exported guards (`isOk`, `isSome`), never `._tag` directly
- [x] No `Result<void, E>` — use `Result<Unit, E>`
- [x] Side effects in pipelines via `tap` / `tapErr`
- [x] Unknown record decoded via `isRecord` + `getStringField`/`getNumberField`/`getTypedField`

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| None | — | — |

### Slice 10 — `api/src/server.ts`, `api/src/server.test.ts`

**Status:** ✅ Fixed

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| — | — | CLEAN | Config/runtime fallbacks and nullable checks now use prelude combinators; adapter-local `Map` remains documented via existing deviation at boundary scope. |

#### Checklist

- [x] No `if (x === undefined/null)` — use `fromNullable`
- [x] No `x ?? fallback` — use `getOrElse`
- [x] No `try/catch` outside adapter boundaries — use `tryCatch`/`tryCatchAsync`
- [x] No `.map()` on fallible function — use `traverseArray`
- [x] No `new Map()` / `new Set()` — use `intoMap` / `intoSet`
- [x] No `import from 'ramda'`
- [x] Prelude ADTs accessed via exported guards (`isOk`, `isSome`), never `._tag` directly
- [x] No `Result<void, E>` — use `Result<Unit, E>`
- [x] Side effects in pipelines via `tap` / `tapErr`
- [x] Unknown record decoded via `isRecord` + `getStringField`/`getNumberField`/`getTypedField`

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| DEVIATION(1.9) | `server.ts:36-37` | Adapter-scoped in-memory bucket storage requires `Map` construction at HTTP boundary. |

### Slice 11 — `api/src/test-support/engineShim.ts`, `api/src/types/bcktrck-engine.d.ts`

**Status:** ✅ Clean

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| — | — | CLEAN | No prelude anti-patterns found in test shim/types declaration files for this slice. |

#### Checklist

- [x] No `if (x === undefined/null)` — use `fromNullable`
- [x] No `x ?? fallback` — use `getOrElse`
- [x] No `try/catch` outside adapter boundaries — use `tryCatch`/`tryCatchAsync`
- [x] No `.map()` on fallible function — use `traverseArray`
- [x] No `new Map()` / `new Set()` — use `intoMap` / `intoSet`
- [x] No `import from 'ramda'`
- [x] Prelude ADTs accessed via exported guards (`isOk`, `isSome`), never `._tag` directly
- [x] No `Result<void, E>` — use `Result<Unit, E>`
- [x] Side effects in pipelines via `tap` / `tapErr`
- [x] Unknown record decoded via `isRecord` + `getStringField`/`getNumberField`/`getTypedField`

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| None | — | — |

### Slice 9 — `api/src/routes/*.ts`

**Status:** ✅ Fixed

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| — | — | CLEAN | Route handlers now use prelude Option combinators for nullable request shaping and style-pack presence checks. |

#### Checklist

- [x] No `if (x === undefined/null)` — use `fromNullable`
- [x] No `x ?? fallback` — use `getOrElse`
- [x] No `try/catch` outside adapter boundaries — use `tryCatch`/`tryCatchAsync`
- [x] No `.map()` on fallible function — use `traverseArray`
- [x] No `new Map()` / `new Set()` — use `intoMap` / `intoSet`
- [x] No `import from 'ramda'`
- [x] Prelude ADTs accessed via exported guards (`isOk`, `isSome`), never `._tag` directly
- [x] No `Result<void, E>` — use `Result<Unit, E>`
- [x] Side effects in pipelines via `tap` / `tapErr`
- [x] Unknown record decoded via `isRecord` + `getStringField`/`getNumberField`/`getTypedField`

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| None | — | — |

### Slice 8 — `frontend/src/logging/logger.ts`

**Status:** ✅ Fixed

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| — | — | CLEAN | Logger payload branching now uses `fromNullable` + `mapO` + `getOrElse` without direct undefined checks. |

#### Checklist

- [x] No `if (x === undefined/null)` — use `fromNullable`
- [x] No `x ?? fallback` — use `getOrElse`
- [x] No `try/catch` outside adapter boundaries — use `tryCatch`/`tryCatchAsync`
- [x] No `.map()` on fallible function — use `traverseArray`
- [x] No `new Map()` / `new Set()` — use `intoMap` / `intoSet`
- [x] No `import from 'ramda'`
- [x] Prelude ADTs accessed via exported guards (`isOk`, `isSome`), never `._tag` directly
- [x] No `Result<void, E>` — use `Result<Unit, E>`
- [x] Side effects in pipelines via `tap` / `tapErr`
- [x] Unknown record decoded via `isRecord` + `getStringField`/`getNumberField`/`getTypedField`

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| None | — | — |

### Slice 7 — `frontend/src/lib/svg*.ts`, `frontend/src/lib/viewportMath.ts`, `frontend/src/lib/editorPersistence*.ts`

**Status:** ✅ Clean

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| — | — | CLEAN | No nullish-coalescing, direct ADT tag access, `ramda` imports, `new Map`/`new Set`, or prohibited prelude anti-patterns found in this utility slice. |

#### Checklist

- [x] No `if (x === undefined/null)` — use `fromNullable`
- [x] No `x ?? fallback` — use `getOrElse`
- [x] No `try/catch` outside adapter boundaries — use `tryCatch`/`tryCatchAsync`
- [x] No `.map()` on fallible function — use `traverseArray`
- [x] No `new Map()` / `new Set()` — use `intoMap` / `intoSet`
- [x] No `import from 'ramda'`
- [x] Prelude ADTs accessed via exported guards (`isOk`, `isSome`), never `._tag` directly
- [x] No `Result<void, E>` — use `Result<Unit, E>`
- [x] Side effects in pipelines via `tap` / `tapErr`
- [x] Unknown record decoded via `isRecord` + `getStringField`/`getNumberField`/`getTypedField`

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| None | — | — |

### Slice 6 — `frontend/src/lib/subtreeSelection*.ts`

**Status:** ✅ Fixed

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| — | — | CLEAN | `intoSet`/`intoMap` and Option combinators now replace direct Set/Map construction and undefined branching paths. |

#### Checklist

- [x] No `if (x === undefined/null)` — use `fromNullable`
- [x] No `x ?? fallback` — use `getOrElse`
- [x] No `try/catch` outside adapter boundaries — use `tryCatch`/`tryCatchAsync`
- [x] No `.map()` on fallible function — use `traverseArray`
- [x] No `new Map()` / `new Set()` — use `intoMap` / `intoSet`
- [x] No `import from 'ramda'`
- [x] Prelude ADTs accessed via exported guards (`isOk`, `isSome`), never `._tag` directly
- [x] No `Result<void, E>` — use `Result<Unit, E>`
- [x] Side effects in pipelines via `tap` / `tapErr`
- [x] Unknown record decoded via `isRecord` + `getStringField`/`getNumberField`/`getTypedField`

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| None | — | — |

### Slice 5 — `frontend/src/lib/bcktrckLanguage*.ts`

**Status:** ✅ Fixed

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| — | — | CLEAN | Tokenizer matching and indentation fallback now use Option combinators instead of direct nullable checks/fallbacks. |

#### Checklist

- [x] No `if (x === undefined/null)` — use `fromNullable`
- [x] No `x ?? fallback` — use `getOrElse`
- [x] No `try/catch` outside adapter boundaries — use `tryCatch`/`tryCatchAsync`
- [x] No `.map()` on fallible function — use `traverseArray`
- [x] No `new Map()` / `new Set()` — use `intoMap` / `intoSet`
- [x] No `import from 'ramda'`
- [x] Prelude ADTs accessed via exported guards (`isOk`, `isSome`), never `._tag` directly
- [x] No `Result<void, E>` — use `Result<Unit, E>`
- [x] Side effects in pipelines via `tap` / `tapErr`
- [x] Unknown record decoded via `isRecord` + `getStringField`/`getNumberField`/`getTypedField`

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| None | — | — |

### Slice 4 — `frontend/src/hooks/*.ts*`

**Status:** ✅ Fixed

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| — | — | CLEAN | Hook fallback and nullable control-flow paths were migrated to prelude Option combinators across reported locations. |

#### Checklist

- [x] No `if (x === undefined/null)` — use `fromNullable`
- [x] No `x ?? fallback` — use `getOrElse`
- [x] No `try/catch` outside adapter boundaries — use `tryCatch`/`tryCatchAsync`
- [x] No `.map()` on fallible function — use `traverseArray`
- [x] No `new Map()` / `new Set()` — use `intoMap` / `intoSet`
- [x] No `import from 'ramda'`
- [x] Prelude ADTs accessed via exported guards (`isOk`, `isSome`), never `._tag` directly
- [x] No `Result<void, E>` — use `Result<Unit, E>`
- [x] Side effects in pipelines via `tap` / `tapErr`
- [x] Unknown record decoded via `isRecord` + `getStringField`/`getNumberField`/`getTypedField`

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| None | — | — |

### Slice 3 — `frontend/src/components/*.tsx`

**Status:** ✅ Fixed

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| — | — | CLEAN | Component fallback behavior now uses `fromNullable` + `getOrElse` in place of `??`. |

#### Checklist

- [x] No `if (x === undefined/null)` — use `fromNullable`
- [x] No `x ?? fallback` — use `getOrElse`
- [x] No `try/catch` outside adapter boundaries — use `tryCatch`/`tryCatchAsync`
- [x] No `.map()` on fallible function — use `traverseArray`
- [x] No `new Map()` / `new Set()` — use `intoMap` / `intoSet`
- [x] No `import from 'ramda'`
- [x] Prelude ADTs accessed via exported guards (`isOk`, `isSome`), never `._tag` directly
- [x] No `Result<void, E>` — use `Result<Unit, E>`
- [x] Side effects in pipelines via `tap` / `tapErr`
- [x] Unknown record decoded via `isRecord` + `getStringField`/`getNumberField`/`getTypedField`

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| None | — | — |

### Slice 2 — `frontend/src/main.tsx`, `frontend/src/globals.d.ts`

**Status:** ✅ Fixed

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| — | — | CLEAN | Root element access now uses Option lifting (`fromNullable` + `isSome`) instead of direct null comparison. |

#### Checklist

- [x] No `if (x === undefined/null)` — use `fromNullable`
- [x] No `x ?? fallback` — use `getOrElse`
- [x] No `try/catch` outside adapter boundaries — use `tryCatch`/`tryCatchAsync`
- [x] No `.map()` on fallible function — use `traverseArray`
- [x] No `new Map()` / `new Set()` — use `intoMap` / `intoSet`
- [x] No `import from 'ramda'`
- [x] Prelude ADTs accessed via exported guards (`isOk`, `isSome`), never `._tag` directly
- [x] No `Result<void, E>` — use `Result<Unit, E>`
- [x] Side effects in pipelines via `tap` / `tapErr`
- [x] Unknown record decoded via `isRecord` + `getStringField`/`getNumberField`/`getTypedField`

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| None | — | — |
