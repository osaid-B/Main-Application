---
name: api-contract-validator
description: Use when reviewing code that calls fetch / axios / any HTTP client, or when about to write a new API call. Reads api-contracts.md and verifies that every call's endpoint name, request shape, and response shape matches the documented contract. Blocks calls to undocumented endpoints.
---

# API Contract Validator

## Source of truth
`api-contracts.md` at the project root. **Every endpoint the frontend consumes
MUST be documented there before any `fetch` call is written.**

## When to invoke
- Reviewing any code that contains `fetch(`, `axios.`, or any HTTP-call pattern
- Before approving a PR that touches `src/services/` or any data fetching code
- When the user asks "is this API call right?"
- When introducing a new endpoint usage

## Checks

### 1. Discover every API call site in the file
Search for:
- `fetch(`
- `axios.` (`.get`, `.post`, `.put`, `.patch`, `.delete`)
- Any wrapper from `src/services/http.ts` (once it exists)

### 2. For each call, extract
- **Method** (GET/POST/PATCH/DELETE — from the call signature)
- **Path** (the URL string passed in)
- **Request body shape** (the TypeScript type of the body argument, if any)
- **Expected response type** (the type the result is assigned to / cast to)

### 3. Match against `api-contracts.md`
Open `api-contracts.md`. For each call:
- Find the endpoint section matching the method + path.
- **If not found** → ❌ FAIL: `Endpoint <method> <path> is not documented in api-contracts.md. Per project rules, undocumented endpoints are forbidden. Add it to api-contracts.md (coordinate with backend) before writing the call.`
- **If found but `Status: 🟡 Proposed`** → ⚠️ WARN: implementation is ahead of backend agreement. Confirm before proceeding.
- **If found and `Status: 🟢 Confirmed` or `🔵 Implemented`**:
  - Verify the request shape in code matches the documented `type Request = { … }`.
  - Verify the response type in code matches `type Response = { … }`.
  - If shapes diverge, report the field-level differences.

### 4. Extra checks
- Verify the call goes through `src/services/http.ts` (the wrapper) and not direct `fetch` / `axios`. Per `CLAUDE.md` §8: "Pages never call `fetch` / `axios` directly."
- Verify error handling uses the `ApiError` type (once introduced).
- Verify any IDs are strings (not numbers) per the contracts' conventions.
- Verify timestamps are ISO 8601 strings.

## Reporting format

Per file:
```
api-contract-validator — <file>
  ✓ GET  /api/v1/customers       (matches contract, 🟢 Confirmed)
  ✗ POST /api/v1/orders          (NOT in api-contracts.md)
  ⚠ PATCH /api/v1/products/:id   (in contracts, but Status: 🟡 Proposed)

  Action: add POST /api/v1/orders to api-contracts.md before merging.
```

Final verdict:
- **PASS** — all calls documented + shapes match
- **WARN** — calls present but some are proposed-only
- **FAIL** — at least one call missing from `api-contracts.md` or shape mismatch

## Never do
- Don't auto-add the endpoint to `api-contracts.md` — that requires backend coordination.
- Don't suggest hardcoding the URL — the project uses `VITE_API_BASE_URL`.
- Don't approve direct `fetch`/`axios` calls in page components.
