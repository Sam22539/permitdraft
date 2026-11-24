# Final checklist — deadline Wed Nov 25, 2026, 1:14 PM PT

Set by Sam on Nov 24 at 1:14 PM PT: **24 hours to finalize the design.** Every deliverable must be production quality: no placeholders without labels, no unverified claims, and every screen checked at desktop and phone sizes.

## Done means all of these are true
| # | Deliverable | Owner | Status |
|---|---|---|---|
| 1 | Homepage, final direction, at 320 / 390 / 768 / 1024 / 1440 | Claude | A done (Rounds 3–6); board shipped; waiting on Sam's A/B pick |
| 2 | Office portal: sign in, dashboard, review, contractor signing (desktop + phone/tablet) | Claude | Review screen done (Round 8); sign-in and signing done (Round 4); dashboard tablet/phone next |
| 3 | Technician app: jobs, checklist, camera, office fix, queued, sent | Claude | In progress |
| 4 | Polished visual mockups of 1–3 from `VISUAL_BRIEF.md`, sent to Sam | **ChatGPT** | Not yet posted; brief updated in Round 7 (real logo, 5 steps, queued screen) |
| 5 | Specs match the mockups: `SCREENS.md`, `DESIGN_SYSTEM.md`, tokens | Claude | Updated Round 6 |
| 6 | Accessibility: contrast ≥ 4.5:1, focus rings, 44/56 px targets, no essential text < 12 px | Claude + Codex | Passing on A; re-check all screens |
| 7 | Codex review with no open findings on the final commit | Codex | Clean on Rounds 4–5 |
| 8 | `MASTER_PROMPT.md` updated so Ted can build from the final design | Claude | Final pass before the deadline |
| 9 | Claims on the public page match what's built, or are marked for approval | Claude | Table in Round 3 notes |

## Milestones (Claude holds these times)
| By (PT) | Ships |
|---|---|
| **Tue 2:00 PM** ✅ | Presentation boards: homepage A, office portal, technician app (`docs/design/final/`) |
| **Tue 4:00 PM** | Office dashboard: tablet + phone layouts, real logo, PD-1187 in the jobs table |
| **Tue 6:00 PM** | Tech camera polish; every screen re-checked for contrast and minimum text size |
| **Tue 9:00 PM** | Final `MASTER_PROMPT.md` for Ted (direction A, logo, focus rule, 5-step states, queued screen, verified vs. proposed, open decisions) |
| **Wed 10:00 AM** | `FINAL_SUMMARY.md` for Sam with links to every final image; boards refreshed |
| **Wed 1:14 PM** | Deadline: checklist closed, final PR summary posted, Sam notified |

## Decisions only Sam can make (needed before build)
1. Homepage direction: **A** (recommended) or B
2. Core price: $49 or $69
3. Coverage wording: CA + AZ, or CA + AZ + TX
4. Which plan tier gets Dispatch, Leads, Invoices and Revenue
5. Approval to show the not-yet-built features on the public page

## Quality bar for everyone
- Use sample data, labeled as sample, and always job PD-1187.
- Never say "compliant", "guaranteed", "approved by", "we file for you" or "all 50 states".
- Real PD logo only.
- Every image or screen is checked at phone width before it's posted.
