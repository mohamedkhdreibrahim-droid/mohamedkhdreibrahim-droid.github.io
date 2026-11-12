#!/usr/bin/env bash
# Cloudflare Pages build step (Git integration).
# Build command: bash scripts/cf-build.sh    Output directory: dist
# Copies the static site into dist/, leaving out repo-only files and the
# SFX zip that is over the 25 MiB Pages limit (_redirects sends it to GitHub).
set -euo pipefail
rm -rf dist && mkdir dist
for f in * .nojekyll _redirects; do
  case "$f" in dist|scripts|CLAUDE.md) continue ;; esac
  [ -e "$f" ] && cp -R "$f" dist/
done
rm -f dist/gifts/khidr-sfx-pack-cc0.zip
big=$(find dist -type f -size +25M)
if [ -n "$big" ]; then echo "Files over 25 MiB: $big" >&2; exit 1; fi
echo "Built dist/ with $(find dist -type f | wc -l) files"
