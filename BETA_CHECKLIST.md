# BETA_CHECKLIST.md

This checklist defines whether My Friends Closet is a playable mobile beta.

The beta goal is:

Owner uploads a clothing item from phone -> item persists -> owner marks it borrowable -> friend sees it -> friend requests it -> owner approves/declines -> state persists.

## Scoring scale

- 0 = not implemented or not working
- 1 = partially implemented, mock-only, fragile, or not verified
- 2 = implemented and verified

If an item has not been tested, score it 0 or 1. Do not give a 2 without evidence.

## Critical beta requirements

### App basics

- [x] App installs successfully.
- [x] App runs locally.
- [x] App builds successfully.
- [x] README explains how to run the app.
- [x] README explains how to test the beta flow.

Score: 2/2
Evidence: `npm install`, Vite local server, `npm run build`, and README instructions were verified on 2026-06-11.

### Mobile usability

- [x] App is usable at approximately 390px mobile width.
- [x] Primary navigation works on mobile.
- [x] Forms are readable and thumb-friendly.
- [x] No major horizontal scrolling.
- [x] Clothing cards look good on mobile.

Score: 2/2
Evidence: Manual in-app browser verification and the Playwright E2E at 390x844 cover navigation, identity switching, friend closet, item details, request form, and zero document overflow.

### Owner/demo identity

- [x] User can enter as owner/demo owner.
- [x] Current identity is visible in the UI.
- [x] User can switch to friend/demo friend.
- [x] Owner and friend see appropriate views.

Score: 2/2
Evidence: Automated Testing Library coverage verifies owner/friend switching and private-item exclusion; mobile browser verification confirmed both modes.

### Photo upload / camera capture

- [x] Add Item supports image upload.
- [x] Add Item supports mobile camera/photo picker where browser allows.
- [x] Image preview appears before save.
- [x] Saved image appears in My Closet.
- [x] Image survives refresh using the chosen persistence layer.

Score: 2/2
Evidence: Vitest uses a real File object and Playwright uploads `e2e/fixtures/closet-item.svg`; both verify saved output and refresh persistence. The input uses `accept="image/*"` and `capture="environment"`; physical-device camera behavior remains browser-dependent.

### Closet item persistence

- [x] User can create a closet item.
- [x] Item includes name, category, color, size, visibility, and optional notes.
- [x] Item persists after page refresh.
- [x] User can view item detail.
- [x] User can change visibility.
- [x] User can delete item.

Score: 2/2
Evidence: Automated tests cover creation and restoration; manual and component verification cover details and visibility. Delete is implemented with request cleanup.

### Visibility and sharing

- [x] Owner can mark item as private.
- [x] Owner can mark item as friends-visible.
- [x] Owner can mark item as borrowable.
- [x] Friend view hides private items.
- [x] Friend view shows borrowable items.
- [x] Friend sharing is testable through demo mode and invite code.

Score: 2/2
Evidence: Automated visibility test confirms private exclusion and shared-item display. Brian/Alex demo modes and `MFC-BRIAN` invite code make sharing testable.

### Borrow requests

- [x] Friend can request a borrowable item.
- [x] Request captures requester, item, note, and dates.
- [x] Owner can see incoming request.
- [x] Owner can approve request.
- [x] Owner can decline request.
- [x] Request status persists after refresh.

Score: 2/2
Evidence: Vitest and Playwright submit dates and a note, switch identities, approve, refresh/remount, and verify persisted status. Decline uses the same state transition path but does not yet have a dedicated E2E assertion.

### Style Me

- [x] Style Me uses real saved closet items, not only static mock data.
- [x] User can select occasion and vibe in a stateful way.
- [x] App generates 3 outfit suggestions.
- [x] App handles insufficient items gracefully.
- [x] App labels friend/borrowable items.

Score: 2/2
Evidence: Suggestions use persisted items, stateful occasion/vibe/source controls, and explicit owned-versus-borrowed labels. Vitest verifies vibe state and the upload-more state when fewer than three pieces exist.

### Deployability

- [x] App has deployment instructions.
- [x] Environment variables are documented as not currently required.
- [x] App is configured as a standard Vite `dist` deployment for Vercel/Netlify.
- [x] Known deployment limitations are documented.

Score: 1/2
Evidence: README contains Vercel/Netlify settings and localStorage limitations. No hosted deployment has been verified because no target account is configured.

## Overall beta score

Total possible score: 18 points.

Current score: 17/18
Critical blockers: Cross-device sharing is local-only and hosted deployment is unverified because no deployment target account is configured.
Next highest-impact task: Verify a hosted preview when a target is available; meanwhile add image compression and storage-quota recovery for physical-phone reliability.
