# PermitDraft Screen Specs v1.0

Each screen has a reference file in `mockups/` (open it in the PermitDraft Redesign canvas). Build to match those files: layout, copy, colors and sizes. Values not written here come from `DESIGN_SYSTEM.md`.

---

## A. Homepage — permitdraft.co (`Homepage.dc.html`)

A public marketing page. On desktop the content is 1200 max width. Everything must stack cleanly at 390 px.

1. **Nav (navy):** logo (document icon in Orange 500 + "Permit**Draft**" in Space Grotesk 24/700, "Draft" in Orange 500), then the links How it works · Products · Pricing · Sign in, then a primary button **Book a demo**.
2. **Hero (navy):**
   - Left side, top to bottom:
     - Eyebrow "For HVAC contractors · California & Arizona".
     - H1 "Permit-ready before the truck leaves the driveway." (84 px).
     - Lead paragraph.
     - Buttons **Book a demo** (primary) and **See how it works** (outline on navy).
     - A fine-print line.
   - Right side: a phone mockup showing the job checklist, a floating white "Permit draft v2 · Signed" card, and a small "Delivered to office" status chip.
   - Use real product screenshots once they exist.
3. **Proof strip (navy, 1 px navy-700 borders top and bottom):** four columns: Offline first · Every value has proof · One locked version · English y Español.
4. **How it works (gray-50):** a 56 px title, then three white cards with big orange 01/02/03: Capture, Review, Sign.
5. **Products (white):** two 24 px-radius panels side by side.
   - Technician app: navy panel.
   - Office portal: light panel.
   - Each panel has an eyebrow, a 36 px title, a paragraph and three feature chips.
6. **Pricing (gray-50):** "One plan. Your whole crew." plus a Core card with a 2 px navy border. **The price is `[PRICE]` until Sam decides ($49 vs $69).** CTA: Start with the demo.
7. **Closing CTA (navy):** "Stop doing permits at the kitchen table." (72 px), centered, with two buttons.
8. **Footer (navy-950):** logo, the draft-only legal line, and the links Coverage · Resources · Privacy · Terms · Español.

Motion is subtle. Hero elements fade up 12 px over 400 ms, staggered. The floating card in the hero drifts 6 px slowly. Respect `prefers-reduced-motion`. No gradient washes, no stock photos of people.

---

## B. Office portal (desktop, signed in)

### B1. Sign in (`OfficeSignIn.dc.html`)
- Split screen: navy brand panel on the left, a white form card (max 400) on gray-50 on the right.
- Work email field, then **Email me a sign-in link** (primary). Below that, an "or" divider and **Continue with Google**.
- A link sends techs to the mobile app.
- Only company admins and office reviewers can sign in here.

### B2. Dashboard (`OfficeDashboard.dc.html`)
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

### C5. Sent (`TechSent.dc.html`)
- Big green check, "Delivered to the office", address and time.
- Receipt table: Packet version + fingerprint · Items · Photos uploaded · Office notified ("Email confirmed").
- Buttons: **Next job · {address}** (primary) and **Back to today's jobs**.
- If there's no signal, the screen title becomes "Saved on phone. Will send when you have signal", and the receipt rows show "Waiting".

---

## D. Walkthrough demo (`Main.dc.html`)
An interactive prototype of one job end to end, with a "Live back end" log. Use it as a behavior reference for statuses, versioning and notifications. It is not a production screen.
