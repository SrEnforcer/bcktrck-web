# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Bug fixes
- Validate API startup configuration through a typed config loader so invalid environment values fail fast with structured diagnostics.
- Standardize frontend debug event naming and payload logging so diagnostics are consistent and easier to filter.
- Stabilize subtree isolation decoding across schema variants and suppress transient abort-driven render failure noise.

### Chores
- Align workspace and API TSFPP dependency versions and move the release manifest to the expected repository path.

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
