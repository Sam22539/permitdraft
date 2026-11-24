# PermitDraft Screen Specs v1.0

Each screen has a reference file in `mockups/` (open it in the PermitDraft Redesign canvas). Build to match those files: layout, copy, colors and sizes. Values not written here come from `DESIGN_SYSTEM.md`.

---

## A. Homepage — permitdraft.co

> **Status:** two directions are waiting on Sam's pick. **A is recommended by both ChatGPT and Claude.**
> - **A: warm-white editorial.** `HomepageA.dc.html` (mobile: `HomepageA-mobile.dc.html`).
> - **B: executive navy, cinematic.** `HomepageV2.dc.html` (mobile: `HomepageB-mobile.dc.html`).
> - Renders at 320/390/768/1024/1440 are in `renders/round3/`.
> - `Homepage.dc.html` (v1) is superseded. Don't build it.

### A1. Nav (navy `#0B1B33`, 68 px tall)
- The real logo `public/generated-assets/company-logo.png` (white variant `docs/design/assets/pd-logo-white.png` on navy), then "PermitDraft" in Inter 19/700.
- Desktop links: How it works · Pricing (`/pricing`) · Technician app (`/demo`, *proposed target*) · **Office sign in** (`/sign-in`, outlined button).
- At ≤760 px the links hide and a 44 px **Menu** button (`aria-expanded`, `aria-controls`) opens a stacked list. Office sign in and Technician app come first, each row 48 px tall.

### A2. Hero (warm white `#FAF9F6`)
- Eyebrow "For HVAC contractors in California & Arizona". *The coverage wording is an open decision: the code also covers Texas.*
- H1: "Finish the job. Send the paperwork to the office." Space Grotesk 700, `clamp(38px, 6.2vw, 84px)`.
- Mechanism line, 18–22/600: "Job-site photos → permit draft → office review → contractor signature."
- A 17 px supporting paragraph, then **Book a demo** (`/early-access`) and **See the workflow** (`#flow`).

### A3. Interactive workflow demo (`#flow`, navy panel, radius 28)
- Label: "Illustrative demo · sample data · no real permit is sent".
- **5-step stepper:** Capture → Queued → Delivered → Review → Sign.
  - Real `<button>`s with `aria-pressed` and 48 px controls.
  - The grid is `repeat(auto-fit, minmax(118px, 1fr))`: one row on desktop, 2 columns at 390 px, 1 at 320 px.
  - Manual only: **no autoplay**.
  - The caption is in an `aria-live="polite"` region; focus never moves.
  - A **Next step → / Restart demo** button.
- **Phone (job PD-1187)** and **office panel** sit side by side on desktop and **stack on mobile**. The office panel is never hidden.
- What each step shows:
  - **Capture:** 4/6 captured, "Saved on phone". The office shows "Nothing received".
  - **Queued:** "Queued · no signal" (amber). The button reads "Waiting for signal · sends automatically". The office still shows nothing.
  - **Delivered:** "Delivered to office". The office gets packet v1 with a conflict card (100 A typed vs. 125 A on the label photo).
  - **Review:** an office decision card (100 A struck through as v1 → 125 A as v2, "Maria chose Use photo value").
  - **Sign:** "Signed v2 · ready to file".
- Minimum text sizes: checklist labels 14 px, values and pills 12 px.

### A4. Capability strip
Four columns, each a title plus one line: Capture offline · Evidence-linked · Version-locked · English y Español.

### A5. Evidence
- "The photo is the proof."
- A data-plate figure with the model line outlined in orange, next to the draft field card ("Model number · 25VNA036A003 · Source: data plate photo · Matched").
- The figure is an illustration until a licensed photo exists, and its caption says so.

### A6. Two products
Two cards on the same job, PD-1187:
- the technician app (white card) with a checklist crop
- the office portal (navy card) with a pipeline and table crop

### A7. Trust, pricing, CTA, footer
- **Trust:** a version timeline (v1 · A91C → v2 · 7F3A → Signed v2).
- **Pricing:** Core at `[PRICE]`.
- **CTA:** a navy closing section, "See it on a real heat pump change-out."
- **Footer:** the draft-only legal line, unchanged.

### A8. Claims needing Sam's approval before going public
- Reading values from photos
- Automatic send on reconnect
- Version-locked signatures
- Email delivery confirmation

These aren't built yet (see the Round 3 table in `review/claude-notes.md`). Soften or remove them until they're approved.

---

## B. Office portal (desktop, signed in)

### B1. Sign in (`OfficeSignIn.dc.html`)
- Split screen: navy brand panel on the left, a white form card (max 400) on gray-50 on the right.
- Work email field, then **Email me a sign-in link** (primary). Below that, an "or" divider and **Continue with Google**.
- A link sends techs to the mobile app.
- Only company admins and office reviewers can sign in here.

### B2. Dashboard (`OfficeDashboard.dc.html`)
> **Desktop-first (Sam: critical).** The office portal is designed for desktop. At **≥ 1200 px** it must use the desktop layout:
> - the fixed 230 px navy sidebar
> - **6 KPI cards in one row**
> - **8 pipeline tiles in one row**
> - the full jobs table, with tracking numbers and dates on one line
> - a 2×2 grid of bottom cards
> - a fixed 280 px right rail
>
> Reference widths are 1440 (primary), 1280 and 1920. Smaller layouts (tablet, phone) are fallbacks only, and they must never change the desktop composition.
- **Sidebar (navy 900, 230 wide):**
  - Logo at the top.
  - Navigation: Dashboard (active: Orange 700 fill) · Customers · Leads (red count badge) · Jobs / Projects · Permits · Technicians · Dispatch & Schedule · Documents · Equipment · Inspections · Invoices & Billing · Reports & Analytics · Automation · Integrations · Company Settings.
  - Plan card at the bottom (users and storage bars, Manage plan).
- **Top bar (navy):** global search (placeholder "Search customers, jobs, permits, tracking #, addresses…", Ctrl K), **+ New Job**, notifications bell with a count, user avatar with name and role.
- **Greeting row:** "Good morning, {first name}", a subline, then filters (region, date range, Customize).
- **KPI row (6 cards):** Active jobs (navy) · Pending permits · Office review · Submitted · Approved · Revenue MTD (navy). Each card has a number, a trend badge and a subline.
- **Permit workflow pipeline (8 tiles):** New/Draft · Field capture · Missing info · Office review · Ready to submit · Submitted · Corrections · Approved. Clicking a tile filters the table; clicking it again clears the filter.
- **Recent jobs & permits table:**
  - Columns: Tracking # (Orange 700, bold) · Customer · Address · Project type · Tech (initials avatar + name) · Status pill · Last update.
  - The table scrolls sideways on narrow screens.
  - Clicking a row opens B3.
- **Bottom row (4 cards):**
  - Technician dispatch: avatar, name, "On job · address" in green or "Available".
  - Job locations map: pins, with a popover showing tracking #, address and stage.
  - Permit status donut, with a legend.
  - Monthly performance bars: Jobs in navy, Approved in orange.
- **Right rail (280):**
  - Notifications: colored dot, title, job and detail. "View all".
  - Quick actions: a 3×2 grid. New job is primary; the others are Add customer, Generate permit, Upload docs, Track permit and Schedule inspection.
  - Today's schedule: the time in Orange 700, then the title and address.

> **Open decision for Sam:** Dispatch, Leads, Invoices & Billing, Revenue and Automation were set to "park" in Ted's review. Build them as designed, but behind a plan or feature flag (`plan.tier`), so they can be shown only on a higher tier if Sam chooses.

### B3. Review a permit draft (`OfficeReview.dc.html`)
- **Top bar:** back link to the review queue, tracking # and address, a version chip (`Packet v1`, mono), the avatar.
- **Header:** project type, then customer · captured by · time · county, then a status pill.
- **Three summary tiles:**
  - CONFLICTS: amber, solid.
  - MISSING: gray, **dashed**.
  - MATCHED: green.
- **Conflict card** for each conflict:
  - The tech's value and the evidence value side by side, plus the photo.
  - Three actions: **Use photo value** · Ask {tech} to confirm · Keep and add note.
  - Each decision saves a **new version** and keeps the old one read-only.
  - After "Ask", the card is replaced by a "Waiting on {tech}" notice.
- **Captured details table:** Field · Value · Source (photo or "Entered by {tech}") · Check (Matched / Conflict / Resolved pill).
- **Right rail:**
  - Photos grid, 2 columns. Click a photo to enlarge it.
  - Send for signature card. The button stays disabled until there are 0 conflicts and 0 missing, and the hint text says why.
  - Activity log: time in mono, then the event.

### B4. Contractor signing (`ContractorSign.dc.html`, phone or desktop)
- Opened from the email link. Shows the address, a **Version N + fingerprint** chip, a summary table, the draft-only notice in orange-100, the checkbox "I reviewed version N and it matches the work done", and **Sign version N**.
- The sign button is disabled until the box is ticked.
- After signing, the screen shows "Signed by {name} · locked to version N" and next steps: file on the city portal → schedule the inspection → record the result.

---

## C. Technician app (phone, separate sign-in)

The reference frame is 390 × 844. Every primary action is at least 56 px tall. Every screen works with no signal.

### C1. Today's jobs (`TechJobs.dc.html`)
- **Navy header:** date and sync pill ("All synced" / "3 waiting to upload"), "Morning, {name}" (Space Grotesk 28), "N jobs today · N needs your answer".
- **Office question card (pinned first):** 2 px amber border, "Office question" chip, address, a one-line ask.
- **Job cards:** time (Orange 700 if it's next), job ID, address (17/700), job type, progress bar (Orange 500), "N of N captured", **Continue**.
- **Bottom tab bar:** Jobs · Sync · Me. The active tab is Orange 700.

### C2. Job checklist (`TechCapture.dc.html`)
- **Navy header:** job ID, sync pill ("Saved on phone" / "Delivered to office"), address, job type, tech, progress bar, "N of N items captured".
- **"Required for this permit":** one row per required item, generated from the rule pack for this job's jurisdiction and job type. Done rows show a green check and the captured value. Needed rows show a dashed ring and a **Take photo** / **Enter** button.
- **Bottom:** a 56 px **Send to office** button, disabled with the label "Capture N more to send", plus the line "Draft only · not filed · contractor signs before anything is submitted".

### C3. Guided photo (`TechCamera.dc.html`)
- Full-screen dark camera.
- **Top:** close, "{Item} · N of N", flash.
- **Viewfinder:** an orange guide box sized for the item, and an instruction card ("Fill the box with the panel label" / "The amp rating must be readable").
- **Offline chip:** "No signal · saving to phone".
- **Bottom:** last-photo thumbnail, an 84 px orange shutter, Skip.
- After the shot: a quick check that the photo isn't blurry, then auto-return to the checklist.

### C4. Office asks for a fix (`TechFix.dc.html`)
- Shown on the job when the office picks "Ask tech to confirm". Also pinned on C1.
- **Amber card:** the office's message, "You entered" vs "Label photo", the photo, **Change to {value}** (primary) and **Keep {value} and add a note**.
- The answer goes back to the office and creates a new packet version.

### C5. Sent (`TechSent.dc.html`) and Queued (`TechQueued.dc.html`)
- Big green check, "Delivered to the office", address and time.
- Receipt table: Packet version + fingerprint · Items · Photos uploaded · Office notified ("Email confirmed").
- Buttons: **Next job · {address}** (primary) and **Back to today's jobs**.
- With no signal, show **`TechQueued.dc.html`** instead:
- an amber "Queued · no signal" pill and the heading "Saved on your phone"
- receipt rows: photos uploaded "0 of 3 · waiting", office notified "Not yet"
- the line "You can keep working. Queued jobs show on the Sync tab."

It never says "sent" until the server confirms.

---

## D. Walkthrough demo (`Main.dc.html`)
An interactive prototype of one job end to end, with a "Live back end" log. Use it as a behavior reference for statuses, versioning and notifications. It is not a production screen.
