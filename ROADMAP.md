# ROADMAP.md

## Phase 1: Playable Mobile Beta

Goal: Create a mobile-first beta where real users can add clothing photos, persist closet items, share borrowable items, and submit borrow requests.

Deliverables:
- Mobile-first UI
- Demo owner/friend identity flow
- Real item creation and photo upload/capture
- Persistent closet items and images
- Friend/demo sharing with visibility rules
- Persistent borrow request and approval flow
- Style Me using saved items
- README testing and deployment instructions

Success criteria:
- App runs locally and builds without errors.
- Owner can add a real clothing photo and see it after refresh.
- Friend mode sees only shared items and can request borrowable items.
- Owner can approve or decline persisted requests.
- Core flow is usable at phone width.

## Next: prove one useful outfit before adding infrastructure

- Test with Brian and, if they opt in, 4–6 people using their own clothes. Give them one real prompt: “What should I wear to dinner tomorrow?” Ask them to add only 6–10 pieces, not their entire wardrobe.
- Measure time to first useful look (target: under five minutes from first photo), completion (target: most participants build a look without help), and actual use (target: at least half save or wear one and at least two return unprompted within a week). Small-sample targets are decision gates, not evidence of market demand.
- If uploads are the bottleneck: ship multi-photo import and faster tagging first. If outfits miss: collect explicit “I'd wear this,” swap, and “not my style” feedback before adding a social feed.

## Phase 2: Make photos fast to add and safe to keep

1. Add multi-photo import, two-tap tag review, thumbnail caching, and IndexedDB/Blob storage with tested migration from existing browser data. Add export/delete; handle full storage before calling a save successful.
2. Add real sign-in and optional cross-device sync. Keep private image storage per owner, enforce sharing permissions on the server for every read, and add revocable invites. Verify cross-account reads, deletion, and lost-device recovery before a friend beta.
3. Preserve the offline/manual journey. For optional image tagging, show what image would be sent and ask for opt-in; suggest category/color/pattern, keep guesses editable, and document retention.

## Phase 3: A stylist constrained to the user's real closet

1. Send confirmed tags and the chosen occasion/preferences by default, not photos. Build candidates from items the user can access.
2. Have the model return structured item IDs and explicit reasoning; reject non-closet IDs, duplicates and incomplete results. Fall back to rules when the model is unavailable or consent is withheld. Keep private closets out of friend suggestions.
3. Add “style around this piece,” swap an item, save and “wore it” flows; try explicit preferences before using calendar or location. Compare the model with the rules baseline on would-wear votes, completion, latency and cost.
4. Keep lending as the differentiator once personal utility works: an optional “one piece I could borrow” slot using only specifically shared, available items. Keep real invites and notifications off until authorized.

## Phase 4: Social and retention

- Friend voting and comments
- Shared event closets
- Better invite and group management

## Phase 5: Monetization experiments

- Freemium limits
- Group event upgrades
- Optional paid AI styling
