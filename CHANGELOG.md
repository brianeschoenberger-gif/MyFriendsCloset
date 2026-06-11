# CHANGELOG.md

Track meaningful changes after each agentic loop.

## Unreleased

- Initialized a Vite, React, TypeScript, and Tailwind CSS project.
- Added project planning and recurring-agent memory files.
- Built a responsive app shell and editorial dashboard for a Palm Springs friend-group story.
- Added interactive My Closet, item visibility, add-item, friend browsing, and borrow request flows.
- Added incoming/outgoing request management with mock approve and decline actions.
- Added a mock AI Style Me experience with three generated outfit concepts.
- Added an Event Closet view with members and shared pieces.
- Added local CSS garment illustrations to avoid external image dependencies.
- Verified desktop and mobile layouts plus add-item, borrowing, request approval, and styling interactions in-browser.
- Split the prototype into typed domain models, mock-data fixtures, reusable closet UI, and focused page components.
- Added Vitest and Testing Library coverage for adding items, changing visibility, borrowing, approving requests, and generating outfits.
- Improved accessible names for modal controls, profile access, outfit items, and the borrowable-only toggle.
- Pivoted the project priority from mock prototype to playable mobile beta.
- Added versioned local persistence for demo identity, closet items, uploaded photos, and borrow requests.
- Added Brian owner and Alex friend modes with visibility-enforced friend sharing.
- Replaced the add-item placeholder with mobile camera/gallery upload, preview, validation, full item details, and deletion.
- Added persisted borrow requests with dates, notes, owner approval/decline, and friend-visible status.
- Updated Style Me to pull from the persisted owner closet.
- Documented exact phone testing plus Vercel and Netlify deployment settings.
- Added BETA_CHECKLIST.md as an evidence-based 18-point quality gate.
- Added a 390px Playwright E2E covering image upload, refresh persistence, visibility, friend request, owner approval, and status persistence.
- Made Style Me occasion, vibe, and closet-source controls stateful.
- Added verified insufficient-closet guidance and explicit owned-versus-borrowed outfit labels.
