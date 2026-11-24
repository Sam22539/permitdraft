# PermitDraft Design System v1.0

One brand, three surfaces. Every screen in the app, the office portal and the website uses these rules. Exact values live in `tokens.css` (CSS variables) and `tokens.json` (same values, for code or Tailwind config). The clickable reference designs are in `mockups/`.

## 1. The three surfaces

| Surface | Who uses it | Feel | Device |
|---|---|---|---|
| **Homepage** (permitdraft.co) | Contractors deciding whether to buy | Premium, bold, cinematic. Big type, lots of space, dark navy hero | Desktop first, must work on phones |
| **Office portal** | Company owner and office reviewers, signed in with company email | Dense, organized, calm. Everything at a glance | Desktop (1280–1920 wide); usable on a tablet |
| **Technician app** | Field techs on the job | Pure utility. One job, one checklist, giant buttons, works with no signal | Phone (390 × 844 reference), gloves on, bright sun |

The office portal and technician app are **separate products with separate sign-ins** that share one back end.

## 2. Color

**Brand**
- Navy 900 `#0B1B33`: the brand color. Sidebar, top bars, hero, app headers, primary text.
- Orange 700 `#C2410C`: **the only color for primary buttons and links on light backgrounds.** White text on it passes WCAG AA (5.2:1).
- Orange 500 `#F97316`: the logo, progress bars, big step numbers and accents on navy. **Never use it for text or button fills on white**; it fails contrast.
- Orange 300 `#FDBA74`: eyebrow labels and links on navy.

**Neutrals.** Background `#F4F5F7`, borders `#DFE4EB`, input borders `#C9D1DC`, secondary text `#5A6779` (5.7:1 on white), body text `#3E4A5C`.

**Status colors.** Each one has a fixed meaning. Don't reuse them for anything else.

| Status | Background | Text | Rule |
|---|---|---|---|
| Matched / Approved / Delivered | `#DCFCE7` | `#166534` | Value and evidence agree |
| **Conflict** | `#FEF3C7` | `#78350F` | Solid amber border `#D97706`. Evidence disagrees, so the office must decide |
| **Missing** | `#F4F5F7` | `#374151` | **Dashed** gray border `#8A93A3`. The tech still has to capture it |
| Office review / versions | `#E0E7FF` | `#1E3A8A` | |
| Submitted | `#EDE9FE` | `#5B21B6` | |
| Ready to submit | `#E0F2FE` | `#075985` | |
| Corrections / errors | `#FEE2E2` | `#991B1B` | |

Conflict and Missing must **never** look alike. Conflict is solid amber and Missing is dashed gray. They differ in lightness as well as hue, so color-blind users can still tell them apart.

## 3. Typography

Three Google fonts, loaded once: **Space Grotesk** (display), **Inter** (UI), **JetBrains Mono** (versions, fingerprints, eyebrows).

| Use | Font | Size / weight | Notes |
|---|---|---|---|
| Homepage hero | Space Grotesk | 84 / 700, line-height 0.95, tracking −0.03em | 48 px on phones |
| Homepage section title | Space Grotesk | 56 / 700, line-height 1.0 | 36 px on phones |
| Homepage closing CTA | Space Grotesk | 72 / 700 | 40 px on phones |
| Step numbers 01 02 03 | Space Grotesk | 64 / 700, Orange 500 | |
| Eyebrow labels | JetBrains Mono | 13 / 500, uppercase, tracking 0.14em | Orange 700 on light, Orange 300 on navy |
| Lead paragraph | Inter | 20 / 400, line-height 1.55 | |
| Office page title | Inter | 26 / 800 | |
| Office card title | Inter | 15 / 700 | |
| Office KPI number | Inter | 28 / 800 | |
| Office table | Inter | 13 / 400; tracking numbers 700 in Orange 700 | |
| App screen title | Space Grotesk | 28 / 700 | |
| App job address | Space Grotesk | 24 / 700 | |
| App checklist item | Inter | 15 / 600, subline 13 / 400 | |
| App primary button | Inter | 17 / 700 | |

The body text minimum is 13 px in the office and 14 px in the app. Nothing important goes below 12 px.

## 4. Spacing, radius, layout

- 4 px grid. Use the steps 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 72, 112.
- Radius: table pills 6, buttons and inputs 10, office cards 14, app cards 16, homepage panels 24, chips 999.
- **Homepage:** content max width 1200, side gutter 32, section padding 112 top and bottom.
- **Office portal:** sidebar 230 (navy), top bar 64 (navy), page padding 20, right rail 280. Cards are white on `#F4F5F7` with a 1 px `#DFE4EB` border and no shadows.
- **Tech app:** reference frame 390 × 844, page padding 16, 10–12 between cards, navy header block at the top of every job screen.

## 5. Components

**Buttons**
- Primary: Orange 700 fill, white text, radius 10, hover Orange 800. Height 44 (office, web), **56 for the tech app's main action**.
- Secondary: white fill, 1 px `#C9D1DC` border, navy text.
- On navy: transparent, 1 px `#3B5078` border, white text.
- Disabled: `#DEE2E8` fill, `#4B5563` text, with a label that says why ("Capture 2 more to send").

**Status pill (table):** radius 6, padding 3×8, 12 px / 700, colors from the status table.

**Chip (header/version):** radius 999, padding 4×10, 12 px / 600. Versions use JetBrains Mono, like `Packet v2`.

**Office KPI card:** white card with a 13 px / 700 label, a 28 px / 800 number, a trend badge (success colors, or gray for 0%) and a 12 px gray subline. The first card (Active jobs) and the Revenue card use a navy fill.

**Pipeline stage:** a 64 px tall tile with an 8-stage row, each in its status color. Tapping one filters the jobs table. The selected tile gets a 2 px Orange 700 border.

**App checklist row:** min height 56, white, radius 14. On the left, a 30 px status circle: green check when done, dashed gray ring when needed. The label and subline sit in the middle and a "Take photo" / "Enter" button on the right.

**Sync status pill (tech app):** it always says exactly where the data is:
- `Saved on phone` (navy 800 on navy)
- `Delivered to office` (success)
- `No signal · saving to phone` (on the camera)

Never use the vague phrase "saved offline".

**Conflict card:** 2 px amber border. It shows the two values side by side with the evidence photo, then the decision buttons: *Use photo value* (primary), *Ask tech to confirm*, *Keep and add note*.

**Draft notice:** the homepage footer, the contractor sign screen and the tech send button all say the product makes drafts only, files nothing and guarantees nothing.

## 5b. Logo
Use the existing PD monogram, `public/generated-assets/company-logo.png` (navy, with an orange square). On navy or dark backgrounds use `docs/design/assets/pd-logo-white.png`, which has the same shapes with the navy recolored white and the orange kept. Set "PermitDraft" beside it in Inter 700. Don't redraw or restyle the mark.

## 6. Icons

Use stroke icons at 2 px stroke, 20–22 px, rounded caps. Lucide is the recommended set. No emoji in the UI.

## 7. Accessibility (must pass)
- Text contrast is at least 4.5:1 (3:1 at 24 px and up). The tokens above already pass, so don't invent new shades.
- Touch targets are at least 44 px, and at least 56 px for tech app primary actions.
- **Focus rings:** 3 px solid `#C2410C` on light surfaces and `#F97316` on navy or near-black, both with a 2 px offset. Never remove focus outlines.
- Use real `<button>`, `<a>`, `<input>` and `<label>` elements. Icon-only buttons get an `aria-label`.
- Status is never shown by color alone: there's always a word ("Conflict", "Missing", "Matched").
- Every string exists in English and Spanish.

## 8. Words we use and never use
- **Use:** draft, review, sign, file on the city portal, ready to file, captured, evidence.
- **Never:** "compliant", "guaranteed", "approved by [agency]", "we file for you", "works in all 50 states". The only exception is the negative disclaimer, "not a guarantee of compliance" / "does not … guarantee compliance".

## 9. Supporting colors
Use these only for what's listed. All of them are in `tokens.css`.
- Chart series, in order: `#16A34A` approved, `#7C3AED` submitted, `#2563EB` office review, `#EA580C` missing or approved bars, `#94A3B8` other, `#7DD3FC` data on navy.
- Soft banners: resolved `#F0FDF4` / `#14532D`, waiting `#FFFBEB` with border `#F2C46B`, draft notice `#FFF7ED` with `#78350F` text.
- Count badges `#DC2626`, photo placeholders `#3A4352`, camera `#05080F` / `#1A2233`, map `#E4EBE1` / `#D3DDD0`, table row dividers `#EEF1F5`.

## 10. Homepage directions (pending Sam's pick; A recommended)
- **A: warm-white editorial** (`mockups/HomepageA.dc.html`). Warm white `#FAF9F6` canvas, `#E6E2D8` hairlines, navy nav, Space Grotesk headlines from 40 px (mobile) to 84 px (desktop), and an interactive Capture → Send → Review → Sign hero.
- **B: executive navy, cinematic** (`mockups/HomepageV2.dc.html`). Near-black `#05080F` canvas, orange used as a racing stripe, and **Archivo Expanded 800 uppercase** headlines, used for editorial headlines only. Product UI keeps Inter.
- Whichever is picked becomes the rule here, and the other's tokens are removed.
