# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- TSF++ testing factories for API and frontend test suites.
- Release automation and commit hooks scaffolding (`release-please`, Husky, commitlint).
- New audit artifacts under docs/audits for API/frontend conformance runs.

### Changed
- API route handlers and server wiring updated for stricter boundary handling and request flow.
- Frontend editor/render pipeline and supporting hooks/libs refactored for TSF++ compliance.
- Test suites migrated to typed fixture factories and property-based coverage in pure utility modules.
- Repository workflow instructions and agent prompts updated for trunk and TSF++ development flow.
