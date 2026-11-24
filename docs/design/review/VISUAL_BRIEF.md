# Visual brief for ChatGPT — produce the mockups

**ChatGPT: please turn each section below into a polished, high-fidelity visual mockup image and send them to Sam.** The reference renders are Claude's working designs, exported from `docs/design/mockups/`. Keep their layout, content and colors, and raise the finish: realistic device frames, real-feeling job-site photography in place of the gray placeholders, crisp type and subtle depth. Every image must keep the demo data and the wording exactly as written (no "compliant", "guaranteed", "approved by" or "we file for you").

**Brand for every image**
- Colors: navy `#0B1B33` · action orange `#C2410C` · accent orange `#F97316` · warm white `#FAF9F6` · near-black `#05080F` · borders `#DFE4EB`.
- Status colors: conflict is amber `#FEF3C7` with a solid `#D97706` border · missing is gray with a **dashed** border · matched is green `#DCFCE7`.
- Fonts: Space Grotesk (headlines, A) · Archivo Expanded 800 uppercase (headlines, B) · Inter (all UI) · JetBrains Mono (small labels, versions).
- Logo: a document icon in orange, then "Permit" in white or navy and "Draft" in orange.

---

## 1. Homepage, direction A: warm-white editorial (desktop 1440 + phone 390)
Reference: `docs/design/renders/homepage-A-desktop.jpg`, `homepage-A-mobile.jpg`

> Premium SaaS homepage mockup for "PermitDraft", for HVAC contractors in California and Arizona. Warm off-white page (#FAF9F6), slim navy top bar (#0B1B33) with the PermitDraft logo and the links Workflow, Pricing, **Office sign in**, Technician app. A huge navy Space Grotesk headline: "Finish the job. Send the paperwork to the office." A gray subline, an orange "Book a demo" button and a white "See the workflow" button. Below that, a large rounded navy showcase panel with a 4-step switcher (1 Capture · 2 Send · 3 Review · 4 Sign, with "Send" selected) and an orange progress line. Inside the panel, a realistic smartphone shows a technician checklist for "1187 Oak St, Pasadena": six items with green checks, a green "Delivered to office" pill and an orange "Sent to office ✓" button. Beside it, a light office review panel shows "Office review · PD-1187", a "Packet v1" chip, an amber conflict card ("Panel rating": Tech entered 100 A vs. label photo reads 125 A) and a small table with Matched/Conflict pills. A "DEMO JOB · SAMPLE DATA" label. Clean, editorial, Apple/Linear-level polish, generous whitespace, no gradients.

## 2. Homepage, direction B: executive navy, cinematic (desktop 1440 + phone 390)
Reference: `docs/design/renders/homepage-B-desktop.jpg`, `homepage-B-mobile.jpg`

> Cinematic luxury-automotive homepage for "PermitDraft", near-black background (#05080F). A giant wide uppercase headline in Archivo Expanded 800: "PHOTOS IN." in white, then "PERMIT DRAFT OUT." in orange #F97316. A bold white subline: "Your tech photographs the job. PermitDraft turns those photos into a permit draft your office reviews and your contractor signs." A thin full-width orange line like a racing stripe, with pill-shaped orange "Book a demo →" and outline "Watch a job" buttons. Below that, a laptop showing an office dashboard (navy sidebar, KPI cards, a colored 8-stage pipeline, a jobs table, bar chart, map) with a technician's phone overlapping it in front (checklist with green checks, a real condenser photo, "Sent to office ✓"). Then a spec-sheet strip with four columns: "0 BARS" (works offline), "1" (checklist per permit), "SIGNED" (version-locked), "EN/ES" (languages). Dramatic lighting, Ferrari/Porsche product-page feel, lots of negative space.

## 3. Office portal dashboard (desktop 1440)
Reference: `docs/design/renders/office-dashboard.jpg`

> Desktop web app dashboard for "PermitDraft". Navy sidebar (#0B1B33) with an orange-highlighted "Dashboard" and the items Customers, Leads (badge 18), Jobs/Projects, Permits, Technicians, Dispatch & Schedule, Documents, Equipment, Inspections, Invoices & Billing, Reports & Analytics, Automation, Integrations, Company Settings, plus a "PermitDraft Pro" plan card at the bottom. A navy top bar with search, an orange "+ New Job" button, a notification bell (12) and "Sam M. · Office Admin". The heading is "Good morning, Sam". Six KPI cards: Active Jobs 42 (navy), Pending Permits 16, Office Review 8, Submitted 11, Approved 26, Revenue MTD $86,420 (navy). An 8-stage colored pipeline: New/Draft 6, Field Capture 9, Missing Info 4, Office Review 8, Ready to Submit 7, Submitted 11, Corrections 3, Approved 26. A recent jobs table with orange tracking numbers and status pills, plus a technician dispatch list, a job map with orange pins, a permit status donut and monthly bars (navy and orange). A right rail with Notifications, a 3×2 Quick Actions grid and Today's Schedule. Light gray background, white cards, crisp and dense like a premium CRM.

## 4. Office: review a permit draft (desktop 1440)
Reference: `docs/design/renders/office-review.jpg`

> Desktop screen "Heat pump change-out", PD-2026-10482, 4412 Alder Ct, Sacramento. Three summary tiles: CONFLICTS 1 (amber, solid border), MISSING 0 (gray, dashed border), MATCHED 5 (green). A conflict card for "Panel rating": Javier entered 100 A, the panel label photo reads 125 A, with a real panel-label photo and the buttons "Use photo value (125 A)" (orange), "Ask Javier to confirm" and "Keep 100 A, add note". A "Captured details" table with Field / Value / Source / Check columns. A right rail with a 2×2 photo grid, a "Send for signature" card (button disabled until resolved) and an activity log.

## 5. Office sign in (desktop 1440)
Reference: `docs/design/renders/office-sign-in.jpg`

> Split-screen sign-in. On the left, a navy panel with the logo and the large headline "Your office, every permit, one screen." On the right, a white form card on light gray: "Sign in", a "Work email" field, an orange "Email me a sign-in link" button, an "or" divider, "Continue with Google", and the small line "Technician? Use the PermitDraft app on your phone instead."

## 6. Technician app (five iPhone screens, side by side)
References: `docs/design/renders/tech-1-jobs.jpg` … `tech-5-sent.jpg`

> Five realistic iPhone screens in a row for the "PermitDraft" technician app, built for gloves and bright sun, with big buttons (56 px):
> 1. **Today's jobs:** navy header "Morning, Luis", "2 jobs today · 1 needs your answer". An amber-bordered "Office question" card, a job card for 1187 Oak St with an orange progress bar, "4 of 6 captured" and an orange "Continue" button, and a bottom tab bar (Jobs, Sync, Me).
> 2. **Job checklist:** navy header for 1187 Oak St with a "Saved on phone" pill. Rows with green checks or dashed empty circles and orange "Take photo" buttons. A disabled "Capture 2 more to send" button.
> 3. **Guided camera:** a dark full-screen camera on a real electrical panel label, an orange guide box, the hint "Fill the box with the panel label", a chip "No signal · saving to phone", and a big orange shutter.
> 4. **Office asks for a fix:** an amber card reading "Office needs one fix", You entered 100 A vs. label photo 125 A, the photo, and the buttons "Change to 125 A" (orange) and "Keep 100 A and add a note".
> 5. **Sent:** a big green check, "Delivered to the office", a receipt (Packet v1 · A91C·04E2, Items 6 of 6, Photos 3 of 3, Office notified: email confirmed), and "Next job · 92 Maple Ct".

## 7. Contractor signing (iPhone)
Reference: `docs/design/renders/contractor-sign.jpg`

> A phone screen titled "Permit draft for your signature · 1187 Oak St, Pasadena CA", with "Version 2" and "Fingerprint 7F3A·92C1" chips, a summary table (Equipment, Refrigerant, Panel rating 125 A, Evidence, Reviewed by office), and an orange-tinted notice: "Draft — not a guarantee of compliance. You file it yourself on the City of Pasadena's official permit portal." Below it, a ticked checkbox "I reviewed version 2 and it matches the work done" and a big orange "Sign version 2" button.

---
When you post your images to the PR, tell Claude which direction (A or B) you'd ship and why. Claude will update the source designs to match whatever Sam approves.
