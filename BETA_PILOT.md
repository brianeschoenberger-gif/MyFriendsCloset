# Closet beta: does it find something you want to wear?

## First pilot (one person, five minutes)

Use a physical phone, the public app, and a real upcoming occasion. Start with two tops, two bottoms, one pair of shoes and one jacket, or use dresses that fit the occasion. These are private photos on that phone, not test submissions.

1. From Home, tap **Add your first photos**. Choose the six photos together, confirm categories, and skip names and colors if you're in a hurry. Include one original iPhone camera photo from the Photo Library. Check that it appears upright and survives reopening Safari. If it fails, compare a JPEG export of the same photo to isolate the problem.
2. Tap **Style my photos**, enter the real occasion and build looks. Start a clock at the first photo and note when the first *wearable* result appears, not just the first result.
3. If it's close, swap one piece. Save a look you'd wear. Return on the day and mark it worn only if you actually wore it.
4. Note the biggest snag: capture, tagging, trust, styling quality, or something else. If no look felt wearable, write down why. Try the same occasion with the separate ChatGPT handoff only if you want to compare.

A promising result is one usable look in under five minutes without coaching. For a small opt-in pilot (4–6 people), look for at least half saving or wearing a look, and at least two returning within a week without being prompted. These are product signals, not statistical claims. Do not solicit testers on someone's behalf, require screenshots of private wardrobes, or collect photos in analytics.

## How to choose what to build next

| Observed problem | Next smallest test |
|---|---|
| People cannot get six items in quickly | Watch where time goes. Improve the phone photo picker, review queue or optional tags before adding a hosted image pipeline. |
| People finish setup but wouldn't wear the results | Give them the same occasion with the same wardrobe and compare local suggestions with a text-only model; ask which they'd actually wear before revealing the source. |
| People want to reuse their closet on another phone | Offer backup now. Prototype opt-in account sync in a private test environment using synthetic items. |
| People complete an actual clothing loan but coordination is hard | Ask which step broke (discovery, dates, pickup or return). Build only that step after a real, consented two-device trial. |

## Gates for any hosted private beta

- Keep the public local app usable by itself. Test a hosted adapter privately with synthetic accounts before accepting real data. Keep existing data local unless the owner selects what to import.
- Give each account its own garments and put photos in private storage. Check authorization on reads and writes, including direct API calls; a hidden UI is not a permission check. Start with owner sync, then separately test consented, revocable per-item access. A downloaded or screenshotted photo cannot be recalled.
- Use two unrelated test accounts plus a signed-out browser. Confirm neither can list the other's private data or obtain its files, even if they know an ID or path. Verify short-lived image access, logout, deletion, rollback and backup restoration before rollout.
- For automatic styling, send only confirmed categories, colors, names and the chosen occasion by default. Ask first, hold credentials on the server, cap calls and cost, and log operational metadata without garment names or photos. Reject unowned, duplicate and invalid IDs. Keep instant local matching as the fallback.
- Model and hosting providers are decisions, not dependencies of the public app today. A non-deployed [server proof of concept](server/README.md) is exercised with stub transport and synthetic account data. References for a possible implementation: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [private storage access](https://supabase.com/docs/guides/storage/security/access-control), [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), and [production key handling](https://developers.openai.com/api/docs/guides/production-best-practices).
