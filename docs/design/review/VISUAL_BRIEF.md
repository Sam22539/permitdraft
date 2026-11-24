# Visual brief for ChatGPT — produce the mockups (updated Round 7)

**Deadline: Wed Nov 25, 2026, 1:14 PM PT.** Post the images on PR #2 and send them to Sam.

**ChatGPT: please turn each section below into a polished, high-fidelity visual mockup image and send them to Sam.** The reference renders are Claude's working designs, exported from `docs/design/mockups/`. Keep their layout, content and colors, and raise the finish: realistic device frames, real-feeling job-site photography in place of the gray placeholders, crisp type and subtle depth. Every image must keep the demo data and the wording exactly as written (no "compliant", "guaranteed", "approved by" or "we file for you").


## ⚠️ Fidelity rule from Sam: match the reference images at least 90%
Every mockup must match its reference render **at least 90%**. Polish the finish; do not redesign. Score each image against this checklist before posting it, and post the score with it:

| Check (10 points each) | Must match the reference |
|---|---|
| 1. Layout | Same sections in the same order and positions, with the same proportions |
| 2. Content | Same headlines, labels and numbers, word for word (PD-1187, 100 A / 125 A, v1/v2) |
| 3. Colors | Navy #0B1B33, action orange #C2410C, accent #F97316, warm white #FAF9F6, and the status colors, all exactly |
| 4. Typography | Space Grotesk headlines, Inter UI and JetBrains Mono labels, at the same relative sizes and weights |
| 5. Logo | The real PD monogram only, exactly as in the asset files |
| 6. Components | Same buttons, pills, cards and stepper, with the same states (selected step, conflict vs. missing) |
| 7. Device frames | Same devices and the same arrangement (phone beside the office panel, etc.) |
| 8. States | Queued and Delivered kept distinct, nothing claims "sent" early, and the signature is on v2 |
| 9. Legal wording | The draft-only text unchanged; never "compliant", "guaranteed", "approved by" or "we file for you" |
| 10. Phone version | The 390 px composition matches the mobile reference |

**Allowed:** realistic photos in place of gray placeholders, real device hardware, subtle shadows and depth, sharper rendering.
**Not allowed:** new sections, different layouts, new copy, different colors or fonts, a redrawn logo, or invented features or numbers.
Anything that scores below 90 must be redone before it's posted. Stay on this task until every image in this brief is posted.

**Brand for every image**
- Colors: navy `#0B1B33` · action orange `#C2410C` · accent orange `#F97316` · warm white `#FAF9F6` · near-black `#05080F` · borders `#DFE4EB`.
- Status colors: conflict is amber `#FEF3C7` with a solid `#D97706` border · missing is gray with a **dashed** border · matched is green `#DCFCE7`.
- Fonts: Space Grotesk (headlines, A) · Archivo Expanded 800 uppercase (headlines, B) · Inter (all UI) · JetBrains Mono (small labels, versions).
- **Logo: use the real PD monogram only. Never redraw it.** The navy original is `public/generated-assets/company-logo.png` (navy with an orange square). On navy or dark backgrounds use `docs/design/assets/pd-logo-white.png`. Set "PermitDraft" beside it in Inter 700, all one color: white on dark, navy on light. Don't make "Draft" orange.
- Job ID: always **PD-1187** (1187 Oak St, Pasadena), labeled as sample data.

---

## 1. Homepage, direction A: warm-white editorial (desktop 1440 + phone 390). Recommended
References: `docs/design/renders/round3/homepage-A-1440.jpg`, `homepage-A-390.jpg`, `homepage-A-390-menu-open.jpg`, and the step frames `demo-step1…5-1440.png` / `demo-capture-to-sign-1440.gif`

> Premium SaaS homepage mockup for "PermitDraft", for HVAC contractors in California and Arizona.
> - **Page and nav:** warm off-white page (#FAF9F6). A slim navy top bar (#0B1B33) with the real white PD monogram and "PermitDraft" in white Inter, and the links How it works, Pricing, Technician app, and an outlined **Office sign in** button. On the phone version these become a "Menu" button.
> - **Hero:** a huge navy Space Grotesk headline, "Finish the job. Send the paperwork to the office." Then the bold line "Job-site photos → permit draft → office review → contractor signature" (orange arrows), a gray paragraph, an orange "Book a demo" button and a white "See the workflow" button.
> - **Workflow panel:** a large rounded navy panel titled "One job, start to finish", labeled "ILLUSTRATIVE DEMO · SAMPLE DATA · NO REAL PERMIT IS SENT". It has a **5-step switcher: 1 Capture · 2 Queued · 3 Delivered · 4 Review · 5 Sign**, with "Delivered" selected, and an orange progress line at 60%.
>   - **Phone:** a realistic smartphone shows job PD-1187 at 1187 Oak St, Pasadena: six checklist items with green checks, a green "Delivered to office" pill and an orange "Delivered to office ✓" button.
>   - **Office panel:** beside the phone, a light panel shows "Office · PD-1187", a "Packet v1 · A91C" chip, an amber conflict card ("Panel rating": Tech entered 100 A vs. label photo reads 125 A) and a table with Matched/Conflict pills.
> - **Look:** clean and editorial, Apple/Linear-level polish, generous whitespace, no gradients.
>
> **Also make one image per step**, so Queued and Delivered are clearly different:
> - **Queued:** the phone shows an amber "Queued · no signal" pill and "Waiting for signal · sends automatically". The office panel says "Nothing received".
> - **Review:** a green "Office decision" card showing 100 A struck through (v1) → 125 A (v2).
> - **Sign:** "Signed v2 · ready to file".

## 2. Homepage, direction B: executive navy, cinematic (desktop 1440 + phone 390)
Reference: `docs/design/renders/round3/homepage-B-1440.jpg`, `homepage-B-390.jpg` (alternative direction)

> Cinematic luxury-automotive homepage for "PermitDraft", near-black background (#05080F). A giant wide uppercase headline in Archivo Expanded 800: "PHOTOS IN." in white, then "PERMIT DRAFT OUT." in orange #F97316. A bold white subline: "Your tech photographs the job. PermitDraft turns those photos into a permit draft your office reviews and your contractor signs." A thin full-width orange line like a racing stripe, with pill-shaped orange "Book a demo →" and outline "Watch a job" buttons. Below that, a laptop showing an office dashboard (navy sidebar, KPI cards, a colored 8-stage pipeline, a jobs table, bar chart, map) with a technician's phone overlapping it in front (checklist with green checks, a real condenser photo, "Sent to office ✓"). Then a spec-sheet strip with four columns: "0 BARS" (works offline), "1" (checklist per permit), "SIGNED" (version-locked), "EN/ES" (languages). Dramatic lighting, Ferrari/Porsche product-page feel, lots of negative space.

## 3. Office portal dashboard (desktop 1440)
Reference: `docs/design/renders/round4/office-dashboard.jpg`

> Desktop web app dashboard for "PermitDraft". Navy sidebar (#0B1B33) with an orange-highlighted "Dashboard" and the items Customers, Leads (badge 18), Jobs/Projects, Permits, Technicians, Dispatch & Schedule, Documents, Equipment, Inspections, Invoices & Billing, Reports & Analytics, Automation, Integrations, Company Settings, plus a "PermitDraft Pro" plan card at the bottom. A navy top bar with search, an orange "+ New Job" button, a notification bell (12) and "Sam M. · Office Admin". The heading is "Good morning, Sam". Six KPI cards: Active Jobs 42 (navy), Pending Permits 16, Office Review 8, Submitted 11, Approved 26, Revenue MTD $86,420 (navy). An 8-stage colored pipeline: New/Draft 6, Field Capture 9, Missing Info 4, Office Review 8, Ready to Submit 7, Submitted 11, Corrections 3, Approved 26. A recent jobs table with orange tracking numbers and status pills, plus a technician dispatch list, a job map with orange pins, a permit status donut and monthly bars (navy and orange). A right rail with Notifications, a 3×2 Quick Actions grid and Today's Schedule. Light gray background, white cards, crisp and dense like a premium CRM.

## 4. Office: review a permit draft (desktop 1440)
Reference: `docs/design/renders/office-review.jpg`

> Desktop screen "Heat pump change-out", PD-2026-10482, 4412 Alder Ct, Sacramento. Three summary tiles: CONFLICTS 1 (amber, solid border), MISSING 0 (gray, dashed border), MATCHED 5 (green). A conflict card for "Panel rating": Javier entered 100 A, the panel label photo reads 125 A, with a real panel-label photo and the buttons "Use photo value (125 A)" (orange), "Ask Javier to confirm" and "Keep 100 A, add note". A "Captured details" table with Field / Value / Source / Check columns. A right rail with a 2×2 photo grid, a "Send for signature" card (button disabled until resolved) and an activity log.

## 5. Office sign in (desktop 1440)
Reference: `docs/design/renders/round4/office-sign-in.jpg`

> Split-screen sign-in. On the left, a navy panel with the logo and the large headline "Your office, every permit, one screen." On the right, a white form card on light gray: "Sign in", a "Work email" field, an orange "Email me a sign-in link" button, an "or" divider, "Continue with Google", and the small line "Technician? Use the PermitDraft app on your phone instead."

## 6. Technician app (five iPhone screens, side by side)
References: `docs/design/renders/round4/tech-1-jobs.jpg`, `tech-2-checklist.jpg`, `tech-4-office-fix.jpg`, `tech-5-sent.jpg`; `docs/design/renders/tech-3-camera.jpg`; `docs/design/renders/round5/tech-5a-queued.jpg`

> Six realistic iPhone screens in a row for the "PermitDraft" technician app, built for gloves and bright sun, with big buttons (56 px):
> 1. **Today's jobs:** navy header "Morning, Luis", "2 jobs today · 1 needs your answer". An amber-bordered "Office question" card, a job card for PD-1187 · 1187 Oak St with an orange progress bar, "4 of 6 captured" and an orange "Continue" button, and a bottom tab bar (Jobs, Sync, Me).
> 2. **Job checklist:** navy header for 1187 Oak St with a "Saved on phone" pill. Rows with green checks or dashed empty circles and orange "Take photo" buttons. A disabled "Capture 2 more to send" button.
> 3. **Guided camera:** a dark full-screen camera on a real electrical panel label, an orange guide box, the hint "Fill the box with the panel label", a chip "No signal · saving to phone", and a big orange shutter.
> 4. **Office asks for a fix:** an amber card reading "Office needs one fix", You entered 100 A vs. label photo 125 A, the photo, and the buttons "Change to 125 A" (orange) and "Keep 100 A and add a note".
> 5. **Queued (no signal):** an amber icon of a wifi signal crossed out, an amber "Queued · no signal" pill, "Saved on your phone", and a receipt (Packet v1 · A91C·04E2, Items 6 of 6, Photos uploaded 0 of 3 · waiting, Office notified: Not yet). The line reads "You can keep working. Queued jobs show on the Sync tab." It must never say "sent".
> 6. **Sent:** a big green check, "Delivered to the office", a receipt (Packet v1 · A91C·04E2, Items 6 of 6, Photos 3 of 3, Office notified: email confirmed), and "Next job · 92 Maple Ct".

## 7. Contractor signing (iPhone)
Reference: `docs/design/renders/round4/contractor-sign.jpg`

> A phone screen titled "Permit draft for your signature · 1187 Oak St, Pasadena CA", with "Version 2" and "Fingerprint 7F3A·92C1" chips, a summary table (Equipment, Refrigerant, Panel rating 125 A, Evidence, Reviewed by office), and an orange-tinted notice: "Draft — not a guarantee of compliance. You file it yourself on the City of Pasadena's official permit portal." Below it, a ticked checkbox "I reviewed version 2 and it matches the work done" and a big orange "Sign version 2" button.

---
When you post your images to the PR, tell Claude which direction (A or B) you'd ship and why. Claude will update the source designs to match whatever Sam approves.
