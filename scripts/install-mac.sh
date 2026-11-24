#!/usr/bin/env bash
# تثبيت أدوات MOVA على الـ Mac:
#   - سكربتات ولوحات After Effects
#   - ملف إعداد Claude Desktop (خوادم MCP)
# التشغيل:  bash scripts/install-mac.sh
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
shopt -s nullglob

# ------------------------------------------------------------ After Effects
AE_DIRS=("/Applications/Adobe After Effects "*)
installed=0
for d in "${AE_DIRS[@]}"; do
  [ -d "$d/Scripts" ] || continue
  echo "→ After Effects: $d  (قد يطلب كلمة سر الجهاز)"
  sudo mkdir -p "$d/Scripts/ScriptUI Panels"
  sudo cp "$HERE"/after-effects/panels/*.jsx "$d/Scripts/ScriptUI Panels/"
  sudo cp "$HERE"/after-effects/scripts/*.jsx "$d/Scripts/"
  installed=$((installed + 1))
done
if [ "$installed" -eq 0 ]; then
  echo "⚠️  لم أجد After Effects داخل /Applications — تخطيت تثبيت السكربتات."
else
  echo "✓ أعد تشغيل After Effects: اللوحات في قائمة Window، والسكربتات في File > Scripts."
fi

# ------------------------------------------------------------ Claude Desktop
CFG_DIR="$HOME/Library/Application Support/Claude"
CFG="$CFG_DIR/claude_desktop_config.json"
SRC="$HERE/claude-desktop/claude_desktop_config.json"
mkdir -p "$CFG_DIR"
if [ -f "$CFG" ]; then
  OUT="$CFG_DIR/claude_desktop_config.mova.json"
  echo "⚠️  يوجد ملف إعداد Claude سابق — لم ألمسه. حفظت ملف MOVA بجانبه لتدمجه يدوياً:"
else
  OUT="$CFG"
  echo "✓ ملف إعداد Claude Desktop:"
fi
sed "s/YOUR_MAC_USERNAME/$(whoami)/g" "$SRC" > "$OUT"
echo "   $OUT"
echo "   ضع مفاتيحك مكان PASTE_..._HERE ثم أغلق Claude Desktop (Cmd+Q) وافتحه."
mkdir -p "$HOME/Desktop/MotionProjects"

# ------------------------------------------------------------ Requirements
command -v node >/dev/null || echo "⚠️  Node.js غير مثبت:  brew install node"
command -v uvx  >/dev/null || echo "⚠️  uv غير مثبت (لـ fetch و ElevenLabs):  brew install uv"
echo "تم."
