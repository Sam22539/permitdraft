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

### Who does what (updated by Sam, Nov 24 2026)
- **Claude**: lead developer and designer. Builds the homepage, office portal and technician app; writes and changes app code, design files and migrations; makes the final technical call.
- **Codex**: code reviewer on every pull request (comment `@codex review`). Can take a clearly scoped task when Claude or Sam assigns it in a PR comment, on its own `codex/…` branch.
- **ChatGPT ("Sol")**: design reviewer and visual mockups (`docs/design/review/VISUAL_BRIEF.md`). It posts on pull requests and does not change app code unless Sam assigns a task.
- **Ted (Foundable)**: **removed from code work.** Ted must not commit, push or open pull requests in this repository. Foundable's sync stays only to publish the website from `main` (see the Foundable note above).
- **Sam**: owner. Only Sam merges into `main`, and merging `main` publishes the live site.

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
