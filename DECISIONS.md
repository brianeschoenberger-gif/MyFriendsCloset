# DECISIONS.md

Document product and technical decisions here.

## Decision format

### YYYY-MM-DD - Decision title

Decision:
Context:
Options considered:
Why:
Consequences:

### 2026-06-10 - Vite React prototype with session-local state

Decision: Use Vite, React 19, TypeScript, Tailwind CSS tooling, and local React state for the first prototype.
Context: The repository was empty and the goal prioritizes a lovable clickable demo over backend infrastructure.
Options considered: Next.js with server routes, React/Vite, or static HTML.
Why: Vite provides the smallest fast-feedback setup while React supports the interactive flows and later component extraction.
Consequences: Prototype state resets on refresh. Persistence remains Phase 2 work.

### 2026-06-10 - CSS-generated wardrobe imagery

Decision: Represent garments with designed gradients and CSS silhouettes instead of remote stock photos.
Context: The prototype needs reliable, coherent visuals without fragile external image dependencies or licensing ambiguity.
Options considered: Remote image URLs, bundled stock photography, or CSS illustrations.
Why: CSS imagery loads instantly, works offline, and gives the demo a distinctive editorial system.
Consequences: Future image upload work can replace each visual without changing the card interaction model.

### 2026-06-10 - One shell before route complexity

Decision: Implement Phase 1 screens as state-driven views inside one app shell before introducing a router.
Context: The initial value is proving the user journey and visual language.
Options considered: React Router immediately or state-driven navigation.
Why: State-driven views keep the initial increment compact and fully clickable.
Consequences: Add routing when deep links or persistent browser history become a priority.

### 2026-06-11 - Test behavior through the app shell

Decision: Use Vitest, jsdom, and Testing Library to cover the prototype's core interactions through accessible UI controls.
Context: Session-local state now drives item creation, visibility, borrowing, approvals, and generated outfit results.
Options considered: Unit-test state helpers only, browser-only regression checks, or interaction tests at the app boundary.
Why: App-boundary tests protect the user journeys while allowing internal components and data modules to evolve.
Consequences: New interactive flows should add focused tests, while browser checks remain responsible for responsive visual quality.

### 2026-06-11 - Local-first persistence for the playable beta

Decision: Persist demo identity, closet items, image data URLs, and borrow requests in versioned localStorage keys behind a small storage module.
Context: The beta needs to work immediately without Supabase credentials while preserving a clear upgrade path to hosted auth, database, and storage.
Options considered: Block on Supabase setup, use IndexedDB, or use localStorage with strict image limits.
Why: localStorage is simple, synchronous, testable, and sufficient for a single-device playable beta. Data URLs make phone camera uploads survive refresh.
Consequences: Data is browser-specific and constrained by storage quota. Images are limited to 5 MB; image compression and a Supabase repository are the next infrastructure steps.

### 2026-06-11 - Demo identities before production auth

Decision: Use Brian as owner and Alex as friend with a visible identity switcher.
Context: The owner-to-friend sharing loop must be testable without account credentials or a second device.
Options considered: Production auth now, separate demo routes, or an in-app identity switcher.
Why: The switcher makes permissions, sharing, requests, and statuses directly testable while keeping the future auth boundary explicit.
Consequences: The demo is not secure authentication. Hosted beta work must replace identity selection with verified sessions.

### 2026-06-11 - Evidence-based beta gate and browser E2E

Decision: Score beta readiness in BETA_CHECKLIST.md and require a 390px Playwright test for the complete persisted owner/friend flow.
Context: Passing builds and component tests alone do not prove that upload, refresh, identity switching, sharing, and approval work together in a phone-sized browser.
Options considered: Continue manual-only checks, rely on Testing Library, or add Playwright with a stable image fixture.
Why: Playwright provides repeatable evidence across the real browser persistence boundary while the checklist prevents unverified work from being marked complete.
Consequences: Browser installation is required once in each environment. Future beta changes must keep both Vitest and Playwright suites passing and update checklist evidence.

### 2026-06-11 - Atomic persistence and bounded photo storage

Decision: Downscale raster uploads to a maximum 1600px dimension, encode them as JPEG at 82 percent quality, and write localStorage synchronously before updating React state.
Context: Modern phone photos can exhaust localStorage quickly, while effect-based persistence can let the UI report success before a quota failure occurs.
Options considered: Keep a 5 MB rejection limit, move immediately to IndexedDB, or compress before an atomic localStorage write.
Why: Compression substantially increases the number of usable beta uploads without changing the current repository boundary. Atomic writes keep UI state aligned with durable state and expose actionable quota failures.
Consequences: SVG and GIF uploads are preserved without raster conversion. Physical devices still have browser-specific quotas, so hosted object storage remains necessary for a multi-device beta.
