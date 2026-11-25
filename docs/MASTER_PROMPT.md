# MASTER PROMPT — PermitDraft redesign build (FINAL v2.0, Nov 24 2026)

**Builder:** Claude (Ted is removed from code work, per Sam, Nov 24). **Reviewers:** Codex (code, every PR), ChatGPT "Sol" (design). **Owner:** Sam.
**Repo:** `Sam22539/permitdraft` (TanStack Router + Vite + React + TypeScript; Drizzle migrations; existing company scoping and row-level security).
**Status:** the design is final, and Claude is building it in phases on `claude/…` branches. Items marked **[SAM DECIDES]** are Sam's alone.

---

## 0. How we work
1. **Claude builds.** Codex reviews every pull request, and ChatGPT reviews designs. Sam merges.
2. **One branch per phase** (`claude/phase-N-…`), then a pull request. Claude reviews, Codex reviews, and Sam merges. **Never push to `main`. Never rewrite pushed history.** That's Foundable's rule in `AGENTS.md`.
3. **The live site doesn't change** until Sam approves a phase. **Nothing gets deleted**: hidden features go behind a flag.
4. If something is unclear, write `[NEEDS SAM]` and move on. Never guess at permit rules, prices or legal wording.

## 1. What we're building: three products, one back end
| Product | Users | Sign-in | Device | Feel |
|---|---|---|---|---|
| **Homepage** (permitdraft.co) | Contractors deciding to buy | None (public) | Desktop first, must work on phones | Premium, editorial, calm |
| **Office portal** | Company owner + office reviewers | Company email (magic link + Google, **[SAM DECIDES]**) | **Desktop first: critical** | Dense, organized command center |
| **Technician app** | Field techs | Separate tech sign-in | Phone, gloves, sun, no signal | Pure utility |

Whatever a tech sends shows up in the office portal right away, and the office's questions show up on the tech's job.

## 2. Source of truth (all in the repo)
| What | Where |
|---|---|
| Design rules: colors, type, spacing, components, logo, focus, a11y | `docs/design/DESIGN_SYSTEM.md` |
| Exact values, for code and the Tailwind theme | `docs/design/tokens.css`, `docs/design/tokens.json` |
| Every screen: layout, copy, states | `docs/design/SCREENS.md` |
| **Technician app, full build prompt** | **`docs/design/MOBILE_APP_PROMPT.md`** (7 screens) |
| Pixel references (source) | `docs/design/mockups/*.dc.html` |
| Pixel references (images) | `docs/design/renders/round3…round12/`, boards in `docs/design/final/` |
| Accessibility gate | `docs/design/review/audit/audit.py` |
| Definition of done and open decisions | `docs/design/review/FINAL_CHECKLIST.md` |

**Build to match the references at least 90%:** the same layout, copy, colors, type and states.

## 3. Hard rules (every phase)
- **Logo:** only the existing PD monogram, `public/generated-assets/company-logo.png` (white variant on dark: `docs/design/assets/pd-logo-white.png`), with "PermitDraft" in Inter 700 in one color. Never redraw it.
- **Colors:** primary buttons and links are `#C2410C` (hover `#9A3412`). `#F97316` is decorative only and never used for text on white. Use `var(--pd-…)` tokens; **no raw hex values in components.**
- **Desktop-first office portal:**
  - Design at 1440 and verify at 1280 and 1920.
  - At **≥ 1200 px**: fixed 230 px sidebar, **6 KPI cards in one row**, **8 pipeline stages in one row**, full tables with no wrapped IDs or dates, a 2×2 bottom card grid, and a fixed 280 px right rail.
  - Tablet and phone are fallbacks only and must never change the desktop composition.
- **Conflict ≠ Missing:** Conflict is a solid amber border (`#D97706`); Missing is a **dashed** gray border. They're counted separately and have different actions.
- **Honest status:**
  - The three states are "Saved on phone", "Queued · no signal" and "Delivered to office".
  - **Never say "sent" before the server confirms.** The phrase "saved offline" is banned.
- **Versions:** every send seals a numbered version (v1, v2…) with a fingerprint. Office decisions create a new version and keep the old one read-only. A signature belongs to one exact version, and any later edit means a new version and a new signature.
- **Focus rings:** 3 px solid, `#C2410C` on light and `#F97316` on dark, with a 2 px offset. Never remove them.
- **Accessibility:**
  - Contrast ≥ 4.5:1 (3:1 for large text).
  - No essential text under 12 px; body text ≥ 14 px in the app.
  - Targets ≥ 44 px, and **≥ 56 px for primary actions in the tech app**.
  - Real buttons and labels. Status is never shown by color alone.
- **Language:** English and Spanish at 100% parity. Never write "compliant", "guaranteed", "approved by", "we file for you" or "all 50 states". The only exception is the negative disclaimer ("not a guarantee of compliance").
- **Sample data in designs:** job **PD-1187**, 1187 Oak St, Pasadena (Luis = tech, Maria = office, Dana K. = contractor). Production uses real data only.

## 4. Screens to build
**Homepage: direction A** (`HomepageA.dc.html`; `SCREENS.md` §A). **[SAM DECIDES]** A vs. B (`HomepageV2.dc.html`). A is recommended by Claude and ChatGPT.
- **Nav:** the real logo, How it works, Pricing (`/pricing`), Technician app (`/demo`, proposed target), and an outlined **Office sign in** (`/sign-in`). Below 760 px it becomes a **Menu** button.
- **Hero:** "Finish the job. Send the paperwork to the office.", then the mechanism line, then Book a demo (`/early-access`) and See the workflow.
- **5-step interactive demo:** Capture → **Queued** → **Delivered** → Review → Sign.
  - Buttons use `aria-pressed`; the caption is an `aria-live` region.
  - It's manual: no autoplay.
  - The office panel stacks under the phone on mobile and is never hidden.
  - The label reads "Illustrative demo · sample data · no real permit is sent".
- **Then:** the capability strip, Evidence (data plate → draft field), the two product cards with crops, the trust timeline, Pricing at **[PRICE]**, the closing CTA, and the footer disclaimer (unchanged).

**Office portal** (`SCREENS.md` §B):
- **B1 Sign in** (`OfficeSignIn`).
- **B2 Dashboard** (`OfficeDashboard`), desktop-first as above. The pipeline tile filters the jobs table.
- **B3 Review** (`OfficeReview`):
  - Conflict / Missing / Matched tiles.
  - A conflict card with *Use photo value* / *Ask tech* / *Keep + note*. Each decision creates v2 and shows an **Office decision** card (100 A struck through as v1 → 125 A as v2).
  - Send-for-signature stays disabled until 0 conflicts and 0 missing.
- **B4 Contractor signing** (`ContractorSign`): a version + fingerprint chip, the review checkbox, then **Sign version N**, and after signing "locked to version N".
- **Dispatch, Leads, Invoices, Revenue and Automation** go behind the `plan.tier` flag. **[SAM DECIDES]** which tier.

**Technician app:** build exactly as `docs/design/MOBILE_APP_PROMPT.md` says:
1. Today's jobs
2. Job checklist (items come from the rule pack, never hard-coded)
3. Guided camera
4. Office asks for a fix
5. **Queued · no signal**
6. Delivered
7. **Sync tab**

Platform: PWA in this repo (the service worker already exists). **[SAM DECIDES]** PWA vs. native.

## 5. Back end: four new tables (Drizzle migrations, company-scoped, RLS like migration 0008)
| Table | Purpose | Key columns |
|---|---|---|
| `packet_versions` | Sealed copy of each send or decision (insert-only) | `id, packet_id, version int, fingerprint` (sha-256 of the canonical fields JSON + photo hashes), `fields jsonb, photo_ids uuid[], reason` (`sent`/`office_decision`/`tech_correction`), `created_by, created_at` |
| `packet_checks` | Conflicts and missing items per version | `id, packet_version_id, field_key, kind` (`conflict`/`missing`/`matched`), `captured_value, evidence_value, evidence_photo_id, decision` (`use_evidence`/`keep_with_note`/`asked_tech`/null), `decided_by, decided_at, note` |
| `signatures` | Who signed which exact version | `id, packet_version_id` (unique), `fingerprint, signer_name, signer_email, signed_at, ip, user_agent` |
| `email_deliveries` | Proof an email arrived | `id, company_id, kind, to_email, packet_id, provider_message_id, status` (`queued`/`delivered`/`bounced`/`failed`), `status_at`, updated by the provider webhook |

The existing tables stay: `office_packets`, `job_photos`, `job_extra_photos`, `correction_requests`, `stage_changes`, `profiles`, `invoices`. The existing `retryOfficeNotice` path feeds `email_deliveries`.

**Server guards:**
- Send-for-signature is refused while the latest version has any conflict or missing item.
- Sign is refused unless the version and fingerprint are the latest.
- Uploads are idempotent on packet + version, so there are no duplicates.
- Every state change writes `stage_changes`.

## 6. What's real vs. proposed (don't market what isn't built)
| Feature | Status today |
|---|---|
| English and Spanish UI | Verified in code |
| Photos stored on the phone before upload | Verified (`src/lib/photos.ts`) |
| Office review and correction requests | Verified |
| Office notice retry | Partly (`retryOfficeNotice`); delivery *confirmation* is proposed |
| Auto-send when signal returns | **Proposed: build in Phase 3** |
| Reading values from photos / automatic conflict detection | **Proposed**; no OCR today. **[SAM DECIDES]** whether it's in scope |
| Version-locked signatures with fingerprint | **Proposed: build in Phase 2** |
| Coverage wording | **[SAM DECIDES]** CA + AZ, or + TX (the code covers TX) |

Until a proposed feature ships, the public homepage must soften or leave out claims about it. **[SAM DECIDES]**

## 7. Phases (one PR each, in order)
| Phase | Scope | Accepted when |
|---|---|---|
| **1. Foundation** | `tokens.css` + Tailwind mapping, fonts (Space Grotesk, Inter, JetBrains Mono), and the base components: Button variants, StatusPill, Chip, Card, KPI card, Sync pill, Draft notice, the focus ring and the logo. Also a `/design-preview` page | Components match `DESIGN_SYSTEM.md`, and `/design-preview` passes the audit |
| **2. Back end** | The 4 migrations, RLS, fingerprinting, the email webhook and the server guards | Tests cover sealing, the send guard, the sign guard and idempotent upload. No cross-company reads |
| **3. Technician app** | All 7 screens + the offline queue + auto-retry | The acceptance tests in `MOBILE_APP_PROMPT.md` pass (airplane mode → Queued → Delivered only after server confirms; EN/ES; 390 and 320 px) |
| **4. Office portal** | B1–B4 + the pipeline filter + the decisions that create versions + flags for the parked features | Desktop layout verified at 1280/1440/1920, and the walkthrough (`mockups/Main.dc.html`) works on real data |
| **5. Homepage** | Direction **[SAM DECIDES]**, at breakpoints 1440/1024/768/390/320 | Lighthouse ≥ 90 for Performance and Accessibility; nothing clipped at 320 |

**Gate for every UI phase:** take screenshots at the reference widths, and they must match the renders at least 90%. The automated contrast and text-size audit must show 0 issues. Run `python docs/design/review/audit/audit.py` against the mockups, and the same checks against the built pages.

## 8. Report format (every update)
```
Phase / PR:
Files changed:
What I did:
Tests + results (incl. audit output):
Screenshots: desktop 1440 (+1280/1920 for the office portal) and 390, EN + ES
Open questions / [NEEDS SAM]:
```

## 9. Open decisions: Sam only
1. Homepage direction: **A** (recommended) or B
2. Core price: $49 or $69 (shown as `[PRICE]` until decided)
3. Coverage wording: CA + AZ, or CA + AZ + TX
4. Which plan tier gets Dispatch, Leads, Invoices, Revenue and Automation
5. Whether proposed features may be shown on the public page before they're built
6. Office sign-in method: magic link + Google, or the current method
7. Technician app: PWA (default) or native
