# Claude design notes

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
