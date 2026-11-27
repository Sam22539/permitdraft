# ECC-inspired development pilot

Status: proposed, instruction-only, opt-in. Tracking issue: #9.

## Scope and authority

This original project-specific checklist is informed by ECC's public security-review and tdd-workflow skills. It is not an ECC installation. Root AGENTS.md remains authoritative. Claude owns implementation and final technical decisions; Codex independently reviews PRs; ChatGPT reviews design and quality; the owner alone merges main. Ted has no development role. No production access or deployment is permitted under this pilot.

## Preliminary upstream review (2026-11-26)

Reviewed public main-branch documentation and selected configuration excerpts:
- https://github.com/affaan-m/ECC (README, license designation, install methods)
- https://github.com/affaan-m/ECC/blob/main/hooks/hooks.json (automatic Node.js hook dispatch)
- https://github.com/affaan-m/ECC/blob/main/.mcp.json (Chrome DevTools MCP via npx)
- https://github.com/affaan-m/ECC/blob/main/skills/security-review/SKILL.md (validation, authorization, secrets)
- https://github.com/affaan-m/ECC/blob/main/skills/tdd-workflow/SKILL.md (verified failing/passing tests)

MIT license is advertised upstream. No upstream files are vendored here. These are mutable main-branch references, not an audited or pinned runtime release. Full script, manifest, installer, lockfile and transitive dependency review remains outstanding. Native installation is not approved by this document.

## Shared workflow (manual invocation)

1. Read AGENTS.md and this document. Identify the task owner, affected paths, acceptance criteria, active PR conflicts and out-of-scope changes. Use a separate branch. Do not rewrite published history.
2. Before application changes, identify the smallest reproducible failing test or explain why a non-code task does not require one. Use the repository's actual test runner, not a downloaded substitute. Verify that failure is caused by the intended defect.
3. Implement only the scoped fix; keep existing UI and behavior unless the task explicitly changes them. Use existing TypeScript, React, routing and validation conventions. Preserve design tokens and responsive/accessibility behavior.
4. Rerun the relevant test and verify the fix; add boundary and failure-path tests. Record exact commands, exit status and remaining failures. Do not claim unexecuted tests passed.
5. Security review: check server-side authorization and tenant isolation, input validation, parameterized queries, file upload constraints, safe output handling, and error redaction where applicable. Never access or print secrets, production records or credentials. Use synthetic data. Flag unsafe dependencies; do not install or upgrade without scoped approval.
6. Run the existing project checks as applicable: npm run typecheck, npm test, npm run check:i18n, npm run build. Use an isolated, non-production checkout with the existing lockfile and approved dependencies. Do not bypass failing checks.
7. Open a PR with scope, design changes, test evidence, security findings and rollback approach. Request independent Codex review using @codex review. Claude resolves technical feedback; the owner controls merge.

## Pilot measurement

Choose a small synthetic review or isolated development task, with no production data. Compare baseline (AGENTS.md only) against pilot (AGENTS.md plus this checklist) on equivalent inputs. Record actionable findings, false positives, missed defects, validation evidence, time and token usage if available. Do not claim savings or improvement until measured. Pilot completion requires actual agent runs and independent review.

## Permissions and rollback

No hooks, agents, plugins, global configuration, shared memory, MCP servers, new dependencies or CI changes are added by this proposal. No extra tool permissions or data transfers are requested. This file is manually referenced and does not auto-load. To stop the pilot, stop referencing it; if merged, remove it via an owner-approved normal PR. For a future native install, pin and independently audit the exact revision, review all execution and network paths, use one installation method per harness and confirm hook trust explicitly. Never install in a live publishing checkout.

## Verification status

Documentation review only. No application code changes or application checks executed by ChatGPT. Actual Claude/Codex execution, full upstream audit and install testing remain pending. This PR must not be described as a completed ECC installation.
