# AGENTS.md

## Project

Build a web app called "My Friends Closet."

My Friends Closet is a private social wardrobe app where users upload clothing, choose what friends can see or borrow, and use AI plus friend feedback to plan outfits for events, trips, and everyday life.

Core positioning:

"Shop your friends' closets before you buy something new."

## Product principles

1. Make the app visual, social, and fun.
2. Prioritize a lovable demo before complex backend work.
3. Build in small, testable increments.
4. Use mock data first unless backend infrastructure already exists.
5. Avoid marketplace, payment, shipping, damage-dispute, or insurance features for now.
6. Every feature should support closet sharing, borrowing, styling, or event outfit planning.
7. Make reasonable product decisions without asking the human unless truly blocked.
8. Document meaningful product or architecture decisions.

## Design direction

The app should feel like:
- Pinterest
- Instagram Close Friends
- Depop
- A private group chat for clothes
- A modern AI stylist app

Use:
- Large clothing cards
- Soft rounded cards
- Warm neutral background
- Friend avatars
- Borrowable badges
- Item visibility badges
- Clear CTAs
- Mobile-first responsive layouts
- Strong visual hierarchy
- Friendly, stylish copy

Avoid:
- Admin-dashboard vibes
- Dense tables
- Ugly default forms
- Overly technical UI
- Marketplace complexity
- Payment flows
- Shipping flows

## Technical direction

If no app exists, use:
- React or Next.js
- TypeScript
- Tailwind CSS
- Mock data first

If an app already exists, follow the existing stack and conventions.

## Core pages for Phase 1

Build these before backend complexity:

1. Landing page
2. Dashboard
3. My Closet
4. Add Item
5. Item Detail
6. Friends' Closets
7. Borrow Requests
8. Style Me
9. Event Closet

## MVP data models

Use mock data initially.

User:
- id
- name
- avatar
- sizes
- stylePreferences

ClosetItem:
- id
- ownerId
- ownerName
- imageUrl
- name
- category
- color
- size
- brand
- occasionTags
- visibility
- isBorrowable
- availability
- notes

BorrowRequest:
- id
- itemId
- requesterId
- ownerId
- startDate
- endDate
- status
- note

Outfit:
- id
- title
- occasion
- items
- explanation
- borrowedItems
- vibe

EventCloset:
- id
- title
- date
- location
- members
- suggestedOutfits
- sharedItems

## Agentic loop behavior

Work in repeated loops.

For each loop:

1. Read AGENTS.md, PRODUCT_SPEC.md, ROADMAP.md, TASKS.md, DECISIONS.md, CHANGELOG.md, and CODEX_STATUS.md if it exists.
2. Inspect the current app and codebase.
3. Check git status and recent commits.
4. Check whether another Codex run appears active.
5. Pick the highest-value unfinished task from TASKS.md.
6. Implement it in a small, coherent increment.
7. Run relevant checks: install if needed, lint, typecheck, tests, and build.
8. Fix any errors caused by the change.
9. Update TASKS.md with completed work and newly discovered tasks.
10. Update CHANGELOG.md with a concise summary.
11. Update DECISIONS.md if a product or architecture decision was made.
12. Update CODEX_STATUS.md with current state, checks, blockers, and next recommended task.
13. Commit the changes with a clear commit message.
14. Continue to the next loop if capacity/time allows.

## 60-minute automation behavior

This project is intended to be run by a Codex automation every 60 minutes. Each run should be safe to start, safe to stop, and safe to resume.

At the beginning of each run:
- Restore context from project memory files.
- Check git status and recent commits.
- Check CODEX_STATUS.md.
- Avoid duplicating completed work.
- Avoid overwriting unfinished work unless finishing it.

At the end of each run:
- Commit completed work.
- Update TASKS.md, CHANGELOG.md, DECISIONS.md if needed, and CODEX_STATUS.md.
- Leave a clear next task.

## Anti-overlap rules

Before making changes, inspect whether another agent appears active. Signals include very recent uncommitted changes, a running status, a lock note, or incomplete files currently being edited.

If another run appears active, stop and update CODEX_STATUS.md with a skipped-run note. Do not create conflicting changes.

## Stopping rules

Stop only when blocked by missing credentials, a human decision is truly required, the environment prevents a build, all tasks are complete, limits prevent progress, or tooling stops you.

When blocked, write what completed, what failed, what is needed from the human, and the next recommended task.
