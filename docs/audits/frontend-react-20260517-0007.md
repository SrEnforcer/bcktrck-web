# TSF++ Audit — frontend react

**Target:** frontend/
**Focus:** react
**Standard:** @tsfpp/standard v1.0.0
**Date:** 2026-05-17 00:07
**Status:** ✅ Resolved

---

## Summary

All previously reported React violations are resolved. Component signature annotations are explicit, and the `App` style-editor synchronization no longer relies on `setState` inside `useEffect`.

| Category    | Violations | Deviations | Passed |
|-------------|-----------|------------|--------|
| Types       | 0         | 0          | 6      |
| Purity      | 0         | 0          | 6      |
| Boundary    | 0         | 0          | 6      |
| Annotations | 0         | 0          | 6      |
| Complexity  | 0         | 0          | 6      |

Top 3 highest-priority issues:
1. Resolved: explicit return type added to `frontend/src/App.tsx`.
2. Resolved: explicit return type added to `frontend/src/components/BcktrckEditor.tsx`.
3. Resolved: removed effect-driven derived state assignment in `frontend/src/App.tsx`.

---

## Slices

| # | Path | Status |
|---|------|--------|
| 1 | `frontend/src/App.tsx` | ✅ |
| 2 | `frontend/src/components/*.tsx` | ✅ |
| 3 | `frontend/src/hooks/useOverlayViewport.ts`, `frontend/src/hooks/usePreviewViewport.ts` | ✅ |
| 4 | `frontend/src/hooks/useCompiledSvg.ts`, `frontend/src/hooks/useSubtreeIsolation.ts` | ✅ |
| 5 | `frontend/src/hooks/useThemeEffects.ts`, `frontend/src/hooks/useLocalStoragePersistence.ts`, `frontend/src/hooks/usePrintPageStyle.ts` | ✅ |
| 6 | `frontend/src/main.tsx` | ✅ |

---

<!-- Slices are appended below as the audit progresses -->

### Slice 1 — `frontend/src/App.tsx`

**Status:** ✅ Fixed

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| CLEAN | `frontend/src/App.tsx` | CLEAN | Explicit `React.JSX.Element` return type added and effect-driven derived state update removed. |

#### Checklist

- [x] React component shape and composition
- [x] Readonly props/state typing discipline
- [x] Explicit component return type
- [x] Effect discipline (`useEffect` only for external sync)
- [x] Accessibility basics in rendered JSX

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| — | — | No deviations in this slice. |

#### Resolved

- `react/component-signature` (`frontend/src/App.tsx`): added explicit `React.JSX.Element` return type to `App`.
- `react/effect-discipline` (`frontend/src/App.tsx`): removed `setStyleEditorText` effect update and replaced with derived style text from immutable per-choice map.

### Slice 2 — `frontend/src/components/*.tsx`

**Status:** ✅ Fixed

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| CLEAN | `frontend/src/components/BcktrckEditor.tsx` | CLEAN | Exported component now has explicit `React.JSX.Element` return type and key prop typing remains explicit. |
| CLEAN | `frontend/src/components/AppSections.tsx` | CLEAN | Exported components use explicit `React.JSX.Element` return types and readonly props. |

#### Checklist

- [x] React component shape and composition
- [x] Readonly props/state typing discipline
- [x] Explicit component return type
- [x] Effect discipline (`useEffect` only for external sync)
- [x] Accessibility basics in rendered JSX

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| — | — | No deviations in this slice. |

#### Resolved

- `react/component-signature` (`frontend/src/components/BcktrckEditor.tsx:18`): added explicit `React.JSX.Element` return type.

### Slice 3 — `frontend/src/hooks/useOverlayViewport.ts`, `frontend/src/hooks/usePreviewViewport.ts`

**Status:** ✅ Clean

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| CLEAN | `frontend/src/hooks/useOverlayViewport.ts` | CLEAN | Hook outputs are typed, effects synchronize external browser state, and interaction handlers are memoized. |
| CLEAN | `frontend/src/hooks/usePreviewViewport.ts` | CLEAN | Hook uses typed state model and prelude-based decoding where unknown session data is parsed. |

#### Checklist

- [x] Hook signatures and typed return contracts
- [x] Effect discipline (`useEffect` only for external sync)
- [x] State model quality
- [x] Event-handler stability via memoization where needed
- [x] React-focused typing constraints

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| — | — | No deviations in this slice. |

### Slice 4 — `frontend/src/hooks/useCompiledSvg.ts`, `frontend/src/hooks/useSubtreeIsolation.ts`

**Status:** ✅ Clean

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| CLEAN | `frontend/src/hooks/useCompiledSvg.ts` | CLEAN | Hook boundary interaction and memoized derived outputs are React-compliant. |
| CLEAN | `frontend/src/hooks/useSubtreeIsolation.ts` | CLEAN | Hook state derivation and API synchronization follow React hook rules and typed contracts. |

#### Checklist

- [x] Hook signatures and typed return contracts
- [x] Effect discipline (`useEffect` only for external sync)
- [x] State model quality
- [x] Event-handler stability via memoization where needed
- [x] React-focused typing constraints

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| — | — | No deviations in this slice. |

### Slice 5 — `frontend/src/hooks/useThemeEffects.ts`, `frontend/src/hooks/useLocalStoragePersistence.ts`, `frontend/src/hooks/usePrintPageStyle.ts`

**Status:** ✅ Clean

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| CLEAN | `frontend/src/hooks/useThemeEffects.ts` | CLEAN | Effect usage is external synchronization only (media query + document theme state). |
| CLEAN | `frontend/src/hooks/useLocalStoragePersistence.ts` | CLEAN | Hook is a pure persistence boundary with explicit typed input and guarded side effects. |
| CLEAN | `frontend/src/hooks/usePrintPageStyle.ts` | CLEAN | Hook manages print stylesheet lifecycle with proper mount/unmount synchronization. |

#### Checklist

- [x] Hook signatures and typed return contracts
- [x] Effect discipline (`useEffect` only for external sync)
- [x] State model quality
- [x] Event-handler stability via memoization where needed
- [x] React-focused typing constraints

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| — | — | No deviations in this slice. |

### Slice 6 — `frontend/src/main.tsx`

**Status:** ✅ Clean

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| CLEAN | `frontend/src/main.tsx` | CLEAN | Bootstrap avoids throw-path and conditionally mounts React root safely. |

#### Checklist

- [x] React bootstrap shape
- [x] Boundary-safe root mounting
- [x] No uncaught throw paths in render bootstrap
- [x] Typing and imports
- [x] React-focused entrypoint compliance

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| — | — | No deviations in this slice. |
