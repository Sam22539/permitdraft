# MASTER PROMPT — PermitDraft redesign (v1.0, Nov 24 2026)

**To:** Ted (Foundable)
**From:** Sam, with Claude as technical lead
**Repo:** `Sam22539/permitdraft` (the TanStack Router + Vite + React + TypeScript app, with Drizzle migrations)

---

## 0. How we work (read first)

1. **Claude leads the code. You follow Claude's lead.** Before you change any code, show the files you'll touch and get approval. After each change, report what changed and the test results.
2. **Never work on `main`.** Use one branch per phase, named `redesign/phase-N-short-name`. Open a pull request, and Claude reviews it before it's merged.
3. **The live site doesn't change until Sam approves a phase.**
4. **Nothing gets deleted.** Features we aren't showing go behind a feature flag.
5. **Ask when unsure.** Don't guess at permit rules, prices or legal wording. Write `[NEEDS SAM]` and move on.

## 1. What we're building

PermitDraft is **three surfaces on one back end**:

| Surface | Users | Sign-in | Feel |
|---|---|---|---|
| **Homepage** (permitdraft.co) | Contractors deciding to buy | None (public) | Premium, cinematic, "Ferrari" |
| **Office portal** (desktop web) | Company owner and office reviewers | Company email (magic link or Google) | Dense, organized command center |
| **Technician app** (phone) | Field techs | Separate tech sign-in | Pure utility: jobs, photos, checklist, send |

Whatever a tech sends shows up in the office portal right away. The office's questions show up on the tech's job right away.

## 2. Design files (the source of truth)

These are all in `docs/design/`:

- `DESIGN_SYSTEM.md`: colors, fonts, sizes, components and rules. **Follow it exactly.**
- `tokens.css`: CSS variables. Import it once at the app root and use `var(--pd-…)` everywhere. **No raw hex values in components.**
- `tokens.json`: the same values. Map them into the Tailwind theme (`theme.extend.colors.pd`, `fontFamily`, `borderRadius`, `spacing`) so classes like `bg-pd-navy-900` work.
- `SCREENS.md`: a spec for every screen, its states and its copy.
- `mockups/*.dc.html`: the pixel references for every screen. Match layout, spacing, copy and color. **The visual design canvas is the final word on pixels.**

The fonts are Space Grotesk (display), Inter (UI) and JetBrains Mono (versions and labels), all from Google Fonts.

## 3. Hard rules

- **Primary buttons and links use `#C2410C` (`--pd-orange-700`).** Orange 500 `#F97316` is decorative only and is never used for text or button fills on white.
- **Conflict and Missing look different:** Conflict is a solid amber border, Missing a dashed gray border. They are counted separately and need different actions.
- **Sync status says exactly where data is:** "Saved on phone", "Delivered to office" or "No signal · saving to phone". The phrase "saved offline" is banned.
- **Every send creates a sealed, numbered version** (v1, v2…) with a fingerprint. A signature belongs to one version. Any edit after signing creates a new version and requires a new signature.
- **Office emails are confirmed delivered,** not assumed. Store the provider's delivery result.
- **Draft-only wording** appears on the homepage footer, the tech send button and the contractor sign screen. Never write "compliant", "guaranteed", "approved by", "we file for you" or "all 50 states". The only exception is the negative disclaimer, "not a guarantee of compliance".
- **Every string in English and Spanish.** Spanish and English must have 100% parity.
- **Accessibility:** text contrast ≥ 4.5:1, tap targets ≥ 44 px (≥ 56 px for the tech app's main actions), real buttons and labels, and status is never shown by color alone.
- **Tech app works fully offline:** capture, photos and the send queue. It retries until the server confirms.

## 4. Back end changes

The existing tables stay: `office_packets`, `job_photos`, `job_extra_photos`, `correction_requests`, `stage_changes`, `profiles`, `invoices`, plus the existing company scoping and row-level security.

Add these as new Drizzle migrations. Every table is company-scoped, with RLS in the same style as migration 0008:

| New table | Purpose | Key columns |
|---|---|---|
| `packet_versions` | A sealed copy of each send | `id`, `packet_id`, `version` (int), `fingerprint` (sha-256 of the canonical JSON of fields + photo hashes), `fields` (jsonb), `photo_ids` (uuid[]), `created_by`, `created_at`, `reason` (`sent` / `office_decision` / `tech_correction`). Insert-only, no updates or deletes. |
| `packet_checks` | Conflicts and missing items per version | `id`, `packet_version_id`, `field_key`, `kind` (`conflict` / `missing` / `matched`), `captured_value`, `evidence_value`, `evidence_photo_id`, `decision` (`use_evidence` / `keep_with_note` / `asked_tech` / null), `decided_by`, `decided_at`, `note` |
| `signatures` | Who signed which exact version | `id`, `packet_version_id`, `fingerprint`, `signer_name`, `signer_email`, `signed_at`, `ip`, `user_agent`. Unique on (`packet_version_id`). |
| `email_deliveries` | Proof that an email arrived | `id`, `company_id`, `kind` (`office_new_packet` / `signature_request` / …), `to_email`, `packet_id`, `provider_message_id`, `status` (`queued` / `delivered` / `bounced` / `failed`), `status_at`. Updated by the email provider's webhook. |

Server rules:
- The office's "Send for signature" is refused if the latest version has any open conflict or missing item.
- "Sign" is refused if the version or fingerprint isn't the latest.
- Every state change writes `stage_changes`.

## 5. Build phases (one PR each, in order)

**Phase 1: Foundation**
- Add `tokens.css`, the Tailwind mapping, the fonts, and base components: Button (primary, secondary, on-navy, disabled), StatusPill, Chip, Card, KPI card, Sync pill, Draft notice.
- Add a `/design-preview` page showing every component.
- Acceptance: the components match the design system, and `/design-preview` passes axe with no contrast errors.

**Phase 2: Back end**
- Add the four migrations, the RLS policies, the version fingerprinting, and the email delivery webhook.
- Write tests for sealing a version, the send-for-signature guard and the sign guard.
- Acceptance: the tests pass, and no table is readable across companies.

**Phase 3: Technician app**
- Build C1–C5 (Today's jobs, Job checklist, Guided photo, Office asks for a fix, Sent), plus the offline queue.
- Acceptance:
  - Airplane mode → capture 6 items → turn signal back on → the packet arrives once (no duplicates) with every photo.
  - The status pill is correct at every step.
  - EN/ES parity.

**Phase 4: Office portal**
- Build B1–B4: Sign in, Dashboard (pipeline filter working), Review (conflict decisions create versions), Contractor signing.
- Dispatch, Leads, Invoices, Revenue and Automation go behind the `plan.tier` flag.
- Acceptance: the full walkthrough in `mockups/Main.dc.html` works end to end on real data.

**Phase 5: Homepage**
- Build section A exactly as specified, with responsive breakpoints at 1280, 1024, 768 and 390.
- Keep the price as a placeholder until Sam decides.
- Acceptance: Lighthouse score ≥ 90 for Performance and Accessibility, and nothing is clipped at 390 px.

## 6. Reporting format (every update)

```
Phase / PR:
Files changed:
What I did:
Tests run + results:
Screenshots: (desktop + 390px for each changed screen, EN + ES)
Open questions / [NEEDS SAM]:
```

## 7. Open decisions (do not decide these yourself)
1. Core price: $49 or $69. It stays `[PRICE]` until decided.
2. Which plan tier gets Dispatch, Leads, Invoices, Revenue and Automation.
3. Coverage wording: California and Arizona only, or California, Arizona and Texas.
4. Sign-in method for the office: magic link plus Google (as designed), or the current method.
