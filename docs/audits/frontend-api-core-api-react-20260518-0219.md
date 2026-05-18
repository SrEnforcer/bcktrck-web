# TSF++ Audit — frontend, api

**Target:** frontend, api
**Focus:** core, api, react
**Standard:** @tsfpp/standard v1.1.0
**Date:** 2026-05-18 02:19
**Status:** ✅ Resolved (with documented deviations)

---

## Summary

Resolution highlights:
1. All API and frontend MUST/SHOULD findings in this report were fixed or converted to explicit TSF++ DEVIATION records where intentional temporary exceptions remain.
2. API handlers now use prelude `Result` paths for request parsing without catch-to-null/undefined sentinels.
3. Frontend hook and app flows now avoid direct try/catch/nullish anti-patterns; remaining size-related issues are documented as deviations.

| Category    | Violations | Deviations | Passed | N/A |
|-------------|-----------|------------|--------|-----|
| Types       | 0         | 0          | 15     | 0   |
| Purity      | 0         | 0          | 15     | 0   |
| Boundary    | 0         | 6          | 9      | 0   |
| Annotations | 0         | 0          | 15     | 0   |
| Complexity  | 0         | 8          | 7      | 0   |
| Prelude     | 0         | 0          | 15     | 0   |
| React       | 0         | 0          | 15     | 0   |
| Data        | 0         | 0          | 0      | 15  |
| Security    | 0         | 0          | 15     | 0   |
| Tests       | 0         | 0          | 15     | 0   |

_N/A — focus not applicable to this target (e.g. React row when no `.tsx` files in scope)_

---

## Slices

| # | Path | Status |
|---|------|--------|
| 1 | `api/src/server.ts`, `api/src/server.test.ts` | ✅ |
| 2 | `api/src/routes/compile.ts`, `api/src/routes/compile.test.ts` | ✅ |
| 3 | `api/src/routes/stylePack.ts`, `api/src/routes/stylePack.test.ts` | ✅ |
| 4 | `api/src/routes/subtrees.ts`, `api/src/routes/subtrees.test.ts` | ✅ |
| 5 | `api/src/test-support/engineShim.ts`, `api/src/types/bcktrck-engine.d.ts` | ✅ |
| 6 | `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/globals.d.ts` | ✅ |
| 7 | `frontend/src/components/AppSections.tsx`, `frontend/src/components/AppSections.test.tsx`, `frontend/src/components/BcktrckEditor.tsx` | ✅ |
| 8 | `frontend/src/hooks/useCompiledSvg.ts`, `frontend/src/hooks/useCompiledSvg.test.tsx` | ✅ |
| 9 | `frontend/src/hooks/useLocalStoragePersistence.ts`, `frontend/src/hooks/useThemeEffects.ts` | ✅ |
| 10 | `frontend/src/hooks/useOverlayViewport.ts`, `frontend/src/hooks/usePreviewViewport.ts`, `frontend/src/hooks/usePrintPageStyle.ts`, `frontend/src/hooks/useSubtreeIsolation.ts` | ✅ |
| 11 | `frontend/src/lib/bcktrckLanguage.ts`, `frontend/src/lib/bcktrckLanguage.test.ts` | ✅ |
| 12 | `frontend/src/lib/editorPersistence.ts`, `frontend/src/lib/editorPersistence.test.ts` | ✅ |
| 13 | `frontend/src/lib/subtreeSelection.ts`, `frontend/src/lib/subtreeSelection.test.ts` | ✅ |
| 14 | `frontend/src/lib/svgDataUri.ts`, `frontend/src/lib/svgSanitization.ts`, `frontend/src/lib/svgSanitizationBoundary.test.ts` | ✅ |
| 15 | `frontend/src/lib/viewportMath.ts`, `frontend/src/logging/logger.ts` | ✅ |

### Slice 1 — `api/src/server.ts`, `api/src/server.test.ts`

**Status:** ✅ Fixed

#### Resolved

| Rule | Location | Severity | Resolution |
|------|----------|----------|------------|
| 2.4  | `api/src/server.test.ts:31` | MUST | Replaced direct env mutation with `vi.stubEnv(...)`. |
| 2.4  | `api/src/server.test.ts:59` | MUST | Replaced `delete process.env[...]` cleanup with `vi.unstubAllEnvs()`. |

#### Checklist

- [x] 1.x types/ADT rules reviewed
- [x] 2.x immutability rules reviewed
- [x] 4.x control-flow rules reviewed
- [x] 8.x boundary and response builder rules reviewed
- [x] 11.x size constraints reviewed
- [x] Typecheck passed (`api ./node_modules/.bin/tsc --noEmit -p tsconfig.json`)
- [x] Lint passed (`api ./node_modules/.bin/eslint src/server.test.ts`)
- [x] Tests passed (`api ./node_modules/.bin/vitest run src/server.test.ts`)

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| DEVIATION(1.9) | `api/src/server.ts:38` | Adapter-scoped Map construction at boundary. |
| DEVIATION(1.9) | `api/src/server.ts:58` | URL construction required in Node adapter bridge. |
| DEVIATION(1.9) | `api/src/server.ts:66` | Request construction required in Node adapter bridge. |
| DEVIATION(2.4) | `api/src/server.ts:132` | In-memory rate-limit state update at adapter boundary. |

### Slice 2 — `api/src/routes/compile.ts`, `api/src/routes/compile.test.ts`

**Status:** ✅ Fixed

#### Resolved

| Rule | Location | Severity | Resolution |
|------|----------|----------|------------|
| 6.3  | `api/src/routes/compile.ts:61` | MUST | Replaced catch-to-null body parse with `tryCatchAsync` + `Result` handling. |
| Prelude | `api/src/routes/compile.ts:70` | MUST | Removed undefined `getOrElse` fallback and composed optional compile options via `Option` folds. |

#### Checklist

- [x] Boundary parse/validate/mapping structure checked
- [x] API response mapping via `apiErrorToResponse` checked
- [x] Prelude anti-pattern checks performed
- [x] Test coverage and behavior checks performed
- [x] Typecheck passed (`api ./node_modules/.bin/tsc --noEmit -p tsconfig.json`)
- [x] Lint passed (`api ./node_modules/.bin/eslint src/routes/compile.ts`)
- [x] Tests passed (`api ./node_modules/.bin/vitest run src/routes/compile.test.ts`)

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| DEVIATION(1.9) | `api/src/routes/compile.test.ts:14` | Request construction for handler-level test boundary. |

### Slice 3 — `api/src/routes/stylePack.ts`, `api/src/routes/stylePack.test.ts`

**Status:** ✅ Fixed

#### Resolved

| Rule | Location | Severity | Resolution |
|------|----------|----------|------------|
| 6.3 | `api/src/routes/stylePack.ts:42` | MUST | Replaced catch-to-null body parse with `tryCatchAsync` + `Result` handling. |

#### Checklist

- [x] Boundary schema validation usage checked
- [x] Error mapping and response builder usage checked
- [x] Prelude null/undefined handling checked
- [x] Typecheck passed (`api ./node_modules/.bin/tsc --noEmit -p tsconfig.json`)
- [x] Lint passed (`api ./node_modules/.bin/eslint src/routes/stylePack.ts`)
- [x] Tests passed (`api ./node_modules/.bin/vitest run src/routes/stylePack.test.ts`)

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| DEVIATION(1.9) | `api/src/routes/stylePack.test.ts:14` | Request construction for handler-level test boundary. |

### Slice 4 — `api/src/routes/subtrees.ts`, `api/src/routes/subtrees.test.ts`

**Status:** ✅ Fixed

#### Resolved

| Rule | Location | Severity | Resolution |
|------|----------|----------|------------|
| 6.3  | `api/src/routes/subtrees.ts:44` | MUST | Replaced catch-to-null body parse with `tryCatchAsync` + `Result` handling. |
| Prelude | `api/src/routes/subtrees.ts:56` | MUST | Removed undefined `getOrElse` fallback and built options without undefined fallback combinator usage. |

#### Checklist

- [x] Boundary request extraction and validation checked
- [x] Error response mapping checked
- [x] Prelude nullability anti-patterns checked
- [x] Typecheck passed (`api ./node_modules/.bin/tsc --noEmit -p tsconfig.json`)
- [x] Lint passed (`api ./node_modules/.bin/eslint src/routes/subtrees.ts`)
- [x] Tests passed (`api ./node_modules/.bin/vitest run src/routes/subtrees.test.ts`)

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| DEVIATION(1.9) | `api/src/routes/subtrees.test.ts:14` | Request construction for handler-level test boundary. |

### Slice 5 — `api/src/test-support/engineShim.ts`, `api/src/types/bcktrck-engine.d.ts`

**Status:** ✅ Fixed

#### Resolved

| Rule | Location | Severity | Resolution |
|------|----------|----------|------------|
| 6.3 | `api/src/test-support/engineShim.ts:26` | MUST | Replaced undefined-based engine fields with null-based explicit union fields. |
| 6.3 | `api/src/types/bcktrck-engine.d.ts:51` | MUST | Replaced undefined-based declaration fields with null-based explicit union fields. |

#### Checklist

- [x] Type-level nullability checks performed
- [x] Immutability and readonly checks performed
- [x] Annotation checks performed
- [x] Typecheck passed (`api ./node_modules/.bin/tsc --noEmit -p tsconfig.json`)
- [x] Lint passed (`api ./node_modules/.bin/eslint src/test-support/engineShim.ts`)

### Slice 6 — `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/globals.d.ts`

**Status:** ✅ Fixed

#### Resolved

| Rule | Location | Severity | Resolution |
|------|----------|----------|------------|
| 6.x | `frontend/src/App.tsx:123` | MUST | Replaced try/catch storage and fetch handling with prelude `tryCatch`/`tryCatchAsync` helpers. |
| 4.5 | `frontend/src/App.tsx:390` | MUST | Replaced truthiness check with `Option` guard (`fromNullable`/`isNone`). |
| 6.3 | `frontend/src/App.tsx:233` | MUST | Replaced direct undefined checks with `Option`-based branching. |
| 6.3 | `frontend/src/globals.d.ts:56` | MUST | Replaced optional/undefined declaration fields with explicit null unions. |
| 11.2 | `frontend/src/App.tsx:222` | MUST | Added explicit DEVIATION(11.2) for temporary oversized root container during staged extraction. |
| 11.x | `frontend/src/App.tsx:223` | MUST | Added explicit DEVIATION(11.1) for orchestrator-level App function complexity. |

#### Checklist

- [x] React module composition reviewed
- [x] Core prelude and nullability rules reviewed
- [x] Complexity and LOC constraints reviewed
- [x] Export annotation checks reviewed
- [x] Typecheck passed (`frontend ./node_modules/.bin/tsc -b`)
- [x] Lint passed (`frontend ./node_modules/.bin/eslint src/App.tsx src/globals.d.ts`)

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| DEVIATION(11.2) | `frontend/src/App.tsx:222` | Root app container remains large while staged module extraction is in progress. |
| DEVIATION(11.1) | `frontend/src/App.tsx:223` | App remains orchestration boundary for cross-panel state and viewport coordination. |

### Slice 7 — `frontend/src/components/AppSections.tsx`, `frontend/src/components/AppSections.test.tsx`, `frontend/src/components/BcktrckEditor.tsx`

**Status:** ✅ Fixed

#### Resolved

| Rule | Location | Severity | Resolution |
|------|----------|----------|------------|
| 11.2 | `frontend/src/components/AppSections.tsx:41` | MUST | Added explicit DEVIATION(11.2) documenting temporary grouped section module size. |
| 11.x | `frontend/src/components/AppSections.tsx:42` | MUST | Added DEVIATION(11.1) for `WorkspaceTopbar` pending micro-component extraction. |
| 11.x | `frontend/src/components/AppSections.tsx:160` | MUST | Added DEVIATION(11.1) for `EditorPanel` pending tab-subtree split. |
| 11.x | `frontend/src/components/AppSections.tsx:351` | MUST | Added DEVIATION(11.1) for `PreviewPanel` pending toolbar/view split. |

#### Checklist

- [x] React component contracts and props reviewed
- [x] Complexity and file-size constraints reviewed
- [x] Tests reviewed for observable-behavior assertions
- [x] Typecheck passed (`frontend ./node_modules/.bin/tsc -b`)
- [x] Lint passed (`frontend ./node_modules/.bin/eslint src/components/AppSections.tsx`)

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| DEVIATION(11.2) | `frontend/src/components/AppSections.tsx:41` | Workspace section module kept co-located while extraction work is staged. |
| DEVIATION(11.1) | `frontend/src/components/AppSections.tsx:42` | `WorkspaceTopbar` currently retains full action surface. |
| DEVIATION(11.1) | `frontend/src/components/AppSections.tsx:160` | `EditorPanel` retains tab/layout orchestration. |
| DEVIATION(11.1) | `frontend/src/components/AppSections.tsx:351` | `PreviewPanel` retains control+viewport rendering integration. |

### Slice 8 — `frontend/src/hooks/useCompiledSvg.ts`, `frontend/src/hooks/useCompiledSvg.test.tsx`

**Status:** ✅ Fixed

#### Resolved

| Rule | Location | Severity | Resolution |
|------|----------|----------|------------|
| Prelude | `frontend/src/hooks/useCompiledSvg.ts:142` | MUST | Replaced nullish coalescing with prelude fallback (`fromNullable` + `getOrElse`). |
| 6.3 | `frontend/src/hooks/useCompiledSvg.ts:194` | MUST | Replaced null payload fallbacks with option-composed request body. |
| 6.3 | `frontend/src/hooks/useCompiledSvg.ts:214` | MUST | Replaced catch-to-undefined fetch/json paths with `tryCatchAsync` + `Result` branching. |
| 11.x | `frontend/src/hooks/useCompiledSvg.ts:180` | MUST | Added explicit DEVIATION(11.1) documenting hook orchestration scope. |

#### Checklist

- [x] Prelude anti-pattern checks performed
- [x] React hook effect/purity checks performed
- [x] Test behavior checks performed
- [x] Typecheck passed (`frontend ./node_modules/.bin/tsc -b`)
- [x] Lint passed (`frontend ./node_modules/.bin/eslint src/hooks/useCompiledSvg.ts`)
- [x] Tests passed (`frontend ./node_modules/.bin/vitest run src/hooks/useCompiledSvg.test.tsx`)

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| DEVIATION(11.1) | `frontend/src/hooks/useCompiledSvg.ts:180` | Hook keeps compile-fetch-decode-render state together as the compile boundary orchestrator. |

### Slice 9 — `frontend/src/hooks/useLocalStoragePersistence.ts`, `frontend/src/hooks/useThemeEffects.ts`

**Status:** ✅ Fixed

#### Resolved

| Rule | Location | Severity | Resolution |
|------|----------|----------|------------|
| 6.x | `frontend/src/hooks/useLocalStoragePersistence.ts:19` | MUST | Replaced try/catch blocks with `persistLocalStorage` helper based on prelude `tryCatch`. |
| 11.x | `frontend/src/hooks/useLocalStoragePersistence.ts:19` | SHOULD | Consolidated repeated persistence logic into a single helper function. |

#### Checklist

- [x] Hook side-effect boundaries reviewed
- [x] Prelude error-handling approach reviewed
- [x] Typecheck passed (`frontend ./node_modules/.bin/tsc -b`)
- [x] Lint passed (`frontend ./node_modules/.bin/eslint src/hooks/useLocalStoragePersistence.ts`)

### Slice 10 — `frontend/src/hooks/useOverlayViewport.ts`, `frontend/src/hooks/usePreviewViewport.ts`, `frontend/src/hooks/usePrintPageStyle.ts`, `frontend/src/hooks/useSubtreeIsolation.ts`

**Status:** ✅ Fixed

#### Resolved

| Rule | Location | Severity | Resolution |
|------|----------|----------|------------|
| 6.3 | `frontend/src/hooks/useSubtreeIsolation.ts:71` | MUST | Replaced null/catch sentinel request flow with option-composed body and `tryCatchAsync`. |
| 6.x | `frontend/src/hooks/usePreviewViewport.ts:44` | MUST | Replaced repeated try/catch session persistence paths with helper wrappers using prelude `tryCatch`. |
| 11.x | `frontend/src/hooks/usePreviewViewport.ts:76` | SHOULD | Added explicit DEVIATION(11.1) for cohesive interaction-model orchestration in a single hook. |

#### Checklist

- [x] React viewport hooks reviewed
- [x] Prelude nullability and error handling rules reviewed
- [x] Complexity checks reviewed
- [x] Typecheck passed (`frontend ./node_modules/.bin/tsc -b`)
- [x] Lint passed (`frontend ./node_modules/.bin/eslint src/hooks/usePreviewViewport.ts src/hooks/useSubtreeIsolation.ts`)

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| DEVIATION(11.1) | `frontend/src/hooks/usePreviewViewport.ts:76` | Hook intentionally centralizes interaction state and viewport math for consistent drag/zoom behavior. |

### Slice 11 — `frontend/src/lib/bcktrckLanguage.ts`, `frontend/src/lib/bcktrckLanguage.test.ts`

**Status:** ✅ Fixed

#### Resolved

| Rule | Location | Severity | Resolution |
|------|----------|----------|------------|
| 2.1 | `frontend/src/lib/bcktrckLanguage.ts:128` | MUST | Replaced mutable cursor with recursive immutable scanner state. |
| Control flow | `frontend/src/lib/bcktrckLanguage.ts:137` | MUST | Replaced `while` loop with recursive traversal. |
| 2.3 | `frontend/src/lib/bcktrckLanguage.ts:158` | MUST | Replaced `.push` mutation with immutable accumulator spread. |

#### Checklist

- [x] Core purity and immutability checks performed
- [x] Tokenizer/test behavior verified for scope
- [x] Typecheck passed (`frontend ./node_modules/.bin/tsc -b`)
- [x] Lint passed (`frontend ./node_modules/.bin/eslint src/lib/bcktrckLanguage.ts`)
- [x] Tests passed (`frontend ./node_modules/.bin/vitest run src/lib/bcktrckLanguage.test.ts`)

### Slice 12 — `frontend/src/lib/editorPersistence.ts`, `frontend/src/lib/editorPersistence.test.ts`

**Status:** ✅ Clean

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| CLEAN | `frontend/src/lib/editorPersistence.ts` | CLEAN | No TSF++ violations found in scope for core/api/react focus. |

#### Checklist

- [x] Type, purity, and annotation checks performed
- [x] Test behavior checks performed

### Slice 13 — `frontend/src/lib/subtreeSelection.ts`, `frontend/src/lib/subtreeSelection.test.ts`

**Status:** ✅ Clean

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| CLEAN | `frontend/src/lib/subtreeSelection.ts` | CLEAN | No MUST-level violations found for selected focus. |

#### Checklist

- [x] ADT, immutability, and prelude checks performed
- [x] Test behavior checks performed

### Slice 14 — `frontend/src/lib/svgDataUri.ts`, `frontend/src/lib/svgSanitization.ts`, `frontend/src/lib/svgSanitizationBoundary.test.ts`

**Status:** ✅ Fixed

#### Resolved

| Rule | Location | Severity | Resolution |
|------|----------|----------|------------|
| 7.x | `frontend/src/lib/svgSanitization.ts:13` | MUST | Added complete JSDoc tags with `@param` and `@returns`. |

#### Checklist

- [x] Exported symbol annotation checks performed
- [x] Security sanitation boundary test reviewed
- [x] Typecheck passed (`frontend ./node_modules/.bin/tsc -b`)
- [x] Lint passed (`frontend ./node_modules/.bin/eslint src/lib/svgSanitization.ts`)
- [x] Tests passed (`frontend ./node_modules/.bin/vitest run src/lib/svgSanitizationBoundary.test.ts`)

### Slice 15 — `frontend/src/lib/viewportMath.ts`, `frontend/src/logging/logger.ts`

**Status:** ✅ Clean

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| CLEAN | `frontend/src/lib/viewportMath.ts` | CLEAN | No MUST-level violations found for selected focus. |
| CLEAN | `frontend/src/logging/logger.ts` | CLEAN | No MUST-level violations found for selected focus. |

#### Checklist

- [x] Core utility checks performed
- [x] Security and prelude checks performed
