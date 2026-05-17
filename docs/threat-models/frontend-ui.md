# Frontend UI Threat Model

**Surface:** Frontend SPA (`frontend/src/**`)
**Method:** Lightweight STRIDE
**Date:** 2026-05-17

## @threatModel FrontendUI

### Trust boundaries

- Boundary 1: Browser user input and persisted storage values (`localStorage`, `sessionStorage`) into React state.
- Boundary 2: API responses from `/api/compile`, `/api/subtrees`, `/api/style-pack` into UI rendering and interaction flows.
- Boundary 3: Rendered SVG output into preview, overlay, and print surfaces.

### STRIDE review

- Spoofing: API endpoints are same-origin and consumed via fixed relative paths; no credential tokens stored in browser storage.
- Tampering: API payloads are runtime-decoded with guarded field extraction before domain use.
- Repudiation: Client debug logs are non-authoritative and debug-gated; server traceability is handled by API boundaries.
- Information disclosure: SVG data is sanitized before render; rendering uses image `src` data URIs rather than HTML injection sinks.
- Denial of service: Large payload pressure is primarily mitigated server-side; frontend keeps decode guards and abortable fetches.
- Elevation of privilege: No auth/session token logic exists in frontend storage or state transitions.

### Controls in place

- SVG sanitization at boundary: `frontend/src/lib/svgSanitization.ts`.
- Runtime input guards for API payloads: `frontend/src/hooks/useCompiledSvg.ts`, `frontend/src/hooks/useSubtreeIsolation.ts`.
- No browser token persistence: verified across `frontend/src/hooks/useLocalStoragePersistence.ts` and `frontend/src/hooks/usePreviewViewport.ts`.

### Residual risks

- Data URI rendering for large SVG documents can increase memory footprint in constrained browsers.
- Frontend security posture assumes backend endpoint controls remain enforced (rate limits, payload caps, sanitized error responses).
