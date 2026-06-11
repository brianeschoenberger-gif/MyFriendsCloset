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
