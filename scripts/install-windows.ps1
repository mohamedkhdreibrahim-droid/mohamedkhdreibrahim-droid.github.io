# ============================================================================
#  MOVA — تثبيت الأدوات على Windows
#    - لوحات وسكربتات After Effects (كل الإصدارات المثبتة)
#    - خوادم MCP في Claude Desktop (يدمجها مع إعداداتك ولا يمسحها)
#    - مكتبات مشروع Remotion (npm install)
#  التشغيل: انقر مرتين على install-windows.cmd
#       أو:  powershell -ExecutionPolicy Bypass -File scripts\install-windows.ps1
#  آمن لإعادة التشغيل: لا يكرر ولا يستبدل خوادم موجودة.
# ============================================================================
param(
    [switch]$SkipAfterEffects,
    [switch]$SkipClaude,
    [switch]$SkipRemotion,
    [switch]$SkipKeys   # لا تسأل عن مفاتيح Replicate / Brave / ElevenLabs
)

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path

function Say($msg, $color = 'Gray') { Write-Host $msg -ForegroundColor $color }
function Has($cmd) { [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }

# ------------------------------------------------------------ 1. After Effects
if (-not $SkipAfterEffects) {
    Say "`n== After Effects ==" Cyan
    $aeDirs = @(Get-ChildItem 'C:\Program Files\Adobe' -Directory -Filter 'Adobe After Effects*' -ErrorAction SilentlyContinue |
        Where-Object { Test-Path (Join-Path $_.FullName 'Support Files\Scripts') })
    if ($aeDirs.Count -eq 0) {
        Say "لم أجد After Effects في C:\Program Files\Adobe — تخطيت." Yellow
    } else {
        $src = Join-Path $Here 'after-effects'
        $log = Join-Path $env:TEMP 'mova-ae-install.log'
        Remove-Item $log -ErrorAction SilentlyContinue
        # النسخ إلى Program Files يحتاج صلاحية المسؤول: نشغّل هذا الجزء فقط بصلاحية مرتفعة
        $inner = @"
`$ErrorActionPreference = 'Continue'
foreach (`$d in @('$(($aeDirs.FullName) -join "','")')) {
  `$s = Join-Path `$d 'Support Files\Scripts'
  New-Item -ItemType Directory -Force -Path (Join-Path `$s 'ScriptUI Panels') | Out-Null
  Copy-Item '$src\panels\*.jsx'  (Join-Path `$s 'ScriptUI Panels') -Force
  Copy-Item '$src\scripts\*.jsx' `$s -Force
  "OK `$d" | Out-File -Append -Encoding utf8 '$log'
}
"@
        $tmp = Join-Path $env:TEMP 'mova-ae-install-inner.ps1'
        [IO.File]::WriteAllText($tmp, $inner, (New-Object Text.UTF8Encoding $true))
        Say "ستظهر نافذة صلاحيات Windows — اضغط Yes." Yellow
        try {
            Start-Process powershell -Verb RunAs -Wait -WindowStyle Hidden `
                -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $tmp
        } catch {
            Say "تم رفض الصلاحيات — لم تُنسخ سكربتات After Effects." Red
        }
        if (Test-Path $log) { Get-Content $log | ForEach-Object { Say "  ✓ $_" Green } }
        Say "أعد تشغيل After Effects: اللوحات في Window، والسكربتات في File > Scripts."
    }
}

# ------------------------------------------------------------ 2. Claude Desktop
if (-not $SkipClaude) {
    Say "`n== Claude Desktop ==" Cyan
    # نسخة Microsoft Store تحفظ الإعداد في Claude-Data؛ النسخة العادية في %APPDATA%\Claude
    $cfg = $null
    $msix = Get-ChildItem "$env:LOCALAPPDATA\Claude-Data" -Directory -Filter 'claude_*' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($msix) { $cfg = Join-Path $msix.FullName 'claude_desktop_config.json' }
    elseif (Test-Path "$env:APPDATA\Claude") { $cfg = "$env:APPDATA\Claude\claude_desktop_config.json" }
    else { New-Item -ItemType Directory -Force "$env:APPDATA\Claude" | Out-Null; $cfg = "$env:APPDATA\Claude\claude_desktop_config.json" }
    Say "الملف: $cfg"

    $desk = [Environment]::GetFolderPath('Desktop')
    $motion = Join-Path $desk 'MotionProjects'
    New-Item -ItemType Directory -Force -Path $motion | Out-Null

    if (Test-Path $cfg) {
        Copy-Item $cfg "$cfg.bak-$(Get-Date -Format yyyyMMdd-HHmmss)" -Force
        $json = Get-Content $cfg -Raw -Encoding UTF8
        $j = if ($json.Trim()) { $json | ConvertFrom-Json } else { New-Object psobject }
    } else {
        $j = New-Object psobject
    }
    if (-not $j.PSObject.Properties['mcpServers']) { $j | Add-Member -NotePropertyName mcpServers -NotePropertyValue (New-Object psobject) }

    $wanted = [ordered]@{
        'filesystem'    = [ordered]@{ command = 'npx'; args = @('-y', '@modelcontextprotocol/server-filesystem', $motion) }
        'after-effects' = [ordered]@{ command = 'npx'; args = @('-y', 'after-effects-mcp') }
        'fetch-web'     = [ordered]@{ command = 'uvx'; args = @('mcp-server-fetch') }
    }

    # الخوادم التي تحتاج مفتاحاً: تُضاف فقط إذا كتبت المفتاح (يبقى على جهازك فقط)
    $keyed = @(
        @{ name = 'replicate';    pkg = @('-y', 'replicate-mcp');                  cmd = 'npx'; env = 'REPLICATE_API_TOKEN'; label = 'Replicate' },
        @{ name = 'brave-search'; pkg = @('-y', '@brave/brave-search-mcp-server'); cmd = 'npx'; env = 'BRAVE_API_KEY';       label = 'Brave Search' },
        @{ name = 'elevenlabs';   pkg = @('elevenlabs-mcp');                       cmd = 'uvx'; env = 'ELEVENLABS_API_KEY';  label = 'ElevenLabs' }
    )
    if (-not $SkipKeys) {
        foreach ($k in $keyed) {
            if ($j.mcpServers.PSObject.Properties[$k.name]) { continue }
            $sec = Read-Host -AsSecureString "مفتاح $($k.label) (اضغط Enter للتخطي)"
            $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
            if ($plain) {
                $wanted[$k.name] = [ordered]@{ command = $k.cmd; args = $k.pkg; env = [ordered]@{ $k.env = $plain } }
            }
        }
    }

    foreach ($name in $wanted.Keys) {
        if ($j.mcpServers.PSObject.Properties[$name]) {
            Say "  = $name موجود مسبقاً — لم ألمسه"
        } else {
            $j.mcpServers | Add-Member -NotePropertyName $name -NotePropertyValue $wanted[$name]
            Say "  + $name" Green
        }
    }
    $out = $j | ConvertTo-Json -Depth 20
    [IO.File]::WriteAllText($cfg, $out, (New-Object Text.UTF8Encoding $false))  # بدون BOM
    $null = Get-Content $cfg -Raw -Encoding UTF8 | ConvertFrom-Json            # تحقق أن الملف سليم
    Say "أغلق Claude Desktop تماماً (من أيقونة شريط المهام → Quit) ثم افتحه."
}

# ------------------------------------------------------------ 3. Remotion
if (-not $SkipRemotion) {
    Say "`n== Remotion ==" Cyan
    $rr = Join-Path $Here 'remotion-reels'
    if (-not (Has 'npm')) {
        Say "Node.js غير مثبت:  winget install OpenJS.NodeJS.LTS" Yellow
    } elseif (Test-Path (Join-Path $rr 'package.json')) {
        Push-Location $rr
        try { npm install --no-fund --no-audit; Say "  ✓ $rr" Green } finally { Pop-Location }
        Say "للتشغيل:  cd `"$rr`"  ثم  npm run dev"
    }
}

# ------------------------------------------------------------ Requirements
Say "`n== المتطلبات ==" Cyan
if (-not (Has 'node')) { Say "Node.js غير مثبت:  winget install OpenJS.NodeJS.LTS" Yellow } else { Say "  ✓ Node.js" Green }
if (-not (Has 'uvx'))  { Say "uv غير مثبت (لـ fetch و ElevenLabs):  winget install astral-sh.uv" Yellow } else { Say "  ✓ uv" Green }
Say "`nتم." Green
