# CHANGELOG.md

Track meaningful changes after each agentic loop.

## Photo-first beta · 2026-11-26

- Added local wear history for saved looks. Users can mark or undo today’s wear and see the last worn date after reload.

- Closed the local lending lifecycle: date validation, overlapping-approval checks, and an owner-only returned state that persists for both demo roles.

- Made the home screen lead with a real wardrobe, a six-piece setup, and an outfit-ready state. Clearly separated sample clothes and the local lending demo.

- Added one-at-a-time garment swaps with comparable private pieces, a protected anchor, undo, and independent saving of the edited look.

- Added closet search across garment details, visibility filters, and photo-first ordering. Added optional color hints computed from a photo on-device; the hint is never set without user input.

- Added an optional ChatGPT copy/paste outfit handoff, with explicit metadata review and strict validation of returned wardrobe IDs. No automatic network transfer.

- Added a “Style this piece” shortcut and garment picker; every generated look includes the selected garment and offers targeted missing-piece guidance.

- Moved wardrobe storage to IndexedDB, safely migrating prior items and keeping the previous browser-local fallback where needed. The app still does not sync or upload photos.

- Added local JSON wardrobe export and validated merge restore. Imported photos start private; repeated restores do not duplicate items.
- Removed a mobile request-navigation race by making page resets instant and status toasts non-interactive.

- Added batch intake for up to 12 garment photos, with removable previews, required categories, optional names/colors, and one atomic private save.
- Made the lending and link UI explicit about same-browser simulation; photos are not in the demo link.
- Added regression coverage for batch import, persistence, and privacy.

- Replaced the sample-first Style screen with photo-grounded rules matching, vibe/occasion/conditions controls, match explanations, and local saved looks.
- Made sample outfits opt-in and clearly labeled; hid owner-only styling from the friend demo.
- Added camera/library choice, closet category filters, and photo/details edits without changing the lending flow.

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
- Added client-side photo downscaling and JPEG compression for large phone uploads.
- Made local persistence atomic and added visible quota-recovery guidance instead of false success states.
- Extended the 390px Playwright flow to verify a 2400x1800 upload is persisted as a 1600x1200 JPEG.
- Added automated coverage proving quota failures keep the add-item form and unsaved data visible.
- Added a persistent first-run beta guide that explains the Brian-to-Alex borrow loop.
- Added copy/share invite-link actions plus a friend-mode deep link for `MFC-BRIAN`.
- Updated Playwright's Windows web-server command to use `npm.cmd` instead of the blocked PowerShell shim.
- Added a GitHub Actions workflow and repository-aware Vite base path for automatic GitHub Pages deployment.
- Published and verified the playable beta on GitHub Pages.
