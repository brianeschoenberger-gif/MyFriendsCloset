# TASKS.md

## Current priority

Build Phase 1: Playable Mobile Beta.

The app must work on a phone well enough that the owner can add real clothing photos and a friend can view borrowable items and request them.

## Quality harness tasks

- [x] Create BETA_CHECKLIST.md.
- [x] Score the current app and add evidence for each category.
- [x] Identify and improve Style Me as the lowest-scoring product area.
- [x] Prioritize the next task based on checklist evidence.
- [x] Add a README section called "How to test the playable beta."
- [x] Add a Playwright end-to-end test for owner upload -> refresh -> sharing -> request -> approval -> refresh.
- [x] Add a documented and completed 390px mobile manual test.

## Critical beta tasks

### Persistence and app state

- [x] Inspect existing data/state architecture.
- [x] Choose localStorage data URLs as the credential-free beta fallback.
- [x] Document the persistence decision.
- [x] Create a storage abstraction for identity, closet items, and requests.
- [x] Persist user-created items and borrow requests after refresh.
- [x] Add atomic storage quota handling and image compression.
- [ ] Add a Supabase repository implementation behind the abstraction.

### Demo auth / identity

- [x] Add Brian owner and Alex friend identities.
- [x] Make current mode visible and switchable.
- [x] Restrict friend view by item visibility.
- [x] Add a first-run onboarding explanation.

### Mobile photo upload

- [x] Add mobile image upload/camera capture input.
- [x] Show image preview before saving.
- [x] Persist uploaded image with the item.
- [x] Validate file type, size, and missing-image errors.
- [x] Compress large raster images before local persistence.

### Closet item CRUD

- [x] Save item details, visibility, tags, and notes.
- [x] Show persisted owner items and item details.
- [x] Allow visibility changes and item deletion.
- [ ] Add edit flow for item details and photo.
- [ ] Add richer visibility/category filters and empty states.

### Friend sharing

- [x] Create Friend View mode and demo invite code.
- [x] Show only Friends/Borrowable items to Alex.
- [x] Make Borrowable status and current identity obvious.
- [x] Add copy/share invite-link behavior.

### Borrow requests

- [x] Alex can request a Borrowable item with dates and a note.
- [x] Brian can view, approve, or decline incoming requests.
- [x] Alex can see persisted request status.
- [ ] Prevent unavailable/approved date conflicts.
- [ ] Add returned status action.

### Style Me

- [x] Use saved owner items in mock outfit suggestions.
- [x] Add stateful occasion, vibe, and closet-source controls.
- [x] Add an empty state when fewer than three saved pieces exist.
- [x] Label owned and borrowed sources in each suggestion.
- [ ] Improve item selection by category and occasion tags.

### Mobile usability

- [x] Test the complete beta flow at approximately 390px in a real browser.
- [x] Keep main controls thumb-friendly and avoid horizontal scrolling in existing layouts.
- [ ] Add sticky save/request actions and reduced-motion support.

### Deployability

- [x] Ensure lint, tests, and production build pass.
- [x] Document local run and exact beta test flow.
- [x] Add Vercel and Netlify deployment instructions.
- [ ] Deploy a hosted preview when a target account is available.

## Rules

Prioritize the owner upload -> friend request -> owner response loop over mock-only polish. After each increment, run checks, update project memory, and commit.

## Newly surfaced follow-up

- [ ] Investigate a sandbox-safe browser runtime for Playwright in this automation environment (`browserType.launch: spawn EPERM`), even though app-level E2E logic previously passed.
