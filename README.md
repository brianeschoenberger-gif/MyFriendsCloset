# My Friends Closet

A mobile-first social wardrobe beta where an owner uploads clothes, shares borrowable pieces, and responds to friend requests.

## Run locally

```bash
npm install
npm run dev -- --host
```

Open the Vite URL on the computer. To test on a phone connected to the same Wi-Fi, open the Network URL printed by Vite. Windows PowerShell users with script execution disabled can use `npm.cmd`.

## How to test the playable beta

1. Start in **Brian / Owner mode**.
2. Open **My closet** and choose **Add from camera**.
3. Take or select a clothing photo, complete the required fields, choose **Borrowable**, and save.
4. Refresh and confirm the item and photo remain.
5. Switch to **Alex / Friend mode** in the header.
6. Open the saved item in **Brian's closet** and choose **Request to borrow**.
7. Enter dates and a note, then submit.
8. Open **Requests** to confirm Alex sees the pending request.
9. Switch back to **Brian**, open **Requests**, and approve or decline it.
10. Refresh or switch back to Alex and confirm the updated status remains.
11. Optional: in Alex mode, use **Copy invite link** to verify the demo link opens `?invite=MFC-BRIAN&mode=friend` and lands in friend view.

Garments and photos are saved on this browser in IndexedDB when available, with a legacy localStorage fallback. Raster phone photos up to 15 MB are downscaled to a maximum 1600px dimension and stored as compressed JPEGs. If a browser cannot read a HEIC/HEIF photo, try a JPEG copy. If browser storage is full, the form remains open and explains how to recover instead of falsely reporting success. This is a durable single-device demo, not cross-device cloud sync yet.

## Try your private closet stylist

1. Open **Closet → Add from camera**. Use the camera or **Choose from photo library**. Start with a top, a bottom, and shoes (or a dress and shoes); six to ten pieces give more variety.
2. Add a name, category and color. Optionally tag occasions like work, weekend, or dinner. Everything starts **Private**.
3. Open **Style**, add an occasion, and choose a vibe and conditions. **Build my looks** proposes up to three combinations using only your photographed clothes by default. Review the explanation and save a look to reopen later.
4. Select **Include labeled sample pieces** for a demonstration before adding your own clothes. This may include explicitly labeled borrowable samples.

The built-in stylist uses matching rules. The optional ChatGPT handoff below uses a separate conversation that you control. Clothing photos and looks do not leave your browser or sync to another device, browser profile or site origin. Wardrobe changes, saved looks and wear dates refresh other tabs on the same origin in a supported browser. Brian/Alex are seeded roles in the same browser, not accounts; the invite is for testing rather than access control. Clearing browser data may erase your closet.

## Checks

```bash
npm run lint
npm run check:server
npm run test
npm run test:e2e
npm run build
```

`npm run test:e2e` launches the app at a 390x844 viewport, generates a large phone-like PNG, verifies 1600px JPEG compression, and automates the complete persisted beta flow. On Windows, the Playwright web server now uses `npm.cmd` so PowerShell execution-policy blocks do not break startup. Install the browser runtime once with `npx playwright install chromium` if Playwright reports that Chromium is missing.

## Deploy

### GitHub Pages

The repository includes `.github/workflows/deploy-pages.yml`. In GitHub, open **Settings > Pages** and set **Source** to **GitHub Actions**. Every push to `main` then builds and publishes the app at:

`https://brianeschoenberger-gif.github.io/MyFriendsCloset/`

### Vercel

Import the repository, use the Vite preset, set build command to `npm run build`, and output directory to `dist`.

### Netlify

Import the repository, set build command to `npm run build`, and publish directory to `dist`.

Because the current beta uses browser-local storage, each browser/device has its own data. Accounts and sync are not yet connected. See [the pilot and rollout gates](BETA_PILOT.md).

## Architecture

- React 19, TypeScript, Vite, Tailwind tooling
- `src/lib/storage.ts`: local persistence abstraction and file conversion
- `src/data/mockData.ts`: seed identities and starter wardrobe
- `src/components/`: reusable closet and page UI
- Vitest and Testing Library for the owner/friend beta journeys

**Fast wardrobe setup:** Open **My closet → Add multiple photos**. Select up to 12 garment photos; choose a category for each. Names and colors are optional and editable after import; unnamed photos get distinct labels, and you can accept available color estimates as a batch without overwriting your edits. Demo items stay off by default in My Closet. Photos are prepared on this device and saved privately to this browser; demo links do not carry your wardrobe to another device.

**Keep a wardrobe backup:** **My closet → Backup** downloads a JSON file containing your supported clothing photos and their details. Keep the file somewhere you trust. To move to a new browser or recover the wardrobe, choose the file, review the number of new items, and restore. The restore never replaces your existing wardrobe and resets new items to Private. Backups can include saved outfits made entirely from your own stored photos and their wear dates. It leaves out demo pieces, looks using them, and borrowing history. Older photo-only backups still import.

Wardrobe items and images use IndexedDB where supported. Existing localStorage items are copied in a committed transaction before the old copy is removed. Lightweight preferences, saved looks and demo loans still use localStorage. Browsers without IndexedDB keep the smaller localStorage fallback; clearing site data can delete either store, so download a backup for anything you need to keep.

To wear something specific, open its photo in **My closet** and tap **Style this piece**, or use the **Build around** picker on Style. The stylist keeps it in every suggestion and tells you when it needs a compatible piece.

**Get a ChatGPT look (optional):** In Style, choose an occasion plus any garment you want to keep in the outfit, then select **Try a ChatGPT look**. Review the text, copy it into ChatGPT yourself, and paste the JSON response back while the app tab remains open. The prompt contains only confirmed clothing tags and the selected styling preferences. Use **Keep my garment names out of this prompt** to share categories and colors without custom garment names. The app never uploads photos or sends prompts automatically, and only imports real saved item IDs forming a valid outfit. The automatic local matcher remains available without ChatGPT. For a valid import, select **Compare with the built-in stylist** to see both first picks without source labels until you choose. A matching pick is shown as a tie; the choice is not retained or transmitted.

**Find a garment:** Search My closet by garment name, brand, category, color, or occasion. Visibility and category filters combine with your search. When a photo has a clear central color, the app may offer a tag. Confirm it with one tap or leave it blank; the estimate uses only your device.

**Swap one piece:** Expand **Swap a piece** on a generated look to replace a garment with another photographed garment in the same category. The garment you built around is locked, and you can undo the swaps or save your edited look separately.

In **Style → Saved looks**, tap **Mark worn today** to record a day you actually wore the outfit. Tap again to undo. The date and count stay in this browser. After logging wear, you can tell the built-in stylist to prefer other combinations from the last seven days. It may repeat a strong fit if good alternatives are limited.

A saved outfit made entirely from your photos has **Ask a friend → Download outfit card**. The PNG contains garment photos and names, not notes, dates, or contact details. Nothing is shared or uploaded by the app.

A separate [hosted styling proof of concept](server/README.md) is tested with fake accounts and fake model transport. It is not deployed or bundled into GitHub Pages.

Optional phone-width accessibility audit (no app dependency):

```sh
scratch="$(mktemp -d)"
npm install --ignore-scripts --prefix "$scratch" axe-core
AXE_CORE_SCRIPT="$scratch/node_modules/axe-core/axe.min.js" npm run test:e2e -- -g 'optional axe-core'
```

The audit covers six initial screens automatically. It is not a substitute for a manual screen-reader or physical phone test.
