# TSF++ Audit — frontend annotations re-audit

**Target:** frontend/src/App.tsx, frontend/src/components/BcktrckEditor.tsx, frontend/src/components/AppSections.tsx
**Focus:** annotations
**Standard:** @tsfpp/standard v1.0.0
**Date:** 2026-05-17 00:15
**Status:** ⚠️ Violations found

---

## Summary

JSDoc coverage for exported symbols is complete across all audited files. Two NOTE markers do not include a ticket identifier, which violates the project marker format requirement for NOTE-class markers.

| Category    | Violations | Deviations | Passed |
|-------------|-----------|------------|--------|
| Types       | 0         | 0          | 3      |
| Purity      | 0         | 0          | 3      |
| Boundary    | 0         | 0          | 3      |
| Annotations | 2         | 0          | 1      |
| Complexity  | 0         | 0          | 3      |

Top 3 highest-priority issues:
1. NOTE marker in `frontend/src/App.tsx` is missing a ticket identifier.
2. NOTE marker in `frontend/src/components/AppSections.tsx` is missing a ticket identifier.
3. No third high-priority annotation issue found in scope.

---

## Slices

| # | Path | Status |
|---|------|--------|
| 1 | `frontend/src/App.tsx` | ⚠️ |
| 2 | `frontend/src/components/BcktrckEditor.tsx` | ✅ |
| 3 | `frontend/src/components/AppSections.tsx` | ⚠️ |

---

<!-- Slices are appended below as the audit progresses -->

### Slice 1 — `frontend/src/App.tsx`

**Status:** ⚠️ Violations found

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| annotations/marker-format | `line 228` | SHOULD | `NOTE(unknown, 2026-05-17)` is missing the required ticket token (expected date + author + ticket). |

#### Checklist

- [x] JSDoc on every export
- [x] `@param` and `@returns` present on exported symbol docs
- [x] Module-level documentation present
- [ ] TODO/HACK/FIXME/NOTE/OPTIMIZE/BUG/XXX marker format includes date + author + ticket

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| — | — | No deviations in this slice. |

### Slice 2 — `frontend/src/components/BcktrckEditor.tsx`

**Status:** ✅ Clean

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| CLEAN | `frontend/src/components/BcktrckEditor.tsx` | CLEAN | Module-level docs exist and exported symbol JSDoc includes `@param` and `@returns`; no marker format issues found. |

#### Checklist

- [x] JSDoc on every export
- [x] `@param` and `@returns` present on exported symbol docs
- [x] Module-level documentation present
- [x] TODO/HACK/FIXME/NOTE/OPTIMIZE/BUG/XXX marker format includes date + author + ticket

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| — | — | No deviations in this slice. |

### Slice 3 — `frontend/src/components/AppSections.tsx`

**Status:** ⚠️ Violations found

#### Findings

| Rule | Location | Severity | Finding |
|------|----------|----------|---------|
| annotations/marker-format | `line 428` | SHOULD | `NOTE(unknown, 2026-05-17)` is missing the required ticket token (expected date + author + ticket). |

#### Checklist

- [x] JSDoc on every export
- [x] `@param` and `@returns` present on exported symbol docs
- [x] Module-level documentation present
- [ ] TODO/HACK/FIXME/NOTE/OPTIMIZE/BUG/XXX marker format includes date + author + ticket

#### Deviation register

| Ref | Line | Justification |
|-----|------|---------------|
| — | — | No deviations in this slice. |
