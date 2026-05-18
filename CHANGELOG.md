# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0](https://github.com/SrEnforcer/bcktrck-web/compare/workspace-v1.1.0...workspace-v1.2.0) (2026-05-18)


### Features

* **api:** harden boundary adapters and test fixtures ([78f670a](https://github.com/SrEnforcer/bcktrck-web/commit/78f670a0af2cb7af1128217ba76a2a372075cfe5))
* **react:** refactor editor flow and strengthen tests ([c93d114](https://github.com/SrEnforcer/bcktrck-web/commit/c93d114f0d9d1fa5641cda14bfe4d0ad5ac9f154))

## [Unreleased]

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
