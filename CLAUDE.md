# MOVA Creative site — rules for every chat/session

These rules come from the site owner. All chats must follow them so they work in the same direction.

1. **GitHub `main` is the single source of truth.** Every change (code, text, prices, videos, images) must be committed to this repository. Never edit or upload site files only on a laptop or only on Cloudflare.
2. **Don't change the owner's saved work without approval.** Once a change is committed, no other chat may modify, replace or revert it unless the owner explicitly asks for that specific change.
3. **No deploys without approval.** The live site is Cloudflare Pages project `mova-creative-eg` (direct upload, not connected to Git). Deploy only when the owner asks, and only from an up-to-date `main` checkout: `npx wrangler pages deploy . --project-name mova-creative-eg --branch main`. A deploy replaces the whole site, so anything not in `main` disappears.
4. **Before deploying, compare with the live site.** If the live site has files (e.g. videos) that differ from or are missing in `main`, stop and ask the owner — commit those files to `main` first.
5. **Large media:** keep videos under `media/` (Cloudflare Pages limit: 25 MiB per file).
6. **Prices** live in `assets/pricing.js` (USD-anchored; top tier 250 USD) with fallback text in `index.html` and `ar-company/index.html`.
