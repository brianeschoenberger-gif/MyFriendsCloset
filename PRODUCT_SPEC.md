# PRODUCT_SPEC.md

## Product

My Friends Closet is a private social wardrobe app where friends share, borrow, and style each other's clothes.

Positioning: Shop your friends' closets before you buy something new.

## Current beta goal

Build a playable mobile web beta where an owner uploads a clothing photo, marks it borrowable, a friend sees it and requests it, and the owner approves or declines. User-created items, images, identities, and requests must persist after refresh.

## Demo identities

- Brian: closet owner; adds items, controls visibility, and responds to requests.
- Alex: friend/borrower; sees Brian's Friends and Borrowable items and requests Borrowable items.

## Required beta flows

1. Switch between Brian and Alex without production auth.
2. Capture or upload an image from a phone.
3. Save item name, category, color, size, optional brand, visibility, tags, and notes.
4. Restore saved items and image previews after refresh.
5. Hide Private items from Alex; show Friends and Borrowable items.
6. Let Alex request Borrowable items with dates and a note.
7. Let Brian approve or decline and persist the result.
8. Generate mock outfit ideas from the saved closet.

## Minimum data models

- UserProfile: id, name, optional avatar, role, createdAt.
- ClosetItem: id, ownerId, imageData/imageUrl, details, visibility, tags, notes, createdAt, updatedAt.
- DemoShare: ownerId, friendId, inviteCode, status.
- BorrowRequest: item/owner/requester ids, dates, note, status, timestamps.
- OutfitSuggestion: title, occasion, vibe, item ids, explanation.

## Later

Production auth, hosted image storage/database, real invite links, notifications, and real AI. Do not build payments, shipping, insurance, disputes, or a public marketplace before the core beta is stable.
