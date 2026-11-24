# أدوات After Effects — MOVA

لا تُنشر على الموقع (مجلد `scripts/` مستثنى في `cf-build.sh`).

**التثبيت على الـ Mac:** `bash scripts/install-mac.sh`
ثم أعد تشغيل After Effects.

## اللوحات (`panels/` → قائمة Window)
| الملف | الوظيفة |
|---|---|
| `MOVA_Studio_Panel.jsx` | اللوحة الشاملة: ريلز 9:16، نص عربي، تظليل، هوك، كولاج، كاميرا حية |
| `MOVA_Arabic_Type_Panel.jsx` | الخطوط العربية + العدّاد الإحصائي |

## السكربتات (`scripts/` → File > Scripts)
| الملف | الوظيفة |
|---|---|
| `MOVA_Motion_Studio_Setup.jsx` | مشروع 16:9 بمجلدات وكاميرا ولوجو |
| `MOVA_Reels_Studio_Setup.jsx` | ريلز متحدث 9:16 + المناطق الآمنة |
| `MOVA_Documentary_Reel_Setup.jsx` | ريل وثائقي بلا موسيقى + قلم تظليل |
| `MOVA_Collage_Paper_FX.jsx` | حافة ورقية + ظلين (يتحكم فيها `CTRL_Collage_Light`) |
| `MOVA_Visual_Hook.jsx` | Snap Zoom + اهتزاز + وميض لأول نصف ثانية |
| `MOVA_Studio_Engine.jsx` | كاميرا حية + تفاعل مع الصوت + تتابع للمحدد |
| `MOVA_Cinema_Master_Quality.jsx` | 32-bit + Motion Blur عالي — قبل الريندر النهائي فقط |

كل الحركات بمنحنيات Bezier (Anticipation / Overshoot / Follow-through) ويتحكم فيها Null — حسب قواعد `CLAUDE.md`.
