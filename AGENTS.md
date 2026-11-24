<!-- FOUNDABLE:BEGIN -->
> [!IMPORTANT]
> This website is built with [Foundable](https://foundable.com), which syncs it with this repository both ways.
> Never rewrite pushed history (no force pushes, and no rebasing, amending or squashing of commits already pushed):
> Foundable's copy of the history would no longer match, and the owner could lose versions of their website.
>
> Every commit pushed to the synced branch comes into Foundable as a new version of the website, so keep that branch
> in a working state.
<!-- FOUNDABLE:END -->

## Team rules (set by Sam, Nov 2026)

### Who does what
- **Claude** — technical lead. Writes and changes app code and design files; makes the final technical call.
- **Ted (Foundable)** — builds only what is approved in `docs/MASTER_PROMPT.md`, on his own branch.
- **ChatGPT / Codex** — reviewer. Reads code and leaves comments on pull requests. Does not change code unless Sam assigns a specific task.
- **Sam** — owner. Only Sam approves merges into `main` and anything that goes live.

### How changes happen
1. Every change goes on a branch (`claude/…`, `ted/…`, `codex/…`) and becomes a pull request. Nobody pushes straight to `main`.
2. One task, one AI. Never edit files that another AI's open pull request is changing.
3. Every pull request states what changed, why, and how it was tested.
4. Feedback goes in pull request comments so everyone can see it.
5. Never rewrite pushed history (see the Foundable note above).

### Off limits without Sam's written OK
Prices and plans, legal wording, permit rules, deleting features, the live site, and secrets or passwords.

### Design source of truth
`docs/design/` — `DESIGN_SYSTEM.md`, `tokens.css`, `tokens.json`, `SCREENS.md`, and the reference screens in `docs/design/mockups/`.
