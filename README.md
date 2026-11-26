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

Data is saved in browser `localStorage`, including uploaded photos as data URLs. Raster phone photos up to 15 MB are downscaled to a maximum 1600px dimension and stored as compressed JPEGs. If browser storage is full, the form remains open and explains how to recover instead of falsely reporting success. This is a durable single-device demo, not cross-device cloud sync yet.

## Try your private closet stylist

1. Open **Closet → Add from camera**. Use the camera or **Choose from photo library**. Start with a top, a bottom, and shoes (or a dress and shoes); six to ten pieces give more variety.
2. Add a name, category and color. Optionally tag occasions like work, weekend, or dinner. Everything starts **Private**.
3. Open **Style**, add an occasion, and choose a vibe and conditions. **Build my looks** proposes up to three combinations using only your photographed clothes by default. Review the explanation and save a look to reopen later.
4. Select **Include labeled sample pieces** for a demonstration before adding your own clothes. This may include explicitly labeled borrowable samples.

This beta uses matching rules, not a model. Clothing photos and looks do not leave your browser or sync to another device, browser or website address. Brian/Alex are seeded roles in the same browser, not accounts; the invite is for testing rather than access control. Clearing browser data may erase your closet.

## Checks

```bash
npm run lint
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

Because the current beta uses browser-local storage, each browser/device has its own data. A later Supabase adapter will provide shared cross-device accounts, database records, and image storage.

## Architecture

- React 19, TypeScript, Vite, Tailwind tooling
- `src/lib/storage.ts`: local persistence abstraction and file conversion
- `src/data/mockData.ts`: seed identities and starter wardrobe
- `src/components/`: reusable closet and page UI
- Vitest and Testing Library for the owner/friend beta journeys

**Fast wardrobe setup:** Open **My closet → Add multiple photos**. Select up to 12 garment photos; choose a category for each. Names and colors are optional and editable after import. Photos are prepared on this device and saved privately to this browser; demo links do not carry your wardrobe to another device.

**Keep a wardrobe backup:** **My closet → Backup** downloads a JSON file containing your supported clothing photos and their details. Keep the file somewhere you trust. To move to a new browser or recover the wardrobe, choose the file, review the number of new items, and restore. The restore never replaces your existing wardrobe and resets new items to Private. The file does not include saved looks, demo pieces, or borrowing history.

Wardrobe items and images use IndexedDB where supported. Existing localStorage items are copied in a committed transaction before the old copy is removed. Lightweight preferences, saved looks and demo loans still use localStorage. Browsers without IndexedDB keep the smaller localStorage fallback; clearing site data can delete either store, so download a backup for anything you need to keep.

To wear something specific, open its photo in **My closet** and tap **Style this piece**, or use the **Build around** picker on Style. The stylist keeps it in every suggestion and tells you when it needs a compatible piece.

**Get a ChatGPT look (optional):** In Style, choose an occasion plus any garment you want to keep in the outfit, then select **Try a ChatGPT look**. Review the text, copy it into ChatGPT yourself, and paste the JSON response back while the app tab remains open. The prompt contains only clothing names/categories/colors and the selected styling preferences. The app never uploads photos or sends prompts automatically, and only imports real saved item IDs forming a valid outfit. The automatic local matcher remains available without ChatGPT.

**Find a garment:** Search My closet by garment name, brand, category, color, or occasion. Visibility and category filters combine with your search. When a photo has a clear central color, the app may offer a tag. Confirm it with one tap or leave it blank; the estimate uses only your device.
