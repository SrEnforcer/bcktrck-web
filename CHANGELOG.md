# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Bug fixes
- Validate API startup configuration through a typed config loader so invalid environment values fail fast with structured diagnostics.
- Standardize frontend debug event naming and payload logging so diagnostics are consistent and easier to filter.
- Stabilize subtree isolation decoding across schema variants and suppress transient abort-driven render failure noise.
- Suppress visual hint triangles, node icons, and subordinate-count badges in editor compile output while keeping markers in BTL source.
- Add per-node "Node only" subtree isolation in the tree picker so selected departments can independently collapse descendants in union mode.
- Prune collapsed subtree descendants server-side and clean dangling head/link/shadow references so compile preview no longer fails on unknown handles.
- Correct the `@bcktrck/engine` workspace link path in `web/api` and `web/frontend` (`link:../../bcktrck-engine` → `link:../../engine`).
- Update the `mkProblem` call in `server.ts` for boundary 2.x's object-parameter signature (was positional args in 1.1.0).

### Refactoring
- `refactor(core): migrate to @tsfpp/prelude 2.x and @tsfpp/boundary 2.x APIs` — Renames call sites for the v2 breaking changes (`mapOption`/`getOrElseOption`/`entriesOf`, `mkNotFoundError`/`mkRateLimitError`/`mkInternalError`) across `web/api` and `web/frontend`.
- `refactor(core): adopt findO, matchOption/match, and monoid helpers` — Replaces `fromNullable(arr.find(...))` with `findO`, `isNone`/`isSome`/`isOk`/`isErr` ternaries with total `matchOption`/`match`/`orElseOption` eliminators, and ad hoc sum-reduces with `monoidSum`/`foldMap` in `App.tsx`, `usePreviewViewport.ts`, `useSubtreeIsolation.ts`, `subtreeSelection.ts`, `bcktrckLanguage.ts`, and the API routes/server/`httpAdapter`.

### Chores
- Align workspace and API TSFPP dependency versions and move the release manifest to the expected repository path.
- Bootstrap centralized `.ai/` instruction sources, refresh generated Copilot compatibility assets, and update workflow guidance for TSF++ MCP-backed rules.
- `chore(deps): upgrade @tsfpp/prelude, @tsfpp/boundary, @tsfpp/standard, and @tsfpp/agents to latest major versions` — Bumps `@tsfpp/prelude` 1.6/1.7→2.4, `@tsfpp/boundary` 1.1/1.2→2.1, `@tsfpp/standard` 1.3→5.0, and `@tsfpp/agents` 1.8/1.9→2.5 across the workspace root and `web/api`, regenerating the `.ai/`/`.github/`/`.claude` guidance assets.

## [1.1.0] - 2026-05-18

### Added
- TSF++ testing factories for API and frontend test suites.
- Release automation and commit hooks scaffolding (`release-please`, Husky, commitlint).
- New audit artifacts under docs/audits for API/frontend conformance runs.

### Changed
- API route handlers and server wiring updated for stricter boundary handling and request flow.
- Frontend editor/render pipeline and supporting hooks/libs refactored for TSF++ compliance.
- Test suites migrated to typed fixture factories and property-based coverage in pure utility modules.
- Repository workflow instructions and agent prompts updated for trunk and TSF++ development flow.
