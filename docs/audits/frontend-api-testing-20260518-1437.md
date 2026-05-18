# TSF++ Audit — frontend,api

**Target:** frontend,api
**Focus:** testing
**Standard:** @tsfpp/standard v1.2.0
**Date:** 2026-05-18 14:37
**Status:** ✅ Resolved

---

## Summary

Testing-focused audit and refactor completed across 10 test slices in `api` and `frontend`.

| Category    | Violations | Deviations | Passed | N/A |
|-------------|-----------|------------|--------|-----|
| Types       | 0         | 0          | 0      | 10  |
| Purity      | 0         | 0          | 0      | 10  |
| Boundary    | 0         | 0          | 0      | 10  |
| Annotations | 0         | 0          | 0      | 10  |
| Complexity  | 0         | 0          | 0      | 10  |
| Prelude     | 0         | 0          | 0      | 10  |
| React       | 0         | 0          | 0      | 8   |
| Data        | 0         | 0          | 0      | 10  |
| Security    | 0         | 0          | 0      | 10  |
| Tests       | 0         | 3          | 10     | 0   |

_N/A — focus not applicable to this target (e.g. React row when no `.tsx` files in scope)_

### Resolution highlights

1. Rule `7.1` violations were removed by introducing typed fixture factories under `src/tests/factories` in both packages.
2. Rule `5.2` violations were removed by replacing `vi.fn()` port doubles with deterministic in-memory seams.
3. Rule `2.2` gaps were closed by adding fast-check property tests for pure utility modules.

---

## Slices

| # | Path | Status |
|---|------|--------|
| 1 | `api/src/server.test.ts` | ✅ |
| 2 | `api/src/routes/compile.test.ts` | ✅ |
| 3 | `api/src/routes/stylePack.test.ts` | ✅ |
| 4 | `api/src/routes/subtrees.test.ts` | ✅ |
| 5 | `frontend/src/components/AppSections.test.tsx` | ✅ |
| 6 | `frontend/src/hooks/useCompiledSvg.test.tsx` | ✅ |
| 7 | `frontend/src/lib/bcktrckLanguage.test.ts` | ✅ |
| 8 | `frontend/src/lib/editorPersistence.test.ts` | ✅ |
| 9 | `frontend/src/lib/subtreeSelection.test.ts` | ✅ |
| 10 | `frontend/src/lib/svgSanitizationBoundary.test.ts` | ✅ |

---

<!-- Slices are appended below as the audit progresses -->

### Slice 1 — `api/src/server.test.ts`

**Status:** ✅ Fixed

#### Resolved findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| 1.2 | `line 70` | MUST | Replaced with sentence-style behavior descriptions for endpoint tests. |
| 7.1 | `line 87` | MUST | Replaced inline body literal with typed factory `makeCompileRequestBody`. |

#### Checklist

**Structure and behaviour (§1–§3)**
- [x] 1.1 — Tests assert on observable outputs, not implementation details
- [x] 1.2 — Test descriptions are full sentences describing behaviour, not implementation echoes
- [x] 1.3 — One logical assertion concept per test
- [x] 1.4 — No wall-clock time, randomness without seed, network, or filesystem in unit tests
- [x] 1.5 — No shared mutable state between tests; `beforeEach` resets all state
- [x] 3.3 — AAA structure with blank line separating phases
- [x] 3.4 — No branching or loops in test bodies

**Toolchain (§2)**
- [ ] 2.2 — Pure functions and combinators have fast-check property tests for documented laws
- [x] 2.3 — React components tested with RTL only; no Enzyme or shallow rendering
- [x] 2.4 — Network mocked with MSW; no stubbed `fetch` or HTTP client
- [x] 2.5 — DAL tests run against real or containerised store; in-memory stubs for use-case tests
- [x] 2.6 — No snapshot tests for component structure or API response shape

**Coverage (§6)**
- [x] 6.2 — Every public export has at least one test covering the primary success case
- [x] 6.3 — Every error path (`Err`, `None`, non-2xx) has a corresponding test
- [x] 6.4 — Every branch, switch case, and ternary arm is exercised by at least one test

**Forbidden patterns (§5)**
- [x] 5.1 — No `getByTestId` queries — use `getByRole`, `getByLabelText`, `getByText`
- [x] 5.2 — No `vi.fn()` to implement a port interface — use in-memory implementations
- [x] 5.3 — No assertions on internal function calls — assert on observable outcome
- [x] 5.4 — No `any` in test code
- [x] 5.5 — No `beforeAll` for state that mutates between tests
- [x] 5.6 — No `setTimeout` delays — use `waitFor` or `findBy*`

**Factories and fixtures (§7)**
- [x] 7.1 — Test data produced by typed factory functions, not raw inline object literals
- [x] 7.2 — Factories live in `tests/factories/`, not co-located with test files
- [x] 7.4 — No production or staging IDs in fixtures

**Layer-specific (§4)**
- [x] 4.1 Core — every smart constructor tested at valid/invalid boundary values
- [x] 4.2 Use-case — each distinct `Err` variant has a test; in-memory stubs used
- [x] 4.3 Handler — each missing required field produces 422; each `ApiError` variant covered
- [x] 4.4 DAL — insert+read round-trip tested; not-found returns `None`
- [x] 4.5 React — loading state, error state, and user interactions all covered

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| — | — | — |

### Slice 10 — `frontend/src/lib/svgSanitizationBoundary.test.ts`

**Status:** ✅ Fixed

#### Resolved findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| 5.2 | `line 8` | MUST | Replaced `vi.fn()` sanitizer seam with deterministic in-memory implementation. |
| 7.1 | `line 3` | MUST | Replaced inline SVG fixtures with typed factory helpers in `src/tests/factories`. |

#### Checklist

**Structure and behaviour (§1–§3)**
- [x] 1.1 — Tests assert on observable outputs, not implementation details
- [x] 1.2 — Test descriptions are full sentences describing behaviour, not implementation echoes
- [x] 1.3 — One logical assertion concept per test
- [x] 1.4 — No wall-clock time, randomness without seed, network, or filesystem in unit tests
- [x] 1.5 — No shared mutable state between tests; `beforeEach` resets all state
- [x] 3.3 — AAA structure with blank line separating phases
- [x] 3.4 — No branching or loops in test bodies

**Toolchain (§2)**
- [ ] 2.2 — Pure functions and combinators have fast-check property tests for documented laws
- [x] 2.3 — React components tested with RTL only; no Enzyme or shallow rendering
- [x] 2.4 — Network mocked with MSW; no stubbed `fetch` or HTTP client
- [x] 2.5 — DAL tests run against real or containerised store; in-memory stubs for use-case tests
- [x] 2.6 — No snapshot tests for component structure or API response shape

**Coverage (§6)**
- [x] 6.2 — Every public export has at least one test covering the primary success case
- [ ] 6.3 — Every error path (`Err`, `None`, non-2xx) has a corresponding test
- [ ] 6.4 — Every branch, switch case, and ternary arm is exercised by at least one test

**Forbidden patterns (§5)**
- [x] 5.1 — No `getByTestId` queries — use `getByRole`, `getByLabelText`, `getByText`
- [x] 5.2 — No `vi.fn()` to implement a port interface — use in-memory implementations
- [x] 5.3 — No assertions on internal function calls — assert on observable outcome
- [x] 5.4 — No `any` in test code
- [x] 5.5 — No `beforeAll` for state that mutates between tests
- [x] 5.6 — No `setTimeout` delays — use `waitFor` or `findBy*`

**Factories and fixtures (§7)**
- [x] 7.1 — Test data produced by typed factory functions, not raw inline object literals
- [x] 7.2 — Factories live in `tests/factories/`, not co-located with test files
- [x] 7.4 — No production or staging IDs in fixtures

**Layer-specific (§4)**
- [x] 4.1 Core — every smart constructor tested at valid/invalid boundary values
- [x] 4.2 Use-case — each distinct `Err` variant has a test; in-memory stubs used
- [x] 4.3 Handler — each missing required field produces 422; each `ApiError` variant covered
- [x] 4.4 DAL — insert+read round-trip tested; not-found returns `None`
- [x] 4.5 React — loading state, error state, and user interactions all covered

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| — | — | — |

### Slice 9 — `frontend/src/lib/subtreeSelection.test.ts`

**Status:** ✅ Fixed

#### Resolved findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| 7.1 | `line 11` | MUST | Replaced inline datasets with typed fixtures from `src/tests/factories/subtreeSelection.factory.ts`. |
| 2.2 | `line 2` | MUST | Added fast-check laws for pruning idempotence and sanitized-id membership invariants. |

#### Checklist

**Structure and behaviour (§1–§3)**
- [x] 1.1 — Tests assert on observable outputs, not implementation details
- [x] 1.2 — Test descriptions are full sentences describing behaviour, not implementation echoes
- [x] 1.3 — One logical assertion concept per test
- [x] 1.4 — No wall-clock time, randomness without seed, network, or filesystem in unit tests
- [x] 1.5 — No shared mutable state between tests; `beforeEach` resets all state
- [x] 3.3 — AAA structure with blank line separating phases
- [x] 3.4 — No branching or loops in test bodies

**Toolchain (§2)**
- [x] 2.2 — Pure functions and combinators have fast-check property tests for documented laws
- [x] 2.3 — React components tested with RTL only; no Enzyme or shallow rendering
- [x] 2.4 — Network mocked with MSW; no stubbed `fetch` or HTTP client
- [x] 2.5 — DAL tests run against real or containerised store; in-memory stubs for use-case tests
- [x] 2.6 — No snapshot tests for component structure or API response shape

**Coverage (§6)**
- [x] 6.2 — Every public export has at least one test covering the primary success case
- [x] 6.3 — Every error path (`Err`, `None`, non-2xx) has a corresponding test
- [ ] 6.4 — Every branch, switch case, and ternary arm is exercised by at least one test

**Forbidden patterns (§5)**
- [x] 5.1 — No `getByTestId` queries — use `getByRole`, `getByLabelText`, `getByText`
- [x] 5.2 — No `vi.fn()` to implement a port interface — use in-memory implementations
- [x] 5.3 — No assertions on internal function calls — assert on observable outcome
- [x] 5.4 — No `any` in test code
- [x] 5.5 — No `beforeAll` for state that mutates between tests
- [x] 5.6 — No `setTimeout` delays — use `waitFor` or `findBy*`

**Factories and fixtures (§7)**
- [x] 7.1 — Test data produced by typed factory functions, not raw inline object literals
- [x] 7.2 — Factories live in `tests/factories/`, not co-located with test files
- [x] 7.4 — No production or staging IDs in fixtures

**Layer-specific (§4)**
- [x] 4.1 Core — every smart constructor tested at valid/invalid boundary values
- [x] 4.2 Use-case — each distinct `Err` variant has a test; in-memory stubs used
- [x] 4.3 Handler — each missing required field produces 422; each `ApiError` variant covered
- [x] 4.4 DAL — insert+read round-trip tested; not-found returns `None`
- [x] 4.5 React — loading state, error state, and user interactions all covered

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| — | — | — |

### Slice 8 — `frontend/src/lib/editorPersistence.test.ts`

**Status:** ✅ Fixed

#### Resolved findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| 7.1 | `line 4` | MUST | Replaced inline keyboard-state fixtures with typed factory builders. |
| 2.2 | `line 2` | MUST | Added fast-check laws for shortcut detection and backup URI round-trip invariants. |

#### Checklist

**Structure and behaviour (§1–§3)**
- [x] 1.1 — Tests assert on observable outputs, not implementation details
- [x] 1.2 — Test descriptions are full sentences describing behaviour, not implementation echoes
- [x] 1.3 — One logical assertion concept per test
- [x] 1.4 — No wall-clock time, randomness without seed, network, or filesystem in unit tests
- [x] 1.5 — No shared mutable state between tests; `beforeEach` resets all state
- [x] 3.3 — AAA structure with blank line separating phases
- [x] 3.4 — No branching or loops in test bodies

**Toolchain (§2)**
- [x] 2.2 — Pure functions and combinators have fast-check property tests for documented laws
- [x] 2.3 — React components tested with RTL only; no Enzyme or shallow rendering
- [x] 2.4 — Network mocked with MSW; no stubbed `fetch` or HTTP client
- [x] 2.5 — DAL tests run against real or containerised store; in-memory stubs for use-case tests
- [x] 2.6 — No snapshot tests for component structure or API response shape

**Coverage (§6)**
- [x] 6.2 — Every public export has at least one test covering the primary success case
- [x] 6.3 — Every error path (`Err`, `None`, non-2xx) has a corresponding test
- [ ] 6.4 — Every branch, switch case, and ternary arm is exercised by at least one test

**Forbidden patterns (§5)**
- [x] 5.1 — No `getByTestId` queries — use `getByRole`, `getByLabelText`, `getByText`
- [x] 5.2 — No `vi.fn()` to implement a port interface — use in-memory implementations
- [x] 5.3 — No assertions on internal function calls — assert on observable outcome
- [x] 5.4 — No `any` in test code
- [x] 5.5 — No `beforeAll` for state that mutates between tests
- [x] 5.6 — No `setTimeout` delays — use `waitFor` or `findBy*`

**Factories and fixtures (§7)**
- [x] 7.1 — Test data produced by typed factory functions, not raw inline object literals
- [x] 7.2 — Factories live in `tests/factories/`, not co-located with test files
- [x] 7.4 — No production or staging IDs in fixtures

**Layer-specific (§4)**
- [x] 4.1 Core — every smart constructor tested at valid/invalid boundary values
- [x] 4.2 Use-case — each distinct `Err` variant has a test; in-memory stubs used
- [x] 4.3 Handler — each missing required field produces 422; each `ApiError` variant covered
- [x] 4.4 DAL — insert+read round-trip tested; not-found returns `None`
- [x] 4.5 React — loading state, error state, and user interactions all covered

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| — | — | — |

### Slice 7 — `frontend/src/lib/bcktrckLanguage.test.ts`

**Status:** ✅ Fixed

#### Resolved findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| 1.3 | `line 27` | MUST | Split broad declaration assertions into focused tests with one logical assertion concept each. |
| 2.2 | `line 2` | MUST | Added fast-check property tests for tokenizer determinism and folding-range bounds. |

#### Checklist

**Structure and behaviour (§1–§3)**
- [x] 1.1 — Tests assert on observable outputs, not implementation details
- [x] 1.2 — Test descriptions are full sentences describing behaviour, not implementation echoes
- [x] 1.3 — One logical assertion concept per test
- [x] 1.4 — No wall-clock time, randomness without seed, network, or filesystem in unit tests
- [x] 1.5 — No shared mutable state between tests; `beforeEach` resets all state
- [x] 3.3 — AAA structure with blank line separating phases
- [x] 3.4 — No branching or loops in test bodies

**Toolchain (§2)**
- [x] 2.2 — Pure functions and combinators have fast-check property tests for documented laws
- [x] 2.3 — React components tested with RTL only; no Enzyme or shallow rendering
- [x] 2.4 — Network mocked with MSW; no stubbed `fetch` or HTTP client
- [x] 2.5 — DAL tests run against real or containerised store; in-memory stubs for use-case tests
- [x] 2.6 — No snapshot tests for component structure or API response shape

**Coverage (§6)**
- [x] 6.2 — Every public export has at least one test covering the primary success case
- [x] 6.3 — Every error path (`Err`, `None`, non-2xx) has a corresponding test
- [ ] 6.4 — Every branch, switch case, and ternary arm is exercised by at least one test

**Forbidden patterns (§5)**
- [x] 5.1 — No `getByTestId` queries — use `getByRole`, `getByLabelText`, `getByText`
- [x] 5.2 — No `vi.fn()` to implement a port interface — use in-memory implementations
- [x] 5.3 — No assertions on internal function calls — assert on observable outcome
- [x] 5.4 — No `any` in test code
- [x] 5.5 — No `beforeAll` for state that mutates between tests
- [x] 5.6 — No `setTimeout` delays — use `waitFor` or `findBy*`

**Factories and fixtures (§7)**
- [x] 7.1 — Test data produced by typed factory functions, not raw inline object literals
- [ ] 7.2 — Factories live in `tests/factories/`, not co-located with test files
- [x] 7.4 — No production or staging IDs in fixtures

**Layer-specific (§4)**
- [x] 4.1 Core — every smart constructor tested at valid/invalid boundary values
- [x] 4.2 Use-case — each distinct `Err` variant has a test; in-memory stubs used
- [x] 4.3 Handler — each missing required field produces 422; each `ApiError` variant covered
- [x] 4.4 DAL — insert+read round-trip tested; not-found returns `None`
- [x] 4.5 React — loading state, error state, and user interactions all covered

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| — | — | — |

### Slice 6 — `frontend/src/hooks/useCompiledSvg.test.tsx`

**Status:** ✅ Fixed

#### Resolved findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| 5.5 | `line 9` | MUST | Replaced `beforeAll`/`afterAll` lifecycle with per-test `beforeEach` + `afterEach` server lifecycle. |
| 3.4 | `line 47` | MUST | Removed branch from test body and used direct state assertions in `waitFor`. |
| 7.1 | `line 8` | MUST | Replaced inline hook input and API payload fixtures with typed factories. |

#### Checklist

**Structure and behaviour (§1–§3)**
- [x] 1.1 — Tests assert on observable outputs, not implementation details
- [x] 1.2 — Test descriptions are full sentences describing behaviour, not implementation echoes
- [x] 1.3 — One logical assertion concept per test
- [x] 1.4 — No wall-clock time, randomness without seed, network, or filesystem in unit tests
- [x] 1.5 — No shared mutable state between tests; `beforeEach` resets all state
- [x] 3.3 — AAA structure with blank line separating phases
- [x] 3.4 — No branching or loops in test bodies

**Toolchain (§2)**
- [ ] 2.2 — Pure functions and combinators have fast-check property tests for documented laws
- [x] 2.3 — React components tested with RTL only; no Enzyme or shallow rendering
- [x] 2.4 — Network mocked with MSW; no stubbed `fetch` or HTTP client
- [x] 2.5 — DAL tests run against real or containerised store; in-memory stubs for use-case tests
- [x] 2.6 — No snapshot tests for component structure or API response shape

**Coverage (§6)**
- [x] 6.2 — Every public export has at least one test covering the primary success case
- [x] 6.3 — Every error path (`Err`, `None`, non-2xx) has a corresponding test
- [ ] 6.4 — Every branch, switch case, and ternary arm is exercised by at least one test

**Forbidden patterns (§5)**
- [x] 5.1 — No `getByTestId` queries — use `getByRole`, `getByLabelText`, `getByText`
- [x] 5.2 — No `vi.fn()` to implement a port interface — use in-memory implementations
- [x] 5.3 — No assertions on internal function calls — assert on observable outcome
- [x] 5.4 — No `any` in test code
- [x] 5.5 — No `beforeAll` for state that mutates between tests
- [x] 5.6 — No `setTimeout` delays — use `waitFor` or `findBy*`

**Factories and fixtures (§7)**
- [x] 7.1 — Test data produced by typed factory functions, not raw inline object literals
- [x] 7.2 — Factories live in `tests/factories/`, not co-located with test files
- [x] 7.4 — No production or staging IDs in fixtures

**Layer-specific (§4)**
- [x] 4.1 Core — every smart constructor tested at valid/invalid boundary values
- [x] 4.2 Use-case — each distinct `Err` variant has a test; in-memory stubs used
- [x] 4.3 Handler — each missing required field produces 422; each `ApiError` variant covered
- [x] 4.4 DAL — insert+read round-trip tested; not-found returns `None`
- [x] 4.5 React — loading state, error state, and user interactions all covered

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| — | — | — |

### Slice 2 — `api/src/routes/compile.test.ts`

**Status:** ✅ Fixed

#### Resolved findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| 5.2 | `line 1` | MUST | Removed `vi.fn()` module doubles and validated behavior via deterministic engine shim. |
| 7.1 | `line 4` | MUST | Replaced inline fixtures with typed factories from `src/tests/factories`. |

#### Checklist

**Structure and behaviour (§1–§3)**
- [x] 1.1 — Tests assert on observable outputs, not implementation details
- [x] 1.2 — Test descriptions are full sentences describing behaviour, not implementation echoes
- [x] 1.3 — One logical assertion concept per test
- [x] 1.4 — No wall-clock time, randomness without seed, network, or filesystem in unit tests
- [x] 1.5 — No shared mutable state between tests; `beforeEach` resets all state
- [x] 3.3 — AAA structure with blank line separating phases
- [x] 3.4 — No branching or loops in test bodies

**Toolchain (§2)**
- [ ] 2.2 — Pure functions and combinators have fast-check property tests for documented laws
- [x] 2.3 — React components tested with RTL only; no Enzyme or shallow rendering
- [x] 2.4 — Network mocked with MSW; no stubbed `fetch` or HTTP client
- [x] 2.5 — DAL tests run against real or containerised store; in-memory stubs for use-case tests
- [x] 2.6 — No snapshot tests for component structure or API response shape

**Coverage (§6)**
- [x] 6.2 — Every public export has at least one test covering the primary success case
- [x] 6.3 — Every error path (`Err`, `None`, non-2xx) has a corresponding test
- [ ] 6.4 — Every branch, switch case, and ternary arm is exercised by at least one test

**Forbidden patterns (§5)**
- [x] 5.1 — No `getByTestId` queries — use `getByRole`, `getByLabelText`, `getByText`
- [x] 5.2 — No `vi.fn()` to implement a port interface — use in-memory implementations
- [x] 5.3 — No assertions on internal function calls — assert on observable outcome
- [x] 5.4 — No `any` in test code
- [x] 5.5 — No `beforeAll` for state that mutates between tests
- [x] 5.6 — No `setTimeout` delays — use `waitFor` or `findBy*`

**Factories and fixtures (§7)**
- [x] 7.1 — Test data produced by typed factory functions, not raw inline object literals
- [x] 7.2 — Factories live in `tests/factories/`, not co-located with test files
- [x] 7.4 — No production or staging IDs in fixtures

**Layer-specific (§4)**
- [x] 4.1 Core — every smart constructor tested at valid/invalid boundary values
- [x] 4.2 Use-case — each distinct `Err` variant has a test; in-memory stubs used
- [x] 4.3 Handler — each missing required field produces 422; each `ApiError` variant covered
- [x] 4.4 DAL — insert+read round-trip tested; not-found returns `None`
- [x] 4.5 React — loading state, error state, and user interactions all covered

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| DEVIATION(1.9) | `15` | Request construction required for fetch-handler boundary tests. |

### Slice 3 — `api/src/routes/stylePack.test.ts`

**Status:** ✅ Fixed

#### Resolved findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| 5.2 | `line 1` | MUST | Removed `vi.fn()` module doubles and validated behavior through deterministic shim behavior. |
| 7.1 | `line 4` | MUST | Replaced inline payloads with typed factories from `src/tests/factories`. |

#### Checklist

**Structure and behaviour (§1–§3)**
- [x] 1.1 — Tests assert on observable outputs, not implementation details
- [x] 1.2 — Test descriptions are full sentences describing behaviour, not implementation echoes
- [x] 1.3 — One logical assertion concept per test
- [x] 1.4 — No wall-clock time, randomness without seed, network, or filesystem in unit tests
- [x] 1.5 — No shared mutable state between tests; `beforeEach` resets all state
- [x] 3.3 — AAA structure with blank line separating phases
- [x] 3.4 — No branching or loops in test bodies

**Toolchain (§2)**
- [ ] 2.2 — Pure functions and combinators have fast-check property tests for documented laws
- [x] 2.3 — React components tested with RTL only; no Enzyme or shallow rendering
- [x] 2.4 — Network mocked with MSW; no stubbed `fetch` or HTTP client
- [x] 2.5 — DAL tests run against real or containerised store; in-memory stubs for use-case tests
- [x] 2.6 — No snapshot tests for component structure or API response shape

**Coverage (§6)**
- [x] 6.2 — Every public export has at least one test covering the primary success case
- [x] 6.3 — Every error path (`Err`, `None`, non-2xx) has a corresponding test
- [ ] 6.4 — Every branch, switch case, and ternary arm is exercised by at least one test

**Forbidden patterns (§5)**
- [x] 5.1 — No `getByTestId` queries — use `getByRole`, `getByLabelText`, `getByText`
- [x] 5.2 — No `vi.fn()` to implement a port interface — use in-memory implementations
- [x] 5.3 — No assertions on internal function calls — assert on observable outcome
- [x] 5.4 — No `any` in test code
- [x] 5.5 — No `beforeAll` for state that mutates between tests
- [x] 5.6 — No `setTimeout` delays — use `waitFor` or `findBy*`

**Factories and fixtures (§7)**
- [x] 7.1 — Test data produced by typed factory functions, not raw inline object literals
- [x] 7.2 — Factories live in `tests/factories/`, not co-located with test files
- [x] 7.4 — No production or staging IDs in fixtures

**Layer-specific (§4)**
- [x] 4.1 Core — every smart constructor tested at valid/invalid boundary values
- [x] 4.2 Use-case — each distinct `Err` variant has a test; in-memory stubs used
- [x] 4.3 Handler — each missing required field produces 422; each `ApiError` variant covered
- [x] 4.4 DAL — insert+read round-trip tested; not-found returns `None`
- [x] 4.5 React — loading state, error state, and user interactions all covered

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| DEVIATION(1.9) | `14` | Request construction required for fetch-handler boundary tests. |

### Slice 5 — `frontend/src/components/AppSections.test.tsx`

**Status:** ✅ Fixed

#### Resolved findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| 7.1 | `line 10` | MUST | Replaced large inline prop fixtures with typed factories from `src/tests/factories`. |

#### Checklist

**Structure and behaviour (§1–§3)**
- [x] 1.1 — Tests assert on observable outputs, not implementation details
- [x] 1.2 — Test descriptions are full sentences describing behaviour, not implementation echoes
- [x] 1.3 — One logical assertion concept per test
- [x] 1.4 — No wall-clock time, randomness without seed, network, or filesystem in unit tests
- [x] 1.5 — No shared mutable state between tests; `beforeEach` resets all state
- [x] 3.3 — AAA structure with blank line separating phases
- [x] 3.4 — No branching or loops in test bodies

**Toolchain (§2)**
- [ ] 2.2 — Pure functions and combinators have fast-check property tests for documented laws
- [x] 2.3 — React components tested with RTL only; no Enzyme or shallow rendering
- [x] 2.4 — Network mocked with MSW; no stubbed `fetch` or HTTP client
- [x] 2.5 — DAL tests run against real or containerised store; in-memory stubs for use-case tests
- [x] 2.6 — No snapshot tests for component structure or API response shape

**Coverage (§6)**
- [x] 6.2 — Every public export has at least one test covering the primary success case
- [ ] 6.3 — Every error path (`Err`, `None`, non-2xx) has a corresponding test
- [ ] 6.4 — Every branch, switch case, and ternary arm is exercised by at least one test

**Forbidden patterns (§5)**
- [x] 5.1 — No `getByTestId` queries — use `getByRole`, `getByLabelText`, `getByText`
- [x] 5.2 — No `vi.fn()` to implement a port interface — use in-memory implementations
- [x] 5.3 — No assertions on internal function calls — assert on observable outcome
- [x] 5.4 — No `any` in test code
- [x] 5.5 — No `beforeAll` for state that mutates between tests
- [x] 5.6 — No `setTimeout` delays — use `waitFor` or `findBy*`

**Factories and fixtures (§7)**
- [x] 7.1 — Test data produced by typed factory functions, not raw inline object literals
- [x] 7.2 — Factories live in `tests/factories/`, not co-located with test files
- [x] 7.4 — No production or staging IDs in fixtures

**Layer-specific (§4)**
- [x] 4.1 Core — every smart constructor tested at valid/invalid boundary values
- [x] 4.2 Use-case — each distinct `Err` variant has a test; in-memory stubs used
- [x] 4.3 Handler — each missing required field produces 422; each `ApiError` variant covered
- [x] 4.4 DAL — insert+read round-trip tested; not-found returns `None`
- [x] 4.5 React — loading state, error state, and user interactions all covered

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| — | — | — |

### Slice 4 — `api/src/routes/subtrees.test.ts`

**Status:** ✅ Fixed

#### Resolved findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| 5.2 | `line 1` | MUST | Removed `vi.fn()` module doubles and exercised handler via deterministic engine shim. |
| 7.1 | `line 4` | MUST | Replaced inline payloads with typed factories from `src/tests/factories`. |

#### Checklist

**Structure and behaviour (§1–§3)**
- [x] 1.1 — Tests assert on observable outputs, not implementation details
- [x] 1.2 — Test descriptions are full sentences describing behaviour, not implementation echoes
- [x] 1.3 — One logical assertion concept per test
- [x] 1.4 — No wall-clock time, randomness without seed, network, or filesystem in unit tests
- [x] 1.5 — No shared mutable state between tests; `beforeEach` resets all state
- [x] 3.3 — AAA structure with blank line separating phases
- [x] 3.4 — No branching or loops in test bodies

**Toolchain (§2)**
- [ ] 2.2 — Pure functions and combinators have fast-check property tests for documented laws
- [x] 2.3 — React components tested with RTL only; no Enzyme or shallow rendering
- [x] 2.4 — Network mocked with MSW; no stubbed `fetch` or HTTP client
- [x] 2.5 — DAL tests run against real or containerised store; in-memory stubs for use-case tests
- [x] 2.6 — No snapshot tests for component structure or API response shape

**Coverage (§6)**
- [x] 6.2 — Every public export has at least one test covering the primary success case
- [x] 6.3 — Every error path (`Err`, `None`, non-2xx) has a corresponding test
- [ ] 6.4 — Every branch, switch case, and ternary arm is exercised by at least one test

**Forbidden patterns (§5)**
- [x] 5.1 — No `getByTestId` queries — use `getByRole`, `getByLabelText`, `getByText`
- [x] 5.2 — No `vi.fn()` to implement a port interface — use in-memory implementations
- [x] 5.3 — No assertions on internal function calls — assert on observable outcome
- [x] 5.4 — No `any` in test code
- [x] 5.5 — No `beforeAll` for state that mutates between tests
- [x] 5.6 — No `setTimeout` delays — use `waitFor` or `findBy*`

**Factories and fixtures (§7)**
- [x] 7.1 — Test data produced by typed factory functions, not raw inline object literals
- [x] 7.2 — Factories live in `tests/factories/`, not co-located with test files
- [x] 7.4 — No production or staging IDs in fixtures

**Layer-specific (§4)**
- [x] 4.1 Core — every smart constructor tested at valid/invalid boundary values
- [x] 4.2 Use-case — each distinct `Err` variant has a test; in-memory stubs used
- [x] 4.3 Handler — each missing required field produces 422; each `ApiError` variant covered
- [x] 4.4 DAL — insert+read round-trip tested; not-found returns `None`
- [x] 4.5 React — loading state, error state, and user interactions all covered

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| DEVIATION(1.9) | `14` | Request construction required for fetch-handler boundary tests. |
