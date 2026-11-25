# PermitDraft redesign — final summary for Sam

**Deadline:** Wed Nov 25, 2026, 1:14 PM PT · **Status:** the design is done, and 7 decisions are yours (bottom of this page).
**Everything is on PR #2** (`claude/homepage-round2`). It's docs and images only, with no app code changes. Merge it when you're ready.

## See it
| | Link |
|---|---|
| **Homepage board** (direction A, recommended) | [`final/board-1-homepage-A.png`](final/board-1-homepage-A.png) |
| **Office portal board** (desktop) | [`final/board-2-office-portal.png`](final/board-2-office-portal.png) |
| **Technician app board** (7 screens) | [`final/board-3-technician-app.png`](final/board-3-technician-app.png) |
| Interactive designs (click through every screen) | [PermitDraft Redesign canvas](https://claude.ai/artifact/2ubJjK4P7RcPnXGyJEK8AL) |
| Homepage demo, animated | [`renders/round3/demo-capture-to-sign-1440.gif`](renders/round3/demo-capture-to-sign-1440.gif) |
| Homepage A at 5 sizes | [`renders/round3/`](renders/round3/) (1440 / 1024 / 768 / 390 / 320) |
| Office dashboard at desktop sizes | [`renders/round10/office-dashboard-1440.jpg`](renders/round10/office-dashboard-1440.jpg) · [1920](renders/round10/office-dashboard-1920.jpg) |
| Homepage B (alternative) | [`renders/round3/homepage-B-1440.jpg`](renders/round3/homepage-B-1440.jpg) |
| ChatGPT's polished mockups | *Not posted yet. They'll be added to `final/chatgpt/` when they are.* |

## What's done
- **Homepage (A):** warm-white editorial, with the real PD logo and a mobile menu.
  - The hero reads "Finish the job. Send the paperwork to the office."
  - It has a 5-step clickable demo: Capture → Queued → Delivered → Review → Sign.
  - Then come the evidence section, the two products, the paper trail, pricing at `[PRICE]`, and the call to action.
  - It works from 320 px phones to 1920 px desktops.
- **Office portal (desktop-first):** sign-in, a dashboard laid out like your screenshot (6 KPIs and 8 pipeline stages in one row, jobs table, dispatch, map, charts, notifications, quick actions, schedule), draft review with office decisions that create a new version, and contractor signing locked to one version.
- **Technician app:** today's jobs, the checklist, the guided camera, the office's fix request, queued (no signal), delivered, and the Sync tab. It's built for gloves, sun and no signal.
- **Quality:**
  - An automated check of every screen finds **0 contrast or text-size issues**.
  - Keyboard focus is visible everywhere.
  - Nothing claims "sent" before the office actually has it.
  - Codex reviews are clean.

## For the build (Claude builds; Codex and ChatGPT review)
- [`docs/MASTER_PROMPT.md`](../MASTER_PROMPT.md) is the one build brief. It covers the rules, the screens, 4 new database tables, 5 phases with pass/fail gates, and what's real vs. proposed.
- [`docs/design/MOBILE_APP_PROMPT.md`](MOBILE_APP_PROMPT.md) is a standalone prompt for the technician app. You can also hand it to any mobile UI tool.
- [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md), [`tokens.css`](tokens.css) and [`SCREENS.md`](SCREENS.md) hold the exact colors, fonts, sizes and screen specs.
- **Ted is removed from code work** (PR #4). Claude is building the app in phases, and the database back end is done and tested (PR #3).

## Your 7 decisions (nobody else will make them)
1. **Homepage:** direction **A** (recommended by Claude and ChatGPT) or B
2. **Price:** $49 or $69 per month
3. **Coverage wording:** California + Arizona, or + Texas (the app's code already covers Texas)
4. **Plan tiers:** which plan gets Dispatch, Leads, Invoices, Revenue and Automation
5. **Unbuilt features on the public page:** auto-send on reconnect, reading values from photos, version-locked signatures and confirmed email delivery are designed but **not built yet**. Show them now, or wait until they ship?
6. **Office sign-in:** email link + Google, or the current method
7. **Technician app:** web app installed on the phone (default; already set up) or a native iPhone/Android app

**When you've decided:** reply with your picks, and Claude applies them.
