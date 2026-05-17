# TSF++ Audit — frontend,api

**Target:** frontend,api
**Focus:** test
**Standard:** @tsfpp/standard v1.1.0
**Date:** 2026-05-17 18:32
**Status:** ✅ Resolved

---

## Summary

Top 3 highest-priority issues:

1. None — all previously reported test coverage violations were remediated.
2. Frontend hook/component slices now include RTL/MSW coverage for success and failure states.
3. API route/server slices now include handler 422/not-found/500 and adapter branch coverage.

| Category    | Violations | Deviations | Passed |
|-------------|-----------|------------|--------|
| Types       | 0         | 0          | 9      |
| Purity      | 0         | 0          | 9      |
| Boundary    | 0         | 3          | 9      |
| Annotations | 0         | 0          | 9      |
| Complexity  | 0         | 0          | 9      |

---

## Slices

| # | Path | Status |
|---|------|--------|
| 1 | `frontend/src/lib/editorPersistence.test.ts` | ✅ |
| 2 | `frontend/src/lib/svgSanitizationBoundary.test.ts` | ✅ |
| 3 | `frontend/src/lib/bcktrckLanguage.test.ts` | ✅ |
| 4 | `frontend/src/lib/subtreeSelection.test.ts` | ✅ |
| 5 | `frontend/src/lib/editorPersistence.ts` | ✅ |
| 6 | `frontend/src/hooks/useCompiledSvg.ts` | ✅ |
| 7 | `frontend/src/components/AppSections.tsx` | ✅ |
| 8 | `api/src/routes/*.ts` | ✅ |
| 9 | `api/src/server.ts` | ✅ |

---

<!-- Slices are appended below as the audit progresses -->

### Slice 1 — `frontend/src/lib/editorPersistence.test.ts`

**Status:** ✅ Clean

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| — | — | CLEAN | Tests cover both exported helpers with positive/negative shortcut checks and URI encoding behavior. |

#### Checklist

- [x] 1.1 — Asserts observable outputs
- [x] 1.2 — Behaviour-oriented descriptions
- [x] 3.3 — AAA style preserved
- [x] 6.2 — Public exports of paired module covered

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| None | — | — |

### Slice 2 — `frontend/src/lib/svgSanitizationBoundary.test.ts`

**Status:** ✅ Clean

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| — | — | CLEAN | Boundary test validates sanitizer delegation and SVG profile options. |

#### Checklist

- [x] 1.1 — Observable behaviour assertions
- [x] 1.2 — Behaviour-oriented naming
- [x] 6.2 — Target export has success-case coverage

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| None | — | — |

### Slice 3 — `frontend/src/lib/bcktrckLanguage.test.ts`

**Status:** ✅ Clean

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| — | — | CLEAN | Comprehensive deterministic unit tests exist for tokenizer and folding outputs across branches. |

#### Checklist

- [x] 1.1 — Observable outputs tested
- [x] 1.3 — Logical assertions kept focused per case
- [x] 6.2 — Public tested helpers have primary-success coverage
- [x] 6.4 — Multiple branch/switch paths exercised

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| None | — | — |

### Slice 4 — `frontend/src/lib/subtreeSelection.test.ts`

**Status:** ✅ Clean

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| — | — | CLEAN | Unit tests cover selection sanitization, parent map building, LCA resolution, and pruning edge cases. |

#### Checklist

- [x] 1.1 — Observable outputs tested
- [x] 1.3 — Single assertion concept per test case intent
- [x] 6.2 — Public utility exports covered for success paths
- [x] 6.3 — Error/empty-path behaviours covered

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| None | — | — |

### Slice 5 — `frontend/src/lib/editorPersistence.ts`

**Status:** ✅ Clean

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| — | — | CLEAN | Both public exports are exercised by dedicated tests in `editorPersistence.test.ts`. |

#### Checklist

- [x] 6.2 — Public exports have success-case coverage
- [x] 6.3 — Non-match branch for shortcut detection covered
- [x] 6.4 — Branches exercised by tests

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| None | — | — |

### Slice 6 — `frontend/src/hooks/useCompiledSvg.ts`

**Status:** ✅ Fixed

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| — | — | CLEAN | Added `useCompiledSvg.test.tsx` with MSW-backed success, unavailable endpoint fallback, parse-error formatting, and resolve-error formatting coverage. |

#### Checklist

- [x] 6.2 — Public export success path tested
- [x] 6.3 — Error paths tested
- [x] 6.4 — Branches/arms exercised

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| None | — | — |

### Slice 7 — `frontend/src/components/AppSections.tsx`

**Status:** ✅ Fixed

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| — | — | CLEAN | Added `AppSections.test.tsx` covering exported component rendering and preview error/success view-state branches. |

#### Checklist

- [x] 2.3 — React components tested with RTL
- [x] 4.5 — Loading/error/interaction state coverage for React slice
- [x] 6.2 — Every public export has success-case test

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| None | — | — |

### Slice 8 — `api/src/routes/*.ts`

**Status:** ✅ Fixed

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| — | — | CLEAN | Added route tests for `compileHandler`, `subtreesHandler`, and `stylePackHandler` covering 200 success, 422 validation errors, 500 internal-error mapping, and 404 not-found mapping. |

#### Checklist

- [x] 4.3 — Handler: missing required field => 422; ApiError variants covered
- [x] 6.2 — Public handler exports have success-case tests
- [x] 6.3 — Error-path tests exist
- [x] 6.4 — Branches exercised

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| DEVIATION(1.9) | `compile.test.ts`, `subtrees.test.ts`, `stylePack.test.ts` | Request objects are required to exercise fetch-compatible raw handlers. |

### Slice 9 — `api/src/server.ts`

**Status:** ✅ Fixed

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| — | — | CLEAN | Added `server.test.ts` with deterministic coverage for health/unknown routing, payload-too-large early return, and rate-limit branch behavior. |

#### Checklist

- [x] 6.4 — Branches/switch arms covered by tests
- [x] 1.4 — Deterministic unit boundaries

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| None | — | — |
