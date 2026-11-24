# Claude design notes

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
