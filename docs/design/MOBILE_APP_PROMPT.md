# Mobile UI prompt: PermitDraft technician app

> Copy everything below the line into the mobile UI tool or builder you're using (or give it to Ted). It's self-contained. Pixel references are in `docs/design/renders/` and `docs/design/final/board-3-technician-app.png`. Source mockups are in `docs/design/mockups/Tech*.dc.html`.

---

## Role
You are building the **technician app** for PermitDraft, a phone app HVAC technicians use on the job to capture what a permit needs and send it to their office. It is pure utility: one job, one checklist, the camera, and a send button. No dashboards, no marketing. It's a separate product from the office portal, with a separate sign-in, but it shares the same back end.

**Platform:** the existing app is a web app with a service worker (`public/sw.js`) registered in `src/routes/__root.tsx`. Unless Sam says otherwise, build this as an **installable PWA inside the existing repo** (TanStack Router + Vite + React + TypeScript), mobile-first. If you're asked to build a native app instead (React Native/Expo), keep every screen, state, size and color below exactly the same.

## Non-negotiable rules
1. **Match the reference renders at least 90%:** the same layout, copy, colors, type and states.
2. **Glove-friendly:** every primary action is at least **56 px** tall, every other tap target at least **44 px**, with at least 8 px between targets.
3. **Readable in sun:** text contrast is at least 4.5:1 and **no essential text is under 12 px**. Body text is at least 14 px.
4. **Offline first:** everything works with no signal. Photos and fields save on the device first.
5. **Honest status:** the app always says exactly where the work is.
   - "Saved on phone": captured, not sent
   - "Queued · no signal": sealed and waiting to upload
   - "Delivered to office": the server confirmed receipt

   **Never** use "saved offline", and never say "sent" before the server confirms.
6. **English and Spanish** for every string, with 100% parity. Language follows the user's setting.
7. **Draft-only wording.** Never write "compliant", "guaranteed", "approved by" or "we file for you".
8. **Real logo only:** `public/generated-assets/company-logo.png`, or `docs/design/assets/pd-logo-white.png` on navy.

## Design tokens (from `docs/design/tokens.css`)
- **Navy** `#0B1B33` for headers and primary text. **Navy 800** `#13264A`, **navy 700** `#22385F`.
- **Action orange** `#C2410C` for primary buttons with white text; pressed `#9A3412`. **Accent orange** `#F97316` is for progress bars, the camera guide box and the shutter only. Never use it for text on white.
- **App background** `#F4F5F7`, **cards** `#FFFFFF`, **borders** `#DFE4EB`, **secondary text** `#5A6779`, **body text** `#3E4A5C`.
- **Status colors:**
  - Done/delivered: `#DCFCE7` background, `#166534` text, `#15803D` check icon.
  - Queued and office questions: `#FEF3C7` background, `#78350F` text, `#D97706` border.
  - Needed: a **dashed** `#8A93A3` ring.
- **Fonts:** Space Grotesk 700 for screen titles (28) and job addresses (24); Inter for everything else; JetBrains Mono for packet versions and fingerprints.
- **Radius:** cards 14–16, buttons 10–12, pills 999.
- **Camera:** background `#05080F`, controls `#1A2233`.

## Screens (reference frame 390 × 844)

### 1. Today's jobs: `renders/round4/tech-1-jobs.jpg`
- **Navy header:** the date, a sync pill ("All synced" or "N waiting to upload"), "Morning, {first name}" (28 px), and "N jobs today · N needs your answer".
- **Office question card, pinned first:** 2 px amber border, an "Office question" chip, the address, a one-line ask and the time. Tapping it opens screen 4.
- **Job cards:**
  - the time, in orange if it's the next job
  - the job ID (PD-1187), the address (17/700) and the job type
  - an orange progress bar and "N of N captured"
  - a 44 px **Continue** button
- **Bottom tab bar:** Jobs · Sync · Me. The active tab is orange. Each target is 52 px tall.

### 2. Job checklist: `renders/round4/tech-2-checklist.jpg`
- **Navy header:** job ID, sync pill, address, job type and tech name, a progress bar, and "N of N items captured".
- **"Required for this permit":** one row per item, **generated from the rule pack for the job's jurisdiction and job type**. Never hard-code the list.
  - Done rows: a green check and the captured value or "Photo captured".
  - Needed rows: a dashed ring, "Needed for this permit", and a **Take photo** or **Enter** button.
- **Footer:**
  - a 56 px **Send to office** button, disabled with the label "Capture N more to send" until every required item is done
  - below it: "Draft only · not filed · contractor signs before anything is submitted"

### 3. Guided camera: `renders/tech-3-camera.jpg`
- Full-screen dark camera.
- **Top:** close (44 px), "{Item} · N of N", flash.
- **Viewfinder:**
  - an orange guide box sized for the item (data plate, panel label, unit and clearance)
  - an instruction card ("Fill the box with the panel label" / "The amp rating must be readable")
  - an offline chip: "No signal · saving to phone"
- **Bottom:** the last-photo thumbnail, an **84 px orange shutter** and Skip.
- **After the shot:** a blur check runs on the device. If the photo is blurry, offer "Retake"; otherwise go back to the checklist automatically.
- Photos save to on-device storage, as `src/lib/photos.ts` does today.

### 4. Office asks for a fix: `renders/round4/tech-4-office-fix.jpg`
- Appears on the job, and pinned on screen 1, when the office chooses "Ask tech to confirm".
- **Amber card:** the office's message, "You entered" vs. "Label photo" values, and the photo.
- **Buttons:** **Change to {value}** (primary, 52 px) and **Keep {value} and add a note**.
- The answer goes back to the office and creates a **new packet version**.

### 5. Queued, no signal: `renders/round5/tech-5a-queued.jpg`
- Shown after Send when there's no connection.
- An amber no-signal icon, a "Queued · no signal" pill, and the heading "Saved on your phone".
- **Receipt:** Packet v1 · fingerprint · Items 6 of 6 · Photos uploaded **0 of 3 · waiting** · Office notified **Not yet**.
- The line: "You can keep working. Queued jobs show on the Sync tab."
- When the connection returns, the upload retries automatically and the screen switches to screen 6 only after the server confirms.

### 6. Delivered: `renders/round4/tech-5-sent.jpg`
- A green check and "Delivered to the office", then the address and time.
- **Receipt:** Packet v1 · fingerprint · Items · Photos uploaded 3 of 3 · Office notified "Email confirmed".
- **Buttons:** **Next job · {address}** (primary) and **Back to today's jobs**.

### 7. Sync tab: `renders/round11/tech-7-sync.jpg`
- **Navy header:** "Sync", a "No signal" pill when offline, and "N jobs waiting to upload · they send on their own when you have signal".
- **"Waiting to upload":** one amber-bordered card per queued packet, showing job ID and address, a version chip, a photos progress bar ("2 of 4 uploaded"), and the last try time and reason ("signal lost mid-upload").
- **"Delivered today":** green-check rows, each with "office email confirmed".
- A 56 px **Try again now** button.
- The note "Nothing counts as sent until the office has it."
- The tab label shows a count ("Sync · 2").

## Behavior
- **Sealing:** tapping Send seals a numbered version (v1, v2…) with a fingerprint: a hash of the fields plus the photo hashes. Edits after sending create a new version.
- **Upload queue:**
  - Retry with backoff.
  - No duplicates: the server is idempotent on packet ID + version.
  - Resume partial photo uploads.
- **Accessibility:**
  - real buttons with labels, and `aria-label` on icon-only buttons
  - a visible focus ring: 3 px `#C2410C` on light, `#F97316` on dark
  - status changes announced politely
  - respect reduced motion
- **Performance:** first load under 3 s on a mid-range phone over 4G. After the first load, the app shell opens instantly offline.

## Acceptance tests
1. **Airplane mode:** open a job, capture all 6 items, tap Send. The app shows **Queued**, and the office receives nothing.
2. **Signal back:** the packet arrives **once** with all photos, and the app shows **Delivered** only after the server confirms.
3. **Office question:** it appears on screen 1 and on the job. Answering it creates v2 and updates the office.
4. **Spanish:** every screen shows full Spanish with no English left over, and nothing is truncated at 390 px or at 320 px.
5. **Contrast and size:** contrast is ≥ 4.5:1 everywhere, no essential text is under 12 px, and primary actions are ≥ 56 px.
6. **Screenshots:** each screen matches its reference render at least 90%. Post the screenshots in English and Spanish at 390 px.

## Open items: do not decide these yourself
- Native app vs. PWA (default: PWA in this repo)
- Coverage wording (California + Arizona, or + Texas)
- Whether "sends automatically" ships in v1 or uses manual retry first
