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
Evidence: Automated Testing Library coverage verifies owner/friend switching, private-item exclusion, first-run onboarding dismissal persistence, and invite deep-link entry into friend mode. Mobile browser verification previously confirmed both modes.

### Photo upload / camera capture

- [x] Add Item supports image upload.
- [x] Add Item supports mobile camera/photo picker where browser allows.
- [x] Image preview appears before save.
- [x] Saved image appears in My Closet.
- [x] Image survives refresh using the chosen persistence layer.
- [x] Batch uploads can be reviewed and all save privately in one action.

Score: 2/2
Evidence: Vitest uses File objects and verifies one atomic multi-photo save, unique IDs, private visibility after switching to the friend demo, and persistence after remount. Playwright generates and uploads a 2400x1800 PNG, then proves it was stored as a 1600x1200 JPEG before completing the persisted beta flow. The input uses `accept="image/*"` and `capture="environment"`; physical-device camera behavior remains browser-dependent.

### Closet item persistence

- [x] User can create a closet item.
- [x] Item includes name, category, color, size, visibility, and optional notes.
- [x] Item persists after page refresh.
- [x] User can view item detail.
- [x] User can change visibility.
- [x] User can delete item.

Score: 2/2
Evidence: Automated tests cover creation, restoration, image metadata, and quota failure recovery; manual and component verification cover details and visibility. Persistence is atomic, so rejected writes do not produce false success UI. Delete is implemented with request cleanup.

### Visibility and sharing

- [x] Owner can mark item as private.
- [x] Owner can mark item as friends-visible.
- [x] Owner can mark item as borrowable.
- [x] Friend view hides private items.
- [x] Friend view shows borrowable items.
- [x] Friend sharing is testable through demo mode and invite code.

Score: 2/2
Evidence: Automated visibility test confirms private exclusion and shared-item display. Brian/Alex demo modes, `MFC-BRIAN`, and the copied `?invite=MFC-BRIAN&mode=friend` link make sharing testable without production auth.

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

- [x] Style uses only the owner's photographed items by default.
- [x] Occasion, vibe, conditions, and item metadata change the results.
- [x] Style offers up to three combinations with explanations, or useful guidance when pieces are missing.
- [x] Saved looks survive reload; optional samples and the same-browser demo are explicit.
- [x] Friend mode cannot see the owner's private stylist or private items.

Score: 2/2 for the local feature.
Evidence: Vitest verifies owner-only photo filtering, matching by tags and conditions, owner-only access, save/reload, photo editing, and safe handling of failed storage writes. This is not AI or cross-device verification.

### Deployability

- [x] App has deployment instructions.
- [x] Environment variables are documented as not currently required.
- [x] App is configured as a standard Vite `dist` deployment for Vercel/Netlify.
- [x] Known deployment limitations are documented.

Score: 2/2
Evidence: README contains GitHub Pages, Vercel, and Netlify settings plus localStorage limitations. The GitHub Pages workflow completed successfully on 2026-06-11, and `https://brianeschoenberger-gif.github.io/MyFriendsCloset/` returned HTTP 200 with repository-relative assets.

## Overall beta score

Total possible score: 18 points.

Current score: 18/18
Critical blockers: None for the single-device playable beta. Cross-device sharing remains local-only until a hosted backend is added.
Next highest-impact task: Try a six-piece capsule and a real styling occasion on a physical iPhone. Test capture permissions, time to a useful look, and iOS storage behavior.

Nov 26 verification: lint, 18 Vitest tests, the production build, and six real Chromium Playwright browser tests passed. At 390×844 the tests verified upload/compression, local lending and approval, multiple photos → outfit, and wardrobe download → restore in a fresh browser context → private visibility; the desktop styling flow and legacy wardrobe migration, deletion, and a 12-photo wardrobe beyond 5 MiB with reload were also checked. These are simulated devices, not a physical iPhone.

Garment anchor: 19 Vitest checks and six phone-width Chromium flows passed, including opening a photographed item, choosing Style this piece, and verifying the result preserves the selected garment. No service is contacted.

Manual AI handoff: 22 Vitest tests and seven Chromium Playwright flows passed, including text-only prompt review, invented-piece rejection, valid reply import, save and reopen. The UI fixture mimics a response; it does not exercise a live model or any network endpoint.

Closet navigation: 26 Vitest tests and all seven real Chromium flows passed; the bulk mobile flow uses a suggested Navy color, then finds that garment through search. Ambiguous and transparent fixture photos do not get a color guess.

Edit a look: eight real Chromium flows passed, including switching only a pair of pants in an anchored outfit, then saving and reopening the edited look. Tests also verify wrong-slot swaps and attempts to replace the selected anchor are rejected.

Home quick start: the fixture checks that samples count as zero photos and the first-photo action opens the batch importer. Physical six-garment setup is still the next usability test.
