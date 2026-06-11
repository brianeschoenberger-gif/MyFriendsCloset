# CODEX_STATUS.md

This file helps recurring Codex automation runs resume safely.

## Current status

Status: idle
Current priority: Playable Mobile Beta
Last run: 2026-06-11
Current branch: main
Last commit: `Add evidence-based beta verification`
Persistence choice: Versioned localStorage repository with uploaded images stored as data URLs; Supabase adapter planned.
Auth/demo identity status: Brian owner and Alex friend switcher implemented and persisted.
Photo upload status: Mobile camera/gallery input, preview, 1600px JPEG compression, metadata, validation, atomic persistence, and quota recovery implemented.
Friend sharing status: Alex sees only Brian's Friends/Borrowable items; demo invite code is shown.
Borrow request status: Dates, note, pending status, owner approval/decline, and persistence implemented.
Mobile readiness: 390px friend/request flow verified with no horizontal overflow or console errors; camera upload persistence covered by automated browser-DOM tests.
Build status: Lint passed; 6 Vitest beta tests passed; 390px Playwright compression/core-flow E2E passed; production build passed.
Blockers: Cross-device sharing requires a future hosted backend, but the complete single-device beta loop works locally.
Next recommended task: Add a copyable invite link and first-run onboarding; verify a hosted preview when a deployment target is available.
Automation: `continue-my-friends-closet` is active and should prioritize playable beta tasks.

## Beta verification

BETA_CHECKLIST score: 17/18
Lowest-scoring critical area: Deployability at 1/2 because no hosted target has been verified.
Core flow verified: Yes through Vitest integration coverage and a repository-owned Playwright E2E.
Mobile flow verified: Yes, manually and automatically at 390x844 with no document overflow.
Automated test status: 6 Vitest/Testing Library tests and 1 Playwright E2E pass, including compression metadata and quota recovery.
Manual test status: Owner/friend mobile views and request form passed; physical-device camera remains untested.
Next verification task: Run the documented physical-device camera/quota flow and verify a hosted deployment when targets are available.

## Notes for next automation run

- Read all project memory files and inspect git status.
- Prioritize persistent upload/share/borrow functionality over mock-only polish.
- Keep the local fallback working when adding hosted services.
- Run lint, tests, build, and mobile browser checks.
- Update project memory, commit completed work, and leave Status: idle.
