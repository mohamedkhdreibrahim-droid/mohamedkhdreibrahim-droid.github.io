# MOVA Creative — shared agent coordination

These instructions record the owner's requirements for Codex, Claude and future work sessions. Read `CLAUDE.md` as well; the owner's current instructions take precedence.

## Saving and ownership

- GitHub `main` is the source of truth. Save every durable, authorized website change in this repository, including source, copy, prices and media. Local folders and Cloudflare are not independent sources of truth.
- Commit and push authorized changes to a descriptive branch and provide its PR/commit reference. Do not leave completed work saved only on a laptop or in an agent workspace. Temporary working files and private credentials must not be committed.
- Preserve the owner's and other agents' saved work. Do not change, replace, revert or independently improve it unless the owner explicitly requests that change.
- Claude implements the owner's requested source changes and submits them through GitHub. Codex synchronizes and preserves that source, checks release readiness, and handles the manual Cloudflare upload when the owner explicitly requests publishing.
- At each handoff, identify the branch, full commit SHA, changed files and any media changes. Use the shared GitHub discussion so both agents can read the same record. Distinguish a message being posted from the other agent acknowledging it.
- Before starting work or accepting a handoff, fetch current GitHub state and inspect local changes. Fast-forward clean copies where appropriate; never reset, overwrite or silently stash another agent's work. Keep unmerged work separate from `main`.

## Publishing and video preservation

- Cloudflare Pages project `mova-creative-eg` uses direct upload. A merged GitHub PR does not update the live website automatically.
- Neither synchronization nor a merged PR authorizes publishing. Do not merge, deploy, enable automatic deployment or change hosting integration without the owner's request for that action.
- Before every authorized upload, record the previous production deployment and its source, then compare live pages and video references/files with the selected, current `main` commit. Compare actual media bytes/hashes where available, not filenames alone.
- If a live video is missing from or different in GitHub, stop the upload and reconcile with the owner. Preserve the live file; save the approved version to GitHub before publishing. Never silently remove or replace it.
- Respect the 25 MiB Pages file limit while preserving content and existing downloads. Account for the existing redirect for the large SFX ZIP when preparing the publishing artifact; do not drop it accidentally.
- After an authorized release, record the exact deployed commit and deployment URL in GitHub and verify the production URL and affected assets. Report any pending service activation separately from a successful website deployment.
- No continuous background synchronization or automatic deployment is configured. Synchronize at actual handoffs and work sessions; do not promise unattended saving of future edits unless a real automation is implemented at the owner's request.

## Confirmed handoff

The owner requested this coordination on 2026-11-12. Codex posted the role split and Claude acknowledged it:

- [Codex handoff](https://github.com/mohamedkhdreibrahim-droid/mohamedkhdreibrahim-droid.github.io/pull/2#issuecomment-6830994427)
- [Claude acknowledgment and media comparison](https://github.com/mohamedkhdreibrahim-droid/mohamedkhdreibrahim-droid.github.io/pull/2#issuecomment-6831144158)

The acknowledgment records an unresolved report of older video edits being lost. Before the next upload, also check historical deployments `647de0a7` and `79db39ee` against current `main` for those edits. Treat Claude's reported comparison as a handoff report, not a substitute for the pre-publication check. Do not infer permission to restore or overwrite media without the owner's decision.
