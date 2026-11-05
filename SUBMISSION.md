# UI/UX Rescue Challenge: Submission

**Modified React files:** `src/App.jsx`, `src/styles.css`, `src/logic.js` (new)

## Three justifications

**1. Finding a match.** A student who lost an item wants to find a matching notice. Search only matched exact phrases, so "blue bottle" returned nothing even though two blue bottles were listed, and "black backpack" missed the found "Dark backpack". The student could give up while the item was on the board. Search words now match in any order, close results are labelled "similar", and cards link to possible matches.

**2. Getting the item back.** Both students need to know who has the item and what to do next. The difference between "staff have it" and "only reported" was in tiny grey text with no next step, so a student could go to a desk that doesn't have the item, and finders weren't told to hand items in. Cards now clearly show **Received at X** or **Not confirmed at a collection point** with a next step, and the form lists the collection points when "Found" is chosen.

**3. Fixing errors and finding your reports.** A student posting a report needs to know why it failed. Every failure said only "Please review your entries", even for duplicates, where every field looks correct. Editing was also hidden in a tiny "···" menu on every card. Each field now shows its own error, duplicate errors link to the existing report, and your reports have a **Your report** tag, an **Edit** button and a **My reports** view.

## AI suggestion I rejected

AI suggested a "Collection point" dropdown on the report form, shown on the card as "Held at X". I rejected it because the brief says a reported item is not automatically confirmed as being held by staff, so a finder's unverified claim would look like confirmed custody. The form lists the points as instructions instead, and only a report recorded as received by staff shows "Received at X".

## Before and after screenshots

All are in `docs/screenshots/`.

| Shows | Before | After |
|---|---|---|
| Board | `before-1-board.png` | `after-1-board.png` |
| Improvement 1: search | `before-2-search-no-results.png` | `after-2-search-blue-bottle.png`, `after-3-no-results.png` |
| Improvement 1: possible match | | `after-4-possible-match.png` |
| Improvement 2: handover on cards | `before-5-found-card-and-menu.png` | `after-1-board.png` |
| Improvement 2 and main action: reporting a found item | `before-4-found-form.png` | `after-8-found-form.png`, `after-9-found-posted.png` |
| Improvement 3 and unsuccessful action: duplicate report | `before-3-duplicate-error.png` | `after-7-duplicate-error.png` |
| Improvement 3: empty form errors | | `after-6-empty-submit-errors.png` |
| Improvement 3: your reports | `before-5-found-card-and-menu.png` | `after-5-my-reports.png` |
