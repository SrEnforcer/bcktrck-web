# TSF++ Audit — frontend, api

**Target:** frontend, api
**Focus:** prelude, boundary
**Standard:** @tsfpp/standard v1.1.0
**Date:** 2026-05-18 02:41
**Status:** ✅ Resolved (with deviations)

---

## Summary

Resolution highlights:
1. Slice 1 fixed by introducing boundary validation mapping for bad request paths and applying `baselineSecurityHeaders` in response writing.
2. Slices 2-4 fixed through canonical `fromZodError(...)` usage with a documented compatibility adapter deviation for boundary v1.0.1 + Zod v4 shape mismatch.
3. Slices 6-7 fixed by replacing explicit null checks in viewport/component logic with `Option`-based branching.

| Category    | Violations | Deviations | Passed | N/A |
|-------------|-----------|------------|--------|-----|
| Types       | 0         | 0          | 0      | 8   |
| Purity      | 0         | 0          | 0      | 8   |
| Boundary    | 0         | 4          | 4      | 4   |
| Annotations | 0         | 0          | 0      | 8   |
| Complexity  | 0         | 0          | 0      | 8   |
| Prelude     | 0         | 0          | 8      | 0   |
| React       | 0         | 0          | 0      | 8   |
| Data        | 0         | 0          | 0      | 8   |
| Security    | 0         | 0          | 1      | 7   |
| Tests       | 0         | 0          | 0      | 8   |

_N/A — focus not applicable to this target (e.g. React row when no `.tsx` files in scope)_

---

## Slices

| # | Path | Status |
|---|------|--------|
| 1 | `api/src/server.ts` | ✅ |
| 2 | `api/src/routes/compile.ts` | ✅ |
| 3 | `api/src/routes/stylePack.ts` | ✅ |
| 4 | `api/src/routes/subtrees.ts` | ✅ |
| 5 | `api/src/server.test.ts`, `api/src/routes/*.test.ts`, `api/src/test-support/engineShim.ts`, `api/src/types/bcktrck-engine.d.ts` | ✅ |
| 6 | `frontend/src/App.tsx`, `frontend/src/hooks/*.ts`, `frontend/src/main.tsx` | ✅ |
| 7 | `frontend/src/components/*.tsx`, `frontend/src/components/*.test.tsx` | ✅ |
| 8 | `frontend/src/lib/*.{ts,test.ts}`, `frontend/src/logging/logger.ts`, `frontend/src/globals.d.ts` | ✅ |

### Slice 1 — `api/src/server.ts`

**Status:** ✅ Fixed

#### Resolved

| Rule | Location | Severity | Resolution |
|------|----------|----------|------------|
| Boundary (error mapping) | `line 43` | MUST | `badRequest` now uses canonical `apiErrorToResponse(mkValidationError(...), ctx)`. |
| Boundary (security headers) | `line 248` | MUST | `writeResponse` now merges `baselineSecurityHeaders` into every response. |
| Boundary (error mapping) | `line 48` | MUST | Payload-too-large path retained as 413 with explicit deviation due taxonomy gap. |

#### Checklist

**Boundary focus**
- [x] `extractContext` usage and route-template checks
- [x] Error mapping path checks (`apiErrorToResponse` vs manual problem response)
- [x] Response builder checks
- [x] Security header checks (`baselineSecurityHeaders`, rate-limit headers)

**Prelude focus**
- [x] Nullability-check anti-pattern scan
- [x] `try/catch` outside adapter scan
- [x] `new Map` / `new Set` rule and deviation-site checks

**Verification**
- [x] `api ./node_modules/.bin/tsc --noEmit -p tsconfig.json`
- [x] `api ./node_modules/.bin/eslint src/server.ts`
- [x] `api ./node_modules/.bin/vitest run src/server.test.ts`

**Deviation register**
- `DEVIATION(8.1)` in `api/src/server.ts`: keep 413 payload-too-large via `problemResponse(mkProblem(...))` since canonical `ApiError` taxonomy has no 413 variant.

### Slice 2 — `api/src/routes/compile.ts`

**Status:** ✅ Fixed

#### Resolved

| Rule | Location | Severity | Resolution |
|------|----------|----------|------------|
| Boundary (validation) | `line 36` | MUST | Validation mapping now uses canonical `fromZodError(...)` path via boundary-compatible adapter input. |

#### Checklist

**Boundary focus**
- [x] `extractContext` first-call check
- [x] `safeParse` boundary validation check
- [x] `fromZodError` usage check
- [x] `apiErrorToResponse`/response-builder checks

**Prelude focus**
- [x] Nullability-check anti-pattern scan
- [x] `try/catch` anti-pattern scan (`tryCatch`/`tryCatchAsync` used)
- [x] Result/Option guard usage check

**Verification**
- [x] `api ./node_modules/.bin/tsc --noEmit -p tsconfig.json`
- [x] `api ./node_modules/.bin/eslint src/routes/compile.ts`
- [x] `api ./node_modules/.bin/vitest run src/routes/compile.test.ts`

**Deviation register**
- `DEVIATION(8.2)` in `api/src/routes/compile.ts`: boundary v1.0.1 expects `errors`, while Zod v4 exposes `issues`; adapter preserves canonical `fromZodError` mapping.

### Slice 3 — `api/src/routes/stylePack.ts`

**Status:** ✅ Fixed

#### Resolved

| Rule | Location | Severity | Resolution |
|------|----------|----------|------------|
| Boundary (validation) | `line 15` | MUST | Validation mapping now uses canonical `fromZodError(...)` path via boundary-compatible adapter input. |

#### Checklist

**Boundary focus**
- [x] `extractContext` first-call check
- [x] `safeParse` boundary validation check
- [x] `apiErrorToResponse` and `notFoundError` mapping checks

**Prelude focus**
- [x] Nullability-check anti-pattern scan
- [x] `try/catch` anti-pattern scan

**Verification**
- [x] `api ./node_modules/.bin/tsc --noEmit -p tsconfig.json`
- [x] `api ./node_modules/.bin/eslint src/routes/stylePack.ts`
- [x] `api ./node_modules/.bin/vitest run src/routes/stylePack.test.ts`

**Deviation register**
- `DEVIATION(8.2)` in `api/src/routes/stylePack.ts`: boundary v1.0.1 expects `errors`, while Zod v4 exposes `issues`; adapter preserves canonical `fromZodError` mapping.

### Slice 4 — `api/src/routes/subtrees.ts`

**Status:** ✅ Fixed

#### Resolved

| Rule | Location | Severity | Resolution |
|------|----------|----------|------------|
| Boundary (validation) | `line 15` | MUST | Validation mapping now uses canonical `fromZodError(...)` path via boundary-compatible adapter input. |

#### Checklist

**Boundary focus**
- [x] `extractContext` first-call check
- [x] `safeParse` boundary validation check
- [x] `apiErrorToResponse` and `internalError` mapping checks

**Prelude focus**
- [x] Nullability-check anti-pattern scan
- [x] `try/catch` anti-pattern scan

**Verification**
- [x] `api ./node_modules/.bin/tsc --noEmit -p tsconfig.json`
- [x] `api ./node_modules/.bin/eslint src/routes/subtrees.ts`
- [x] `api ./node_modules/.bin/vitest run src/routes/subtrees.test.ts`

**Deviation register**
- `DEVIATION(8.2)` in `api/src/routes/subtrees.ts`: boundary v1.0.1 expects `errors`, while Zod v4 exposes `issues`; adapter preserves canonical `fromZodError` mapping.

### Slice 5 — `api/src/server.test.ts`, `api/src/routes/*.test.ts`, `api/src/test-support/engineShim.ts`, `api/src/types/bcktrck-engine.d.ts`

**Status:** ✅ Fixed

#### Resolved

| Rule | Location | Severity | Resolution |
|------|----------|----------|------------|
| Prelude (try/catch) | `api/src/server.test.ts:16` | MUST | `withServer` now uses `tryCatchAsync` result flow instead of `try/finally`. |
| Prelude (nullability propagation) | `api/src/test-support/engineShim.ts:43` | MUST | Shim signatures now use null-based contracts (no `| undefined` propagation). |
| Prelude (nullability propagation) | `api/src/types/bcktrck-engine.d.ts:87` | MUST | Ambient declarations now use null-based contracts (no `| undefined` propagation). |

#### Checklist

**Boundary focus**
- [x] Handler-test boundary construction checks
- [x] Boundary import/mapping checks in test scope

**Prelude focus**
- [x] Nullability propagation checks in shim and ambient declarations
- [x] `try/catch` anti-pattern scan in test harness and helpers

**Verification**
- [x] `api ./node_modules/.bin/tsc --noEmit -p tsconfig.json`
- [x] `api ./node_modules/.bin/eslint src/server.test.ts src/test-support/engineShim.ts`
- [x] `api ./node_modules/.bin/vitest run src/server.test.ts src/routes/compile.test.ts src/routes/stylePack.test.ts src/routes/subtrees.test.ts`

### Slice 6 — `frontend/src/App.tsx`, `frontend/src/hooks/*.ts`, `frontend/src/main.tsx`

**Status:** ✅ Fixed

#### Resolved

| Rule | Location | Severity | Resolution |
|------|----------|----------|------------|
| Prelude (nullability checks) | `frontend/src/hooks/usePreviewViewport.ts` | MUST | Replaced explicit null comparisons with `fromNullable` + `isNone`/`isSome` option guards in viewport flows. |
| Prelude (nullability checks) | `frontend/src/hooks/useOverlayViewport.ts` | MUST | Replaced explicit null comparisons with `fromNullable` + `isNone` option guards in overlay flows. |

#### Checklist

**Boundary focus**
- [x] No boundary handler paths in this slice (N/A)

**Prelude focus**
- [x] Nullability-check anti-pattern scan across app/hooks/main
- [x] `try/catch` anti-pattern scan
- [x] `new Map`/`new Set`/ramda/_tag direct usage scan

**Verification**
- [x] `frontend ./node_modules/.bin/tsc -b`
- [x] `frontend ./node_modules/.bin/eslint src/hooks/usePreviewViewport.ts src/hooks/useOverlayViewport.ts`

### Slice 7 — `frontend/src/components/*.tsx`, `frontend/src/components/*.test.tsx`

**Status:** ✅ Fixed

#### Resolved

| Rule | Location | Severity | Resolution |
|------|----------|----------|------------|
| Prelude (nullability checks) | `frontend/src/components/AppSections.tsx` | MUST | Replaced `rectSelect !== null` checks with `Option`-based guard and `mapO` render path. |

#### Checklist

**Boundary focus**
- [x] No boundary handler paths in this slice (N/A)

**Prelude focus**
- [x] Nullability-check anti-pattern scan across component/test files
- [x] `try/catch` anti-pattern scan

**Verification**
- [x] `frontend ./node_modules/.bin/tsc -b`
- [x] `frontend ./node_modules/.bin/eslint src/components/AppSections.tsx`
- [x] `frontend ./node_modules/.bin/vitest run src/components/AppSections.test.tsx`

### Slice 8 — `frontend/src/lib/*.{ts,test.ts}`, `frontend/src/logging/logger.ts`, `frontend/src/globals.d.ts`

**Status:** ✅ Clean

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| CLEAN | `frontend/src/lib/*`, `frontend/src/logging/logger.ts`, `frontend/src/globals.d.ts` | CLEAN | No boundary/prelude focus violations detected in this slice. |

#### Checklist

**Boundary focus**
- [x] No boundary handler paths in this slice (N/A)

**Prelude focus**
- [x] Nullability-check anti-pattern scan
- [x] `try/catch` anti-pattern scan
- [x] `new Map`/`new Set`/ramda/_tag direct usage scan
