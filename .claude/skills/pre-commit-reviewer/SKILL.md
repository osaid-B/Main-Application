---
name: pre-commit-reviewer
description: Use BEFORE any git commit. Runs type-check + lint + design-system-checker on staged files. Reports a concise summary and BLOCKS the commit if any check fails. Also surfaces unrelated pre-existing errors so they aren't confused with new ones.
---

# Pre-Commit Reviewer

## When to invoke
- Before running `git commit` (any commit, in any branch)
- When user says "let's commit" / "ready to ship"
- After finishing a feature unit

## Steps

### 1. Identify the changed scope
Run `git status --short` and `git diff --name-only --cached`.
- Distinguish: staged files (committed scope) vs. modified-but-unstaged.
- Focus subsequent checks on the staged set, but warn if unstaged work might be expected.

### 2. Type-check
Run `npx tsc --noEmit`. Capture output.
- 0 errors → ✅
- Errors → list them. If error is in a file NOT in the staged set, mark as **pre-existing** (still report, but don't block).
- Errors in staged files → ❌ BLOCK commit.

### 3. ESLint
Run `npm run lint` (or `npx eslint <staged files>` for narrow scope).
- Apply same logic: errors in staged files BLOCK; pre-existing errors in other files surface as informational.

### 4. Design-system check
Invoke the `design-system-checker` skill on each staged `.tsx`/`.css` file.
- Violations BLOCK.

### 5. (Optional) API contract check
If any staged file contains `fetch(` / `axios.` calls, invoke `api-contract-validator`.

### 6. Test (if any)
`npm test` if a test command exists in package.json. Currently the project has no test script — skip.

### 7. Build sanity (optional, slower)
If the user has time for a full safety check, run `npm run build`. Errors here BLOCK.

## Reporting format

```
pre-commit-reviewer — Summary
  ✓ type-check        (0 errors)
  ✗ lint              (3 new errors in staged Foo.tsx; 11 pre-existing in Bar.tsx)
  ✓ design-system     (clean)
  ✓ api-contracts     (no API calls in this diff)
  − build             (skipped)

  ❌ BLOCKED — fix lint errors in Foo.tsx before committing.
  
  Pre-existing (not blocking, but worth noting):
    Bar.tsx: 11 errors (out of scope for this commit)
```

Or on success:
```
pre-commit-reviewer — Summary
  ✓ type-check    (0)
  ✓ lint          (0 new; N pre-existing tracked separately)
  ✓ design-system (clean)
  ✓ api-contracts (clean)
  
  ✅ READY TO COMMIT
  Suggested message: "feat(...): ..." (Conventional Commits per CLAUDE.md §9)
```

## Never do
- Don't run `git commit` yourself — only report status. The user runs the commit.
- Don't suggest `--no-verify` to skip hooks.
- Don't auto-fix lint errors silently — show them, let the user decide.
- Don't conflate pre-existing errors with new ones — always separate.
