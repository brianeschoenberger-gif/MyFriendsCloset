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

Data is saved in browser `localStorage`, including uploaded photos as data URLs. Raster phone photos up to 15 MB are downscaled to a maximum 1600px dimension and stored as compressed JPEGs. If browser storage is full, the form remains open and explains how to recover instead of falsely reporting success. This is a durable single-device demo, not cross-device cloud sync yet.

## Checks

```bash
npm run lint
npm run test
npm run test:e2e
npm run build
```

`npm run test:e2e` launches the app at a 390x844 viewport, generates a large phone-like PNG, verifies 1600px JPEG compression, and automates the complete persisted beta flow. Install the browser runtime once with `npx playwright install chromium` if Playwright reports that Chromium is missing.

## Deploy

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
