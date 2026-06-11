# CODEX_STATUS.md

This file helps recurring Codex automation runs resume safely.

## Current status

Status: idle
Current priority: Playable Mobile Beta
Last run: 2026-06-11
Current branch: main
Last commit: `Harden mobile photo persistence`
Persistence choice: Versioned localStorage repository with uploaded images stored as data URLs; Supabase adapter planned.
Auth/demo identity status: Brian owner and Alex friend switcher implemented and persisted.
Photo upload status: Mobile camera/gallery input, preview, 1600px JPEG compression, metadata, validation, atomic persistence, and quota recovery implemented.
Friend sharing status: Alex sees only Brian's Friends/Borrowable items; demo invite code plus copy/share deep link (`?invite=MFC-BRIAN&mode=friend`) are implemented.
Borrow request status: Dates, note, pending status, owner approval/decline, and persistence implemented.
Mobile readiness: 390px friend/request flow was previously verified with no horizontal overflow or console errors; onboarding and invite-link changes are covered by automated DOM tests, but this run could not relaunch Playwright Chromium in the sandbox.
Build status: `npm.cmd run lint` passed; 8 Vitest beta tests passed; the GitHub Pages production build and deployment passed; `npm.cmd run test:e2e` currently fails in this environment with `browserType.launch: spawn EPERM`.
Hosted preview: `https://brianeschoenberger-gif.github.io/MyFriendsCloset/` is live and returned HTTP 200 on 2026-06-11.
Blockers: Cross-device sharing requires a future hosted backend, and this automation environment currently blocks Playwright browser launch even after fixing the Windows `npm.cmd` server command.
Next recommended task: Run the physical-phone camera flow against GitHub Pages, then add sticky mobile save/request actions.
Automation: `continue-my-friends-closet` is active and should prioritize playable beta tasks.

## Beta verification

BETA_CHECKLIST score: 18/18
Lowest-scoring critical area: None; all checklist categories are verified for the single-device beta.
Core flow verified: Yes through Vitest integration coverage and a repository-owned Playwright E2E.
Mobile flow verified: Yes, manually and automatically at 390x844 with no document overflow on the prior run; this run added onboarding/invite-link DOM coverage but could not rerun Playwright because Chromium launch is sandbox-blocked.
Automated test status: 8 Vitest/Testing Library tests pass, including onboarding persistence, invite-link copying, compression metadata, and quota recovery. Playwright config now uses `npm.cmd` on Windows, but browser launch still fails here with `spawn EPERM`.
Manual test status: Prior owner/friend mobile views and request form passed; physical-device camera remains untested in this environment.
Next verification task: Run the documented physical-device camera/quota flow and verify either a hosted deployment target or a sandbox-safe browser runtime for Playwright.

## Notes for next automation run

- Read all project memory files and inspect git status.
- Prioritize persistent upload/share/borrow functionality over mock-only polish.
- Keep the local fallback working when adding hosted services.
- Run lint, tests, build, and mobile browser checks.
- Update project memory, commit completed work, and leave Status: idle.
