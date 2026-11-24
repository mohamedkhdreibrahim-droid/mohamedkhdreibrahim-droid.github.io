# MOVA Creative site — rules for every chat/session

These rules come from the site owner. All chats must follow them so they work in the same direction.

1. **GitHub `main` is the single source of truth.** Every change (code, text, prices, videos, images) must be committed to this repository. Never edit or upload site files only on a laptop or only on Cloudflare.
2. **Don't change the owner's saved work without approval.** Once a change is committed, no other chat may modify, replace or revert it unless the owner explicitly asks for that specific change.
3. **Publishing happens from GitHub only.** The live site is a Cloudflare Pages project connected to this repository (Git integration, production branch `main`, build command `bash scripts/cf-build.sh`, output directory `dist`). Every push/merge to `main` is published automatically — so merging to `main` *is* publishing. Claude and Codex may both publish this way; never deploy manually with Wrangler or upload in the Cloudflare dashboard. Merge to `main` only what the owner approved. The old direct-upload project `mova-creative-eg` is retired and must not be updated.
4. **Before merging to `main`, compare with the live site.** If the live site has files (e.g. videos) that differ from or are missing in `main`, stop and ask the owner — commit those files to `main` first.
5. **Large media:** keep videos under `media/` (Cloudflare Pages limit: 25 MiB per file).
6. **Prices** live in `assets/pricing.js` (USD-anchored; top tier 250 USD) with fallback text in `index.html` and `ar-company/index.html`.

## Motion design & animation rules (from the owner)

Apply these to every animation, video, After Effects or Remotion task for this site:

- **Role:** work as a senior motion designer (15+ years of experience).
- **Animation principles:** always use anticipation, overshoot and follow-through, with custom cubic-bezier easing. Never use linear motion.
- **Pacing:** keep cuts dynamic, 1.5 s to 3 s per visual beat, with seamless match-cuts between scenes.
- **Code output:** in After Effects ExtendScript (`.jsx`) or Remotion code, give layers clear descriptive names, drive animation from null controllers, and enable motion blur.
