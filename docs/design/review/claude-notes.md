# Claude design notes

## Round 11 — Nov 24, 2026, 2:55 PM PT
**Shipped:** the **Sync tab** (`mockups/TechSync.dc.html`, render `renders/round11/tech-7-sync.jpg`). It lists queued packets with photo progress and the last try and its reason, plus jobs delivered today, and has a **Try again now** button. It's added to `MOBILE_APP_PROMPT.md` (screen 7), to `SCREENS.md` C6 and to board 3, which now shows all 7 technician screens.

## Round 10b — Nov 24, 2026, 2:35 PM PT
Sam: the desktop office portal must be configured **for desktop, not mobile**, which is critical. The dashboard now locks to a true desktop layout at ≥ 1200 px:
- 6 KPI cards in one row, at 24 px so "$86,420" fits
- 8 pipeline tiles in one row
- tracking numbers and dates that don't wrap
- bottom cards in a 2×2 grid
- a fixed 280 px right rail

It's verified at 1280, 1440 and 1920 (`renders/round10/`). The tablet and phone layouts stay as fallbacks only. `SCREENS.md` B2 now states the desktop-first rule. Board 2 is refreshed.

## Round 10 — Nov 24, 2026, 2:25 PM PT (4 PM milestone, shipped early)
**The office dashboard is responsive.**
- Below 900 px the sidebar collapses into a top bar with the logo and a **Menu** button. Below that, the KPI cards are 2 across on a phone, the pipeline tiles wrap, the jobs table scrolls sideways, and the right rail stacks under the main content.
- **PD-1187** (Luis M., Office review) is the first row. Luis is in dispatch, and a "New packet with 1 conflict" notice for PD-1187 is in notifications.
- The table is labeled "sample data", and focus rings follow the rule.
- Renders: `renders/round10/office-dashboard-1440.jpg`, `-1024`, `-768`, `-390`.

## Round 9 — Nov 24, 2026, 2:00 PM PT
Sam: "make progress instead of grading everything" and "keep the deadlines". From now on every round ships a finished deliverable, and reviews stay to one line. Milestones are in `FINAL_CHECKLIST.md`.

**Shipped:** three presentation boards in `docs/design/final/`:
- `board-1-homepage-A.png`
- `board-2-office-portal.png`
- `board-3-technician-app.png`

## Round 8 — Nov 24, 2026, 1:52 PM PT
Codex had no issues with Round 7, and there's nothing new from ChatGPT. Checklist item #2: the **office review screen** is brought up to direction A's standard.
- It has the real PD logo in the top bar, and it now uses the same sample job as the homepage demo: **PD-1187**, 1187 Oak St, Pasadena, with Luis (tech), Maria (office) and Dana K. (contractor).
- After a decision it shows an **office decision card** matching the homepage demo: 100 A struck through as v1, then 125 A from the label photo as v2, saved as `7F3A·92C1` with v1 read-only. If the office keeps 100 A, the card says so.
- The version chip shows the fingerprint, and the activity log uses the same timeline (9:47 sent, delivery confirmed).
- No text is under 12 px.
- Renders: `renders/round8/office-review-open.jpg`, `office-review-decided.jpg`, `office-review-390.jpg`.

## Round 7 — Nov 24, 2026, 1:32 PM PT (Codex findings on the specs)
- **P2, the brief had the wrong logo, now fixed:** `VISUAL_BRIEF.md` now requires the real PD monogram (asset paths given), an Inter wordmark in one color, and job PD-1187.
- **P2, the brief was missing the queued state, now fixed:** the homepage A prompt uses the 5 steps with Queued and Delivered kept separate, plus one image per key step. The technician set is now six screens, including the queued screen. All references point to the newest renders (round3/round4/round5).
- **P3, now fixed:** `DESIGN_SYSTEM.md` §10 now says Capture → Queued → Delivered → Review → Sign.

## Deadline set — Nov 24, 2026, 1:16 PM PT
**Sam: 24 hours to finalize, so the deadline is Wed Nov 25 at 1:14 PM PT.** Everything produced must be quality work. The definition of done, owners and Sam's open decisions are in `docs/design/review/FINAL_CHECKLIST.md`.

## Round 6 — Nov 24, 2026, 1:15 PM PT
Codex had no issues with Round 5. This round brings the written specs Ted builds from up to date with today's decisions:
- **`SCREENS.md` section A** is rewritten for direction A: nav and mobile menu, hero, the 5-step demo with each step's states, evidence, product crops, and the list of claims that need Sam's approval.
- **C5** now covers the queued screen (`TechQueued.dc.html`).
- **`DESIGN_SYSTEM.md`** has a new logo rule (5b), the focus-ring rule (C2410C on light, F97316 on dark), and A marked as recommended.

## Round 5 — Nov 24, 2026, 12:58 PM PT
Codex had no issues with Round 4. This round adds the **queued, no-signal technician screen** (`mockups/TechQueued.dc.html`, render `renders/round5/tech-5a-queued.jpg`). It's the app-side match for the homepage demo's Queued step:
- an amber "Queued · no signal" pill and the heading "Saved on your phone"
- a receipt showing v1 sealed, photos uploaded **0 of 3 · waiting**, and office notified **Not yet**
- copy that says it sends on its own when signal returns (**proposed** behavior; see the Round 3 table) and that the tech can keep working

SCREENS.md, C5 already described this variant; now it's drawn.

## Round 4 — Nov 24, 2026, 12:40 PM PT (Codex on Round 3)
- **Focus ring contrast (Codex P2), fixed in both A files:** on light surfaces the ring is now `#C2410C`, which is 4.9:1 on warm white. On navy (nav, demo panel, closing CTA, footer) it stays `#F97316`, which is 6.2:1 on navy.
- **Consistency pass (self-directed):**
  - The office dashboard, office sign-in and contractor signing screens now use the real PD monogram in place of my drawn icon.
  - Every technician screen and homepage B now use job **PD-1187**, the same ID as homepage A.
- **New renders:** `docs/design/renders/round4/`, covering the office dashboard, the sign-in screen, contractor signing and tech screens 1, 2, 4 and 5.

## Round 3 — Nov 24, 2026, 12:20 PM PT (reply to ChatGPT Round 2 review + Codex on #2)
I agree with ChatGPT's recommendation of **A**. It's refined below; B is kept as the alternative.

**Renders:** `docs/design/renders/round3/`
- Direction A at five widths: `homepage-A-320.jpg`, `-390.jpg`, `-768.jpg`, `-1024.jpg`, `-1440.jpg`
- A's mobile menu open: `homepage-A-390-menu-open.jpg`
- Direction B: `homepage-B-390.jpg`, `homepage-B-1440.jpg`
- Demo: `demo-capture-to-sign-1440.gif` and `demo-capture-to-sign-390.gif`, plus each step as `demo-stepN-*.png`

### P1 — Mobile interaction (ChatGPT + Codex)
- The office panel is **no longer hidden** on mobile. It stacks under the phone and changes with each step.
- The stepper uses `auto-fit minmax(118px)`: 1 column at 320 px, 2 at 390 px, one row at 768 px and up. Controls are 48 px tall.
- The product grids use `minmax(min(100%, 340px), 1fr)`, so nothing is forced wider than 320 px.
- The demo is manual with no autoplay. The caption sits in an `aria-live="polite"` region, so focus never moves. A **Next step → / Restart demo** control was added.
- Text sizes: checklist labels are 14 px, values, status pills and check labels 12 px, office text 14–15 px. Nothing essential is below 12 px.

### P1 — Brand and navigation
- I'm now using the **existing approved logo**, the PD monogram at `public/generated-assets/company-logo.png`. For dark backgrounds I made a white variant (`docs/design/assets/pd-logo-white.png`) by changing only the navy pixels to white; the orange square and the shapes are untouched. Sam should confirm the variant.
- Mobile gets a compact **Menu** button (`aria-expanded`, `aria-controls`) opening Office sign in, Technician app, How it works and Pricing.
- Links point to routes that exist in this repo: `/sign-in`, `/pricing`, `/early-access` and `/demo`. Whether `/demo` is the right target for "Technician app" is still **proposed**.
- In B, "Sign in" is now "Office sign in", and its logo was swapped as well.

### P1 — Workflow credibility
- The demo now has 5 steps: **Capture → Queued (no signal) → Delivered → Review → Sign.** In the Queued step the phone says "Queued · no signal", the office shows "Nothing received", and nothing claims delivery.
- Review shows the typed 100 A (struck through, v1) beside the 125 A label photo value (v2), with the office's explicit decision. The signature is tied to v2.
- The panel is labeled "Illustrative demo · sample data · no real permit is sent".

### P2 — Composition
- A's supporting line now reads: *Job-site photos → permit draft → office review → contractor signature.*
- A new **Evidence** section shows a data-plate illustration with the model number highlighted, next to the draft field and its source. It's clearly captioned as an illustration until a licensed photo exists.
- The product cards now include crops: a technician checklist and an office pipeline/table, both for job **PD-1187**, the same ID as the hero.
- Codex's B "Version-locked" overflow had already been fixed in `b2ed4b7`, before Codex reviewed the older commit. The label is now "Version-locked" and the value "Signed", at its own 40–54 px scale. It's verified in `homepage-B-1440.jpg`.

### Checks
- **Contrast:** every text and background pair in A was checked numerically. The lowest is 4.92:1 (orange `#C2410C` on warm white), and all are ≥ 4.5:1.
- **Keyboard:** every control is a native `<button>` or `<a href>` with a visible 3 px orange `:focus-visible` ring. There are no click handlers on divs and no keyboard traps.
- I didn't run axe or a screen reader. These are static design references, not the production build.

### Verified vs. proposed features (checked against this repo's code)
| Claim on the page | Status |
|---|---|
| English and Spanish UI | **Verified**: `useLang` is used in 59 source files |
| Photos stored on the phone before upload | **Verified**: `src/lib/photos.ts`, shown as "Waiting to upload" |
| Office review and correction requests | **Verified**: `office-review.$id.tsx`, `correction_requests` table |
| Office notice retry | **Partly verified**: `retryOfficeNotice` exists. Delivery *confirmation* from the email provider is **proposed** (`email_deliveries`) |
| Automatic send when signal returns | **Not verified**: proposed |
| Reading values from photos / automatic photo-vs-typed conflict | **Not verified**: no OCR in the code. Today's conflicts come from people's corrections. **Proposed** |
| Version-locked signature with fingerprint | **Proposed**: no `packet_versions` or `signatures` tables yet |
| Coverage: "California & Arizona" | **Needs Sam**: the code also covers **Texas** |

**Until Sam approves building them, every proposed claim should be softened or removed from the public page.**

### For Sam's eventual decision (A vs. B, short)
- **A** explains the product best and works best on phones. It's credible and calm, like Apple or Linear.
- **B** has the most visual impact and is the most memorable. It's cinematic and less explanatory.
- **ChatGPT's recommendation, and mine:** A, borrowing B's mechanism-first line, which is already done.

## Round 2 — Nov 24, 2026, 12:05 PM PT (reply to ChatGPT Round 1 + Codex review of #1)
As requested, there are two contrasting directions, each with desktop and mobile. Preview paths:

| | Desktop | Mobile 390 |
|---|---|---|
| **A: warm-white editorial** | `docs/design/mockups/HomepageA.dc.html` | `docs/design/mockups/HomepageA-mobile.dc.html` |
| **B: executive navy, cinematic** | `docs/design/mockups/HomepageV2.dc.html` | `docs/design/mockups/HomepageB-mobile.dc.html` |

The mobile files are the same page rendered in a 390 px frame. Both pages are fluid, with mobile rules at ≤640 px.

**Codex findings, all fixed in B:**
1. *Phone fit at 390:* below 640 px the laptop is hidden, the phone moves into the flow at 270 px wide, gutters drop to 20 px, spec cells stack, and headings use `clamp()`.
2. *Hero mechanism:* the headline is now "Photos in. Permit draft out.", with a one-line subhead right under it explaining photo → draft → office review → contractor signature.
3. *"v2" as a spec:* replaced with "Version-locked". `v2` and the fingerprint now appear only on the example document. Product values (addresses, amps) now use Inter instead of the expanded display face.

**ChatGPT Round 1, how I applied it:**
- A follows your brief closely: a 1320 max width, a navy nav with a visible **Office sign in** and a separate **Technician app** entry, warm white `#FAF9F6`, and the phone and office panels joined by an orange progress line.
- A's interactive hero is built: Capture / Send / Review / Sign buttons, `aria-pressed`, keyboard by default (real buttons), and no autoplay or motion. The panels and the status update together, and the Capture step says "Saved on phone", not "sent".
- The capability strip, the two product showcases, the evidence/versioning trust section, the pricing placeholder and the final CTA are all in A. The legal wording is unchanged.

**Where I disagree or adjusted:**
1. **Headline:** I used yours in A but made it "Send the paperwork *to the office*", so it can't be read as us filing permits. In B I prefer "Photos in. Permit draft out." because it states the mechanism in five words, which was Codex's five-second point.
2. **Display face:** B tests Archivo Expanded for headlines only. Space Grotesk stays the system default unless Sam picks B.
3. **Photography:** I agree it's the biggest missing premium asset. We have no licensed job-site photos, so every photo is a labeled placeholder. I recommend one real shoot: a data plate, a panel label and a condenser on a real job, plus a 20-second capture-to-draft screen recording.

**Implemented vs. illustrative:** these mockups are design references, not production code. The A hero stepper's state really works in the preview. All job data is demo data, labeled on the page. Photos are placeholders. The price is `[PRICE]`.

**Questions for ChatGPT/Codex:**
1. A vs. B: which better serves an HVAC owner deciding in 5 seconds? Score each on clarity, visual quality, responsiveness, accessibility and accuracy of the handoff.
2. In A, should the hero stepper autoplay once (respecting reduced motion) or stay fully manual?
3. Anything in A's mobile composition that still feels like a shrunken desktop?

## Round 1 — Nov 24, 2026, 11:55 AM PT
**Homepage v2** is in `docs/design/mockups/HomepageV2.dc.html`. It replaces v1, which Sam rejected. What changed:
- **Direction:** cinematic and automotive instead of SaaS cards. The base is near-black `#05080F`, orange works like a racing stripe, and there's a lot more empty space.
- **Type:** Archivo Expanded 800, uppercase, at sizes up to 152 px, for headlines. Inter stays for body text. JetBrains Mono is used for small spec labels.
- **Hero:** "The permit, drafted on the job.", an orange line that draws in, and a laptop showing the office portal with the tech's phone on top of it.
- **Spec strip, styled like a car spec sheet:** 0 signal needed · 1 checklist per permit · v2 locked version · EN/ES. These are product facts, not invented performance claims.
- **Three chapters:** 01 In the field (camera guide) → 02 In the office (conflict vs. missing) → 03 The signature (a full-bleed orange section with a version-locked draft).
- **Language moment:** "English. Español." in giant type, with Español in orange outline.
- **Pricing:** one plan, with the price shown as `[PRICE]` until Sam decides.
- **Closing line:** "Leave the paperwork in the truck."

**Questions for Codex. Please review `HomepageV2.dc.html`:**
1. Does the hero tell an HVAC contractor what this is within 5 seconds? If not, what would you change?
2. Which section is weakest, and how would you fix it?
3. Is the all-caps expanded headline style too much for body-adjacent text? Where would you tone it down?
4. What's missing that a premium product page would have, such as real job-site photography, a short video, testimonials once we have real ones, or coverage?

## Round 0 — Nov 24, 2026, 11:40 AM PT
**Goal today:** a permitdraft.co homepage that feels like a premium product launch (Ferrari / Apple level), plus the office portal and technician app designs.

**State:** v1 designs are in `docs/design/mockups/`: the homepage, the office portal (sign-in, dashboard, review), contractor signing, and 5 technician app screens. Sam's verdict on homepage v1: not good enough. For the office look, Sam's reference is his own dashboard screenshot: navy sidebar, orange actions, KPI cards, 8-stage pipeline, jobs table, dispatch, map, donut, monthly bars, notifications, quick actions, schedule.

**Questions for ChatGPT/Codex.** Answer at the top of `docs/design/review/codex-feedback.md` on branch `codex/design-review`:
1. What would make the homepage feel premium and captivating to HVAC contractors? Be specific about layout, type, imagery, motion and sections.
2. Name 2–3 real websites to learn from, and say exactly what to take from each.
3. What should the hero say and show in the first 5 seconds?
4. What would you change in the design system, and why? It's navy `#0B1B33`, orange `#C2410C` for actions and `#F97316` as an accent, with Space Grotesk headings and Inter body text.
