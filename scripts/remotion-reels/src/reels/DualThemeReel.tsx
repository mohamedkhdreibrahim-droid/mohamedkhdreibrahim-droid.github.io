import React from "react";
import {
  AbsoluteFill,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { loadFont } from "@remotion/google-fonts/Alexandria";
import { z } from "zod";
import { ANTICIPATE_OVERSHOOT_SETTLE, CURVE } from "../motion/curves";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "600", "700", "800"],
  subsets: ["arabic", "latin"],
});

export const dualThemeReelSchema = z.object({
  // editorial = ورق دافئ وحركة هادئة | news = داكن مع أصفر وحركة خاطفة
  theme: z.enum(["editorial", "news"]),
  category: z.string(),
  headline: z.string(),
  highlightedWords: z.string(),
  bodyText: z.string(),
  source: z.string(),
  footerTag: z.string(),
  counter: z.string(),
  // اسم ملف داخل public/ (تعليق صوتي + مؤثرات، بدون موسيقى). فارغ = بدون صوت
  audioFile: z.string(),
});

type Props = z.infer<typeof dualThemeReelSchema>;

const PALETTES = {
  editorial: {
    bg: "#F7F5F0",
    text: "#141414",
    subText: "#333333",
    accent: "#141414",
    accentText: "#F7F5F0",
    highlight: "#E5E0D5",
    border: "#D6D3CB",
  },
  news: {
    bg: "#121214",
    text: "#FFFFFF",
    subText: "#D1D1D6",
    accent: "#FACC15",
    accentText: "#121214",
    highlight: "#FACC15",
    border: "#2C2C30",
  },
} as const;

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const DualThemeReel: React.FC<Props> = ({
  theme,
  category,
  headline,
  highlightedWords,
  bodyText,
  source,
  footerTag,
  counter,
  audioFile,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const isNews = theme === "news";
  const c = PALETTES[theme];

  // الإيقاع: news أسرع بـ 30%، وتجاوز أكبر. editorial أهدأ وتجاوز خفيف
  const pace = isNews ? 0.7 : 1;
  const at = (...frames: number[]) => frames.map((f) => Math.round(f * pace));
  const ov = isNews ? 1 : 0.5; // قوة الـ Overshoot

  return (
    <AbsoluteFill name="REEL_Root" style={{ backgroundColor: c.bg, fontFamily, direction: "rtl" }}>
      {audioFile ? <Audio name="AUDIO_VO_SFX" src={staticFile(audioFile)} /> : null}

      <CameraMotionBlur shutterAngle={180} samples={8}>
        {/* CTRL_Camera — "Null" الكاميرا الحية: انجراف بطيء بمنحنى ناعم */}
        <AbsoluteFill
          name="CTRL_Camera"
          style={{
            scale: interpolate(frame, [0, durationInFrames], [1, isNews ? 1.05 : 1.025], {
              ...CLAMP,
              easing: CURVE.drift,
            }),
          }}
        >
          {/* المناطق الآمنة: 220 أعلى، 420 أسفل، 160 يمين (أزرار المنصة)، 60 يسار */}
          <AbsoluteFill
            name="LAYOUT_Safe_Zone"
            style={{
              padding: "220px 160px 420px 60px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              color: c.text,
            }}
          >
            <div>
              {/* 1. التصنيف: نزول بسيط (Anticipation) ← صعود يتجاوز ← استقرار */}
              <Interactive.Div
                name="TXT_Category_Tag"
                style={{
                  display: "inline-block",
                  backgroundColor: c.accent,
                  color: c.accentText,
                  padding: "10px 26px",
                  fontSize: 32,
                  fontWeight: 800,
                  borderRadius: isNews ? 2 : 6,
                  marginBottom: 32,
                  opacity: interpolate(frame, at(0, 8), [0, 1], { ...CLAMP, easing: CURVE.fade }),
                  translate: interpolate(
                    frame,
                    at(0, 5, 14, 22),
                    ["0px 30px", "0px 38px", `0px ${-6 * ov}px`, "0px 0px"],
                    { ...CLAMP, easing: ANTICIPATE_OVERSHOOT_SETTLE },
                  ),
                }}
              >
                {category}
              </Interactive.Div>

              {/* 2. الخط الفاصل: يُرسم من اليمين ويتجاوز قليلاً ثم يرتد */}
              <Interactive.Div
                name="SHP_Divider_Line"
                style={{
                  height: isNews ? 4 : 2,
                  backgroundColor: isNews ? c.accent : c.border,
                  transformOrigin: "right",
                  marginBottom: 44,
                  scale: interpolate(
                    frame,
                    at(6, 8, 24, 32),
                    ["0 1", "0 1", `${1 + 0.04 * ov} 1`, "1 1"],
                    { ...CLAMP, easing: ANTICIPATE_OVERSHOOT_SETTLE },
                  ),
                }}
              />

              {/* 3. العنوان الرئيسي */}
              <Interactive.Div
                name="TXT_Headline"
                style={{
                  fontSize: isNews ? 82 : 74,
                  fontWeight: 800,
                  lineHeight: 1.26,
                  margin: "0 0 36px 0",
                  opacity: interpolate(frame, at(10, 22), [0, 1], { ...CLAMP, easing: CURVE.fade }),
                  translate: interpolate(
                    frame,
                    at(10, 15, 28, 38),
                    [`0px ${isNews ? 55 : 35}px`, `0px ${isNews ? 64 : 41}px`, `0px ${-8 * ov}px`, "0px 0px"],
                    { ...CLAMP, easing: ANTICIPATE_OVERSHOOT_SETTLE },
                  ),
                }}
              >
                {headline}
              </Interactive.Div>

              {/* 4. شريط التظليل: يُمسح من اليمين لليسار، يتجاوز ثم يستقر */}
              <Interactive.Div
                name="GRP_Highlight"
                style={{
                  position: "relative",
                  display: "inline-block",
                  padding: "6px 18px",
                  opacity: interpolate(frame, at(30, 38), [0, 1], { ...CLAMP, easing: CURVE.fade }),
                }}
              >
                <Interactive.Div
                  name="SHP_Highlight_Bar"
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: c.highlight,
                    transformOrigin: "right",
                    scale: interpolate(
                      frame,
                      at(34, 36, 50, 58),
                      ["0 1", "0 1", `${1 + 0.06 * ov} 1`, "1 1"],
                      { ...CLAMP, easing: ANTICIPATE_OVERSHOOT_SETTLE },
                    ),
                  }}
                />
                <span
                  style={{
                    position: "relative",
                    fontSize: 56,
                    fontWeight: 800,
                    color: isNews ? "#121214" : "#141414",
                  }}
                >
                  {highlightedWords}
                </span>
              </Interactive.Div>
            </div>

            {/* 5. النص السردي / الاقتباس */}
            <Interactive.Div
              name="TXT_Body_Quote"
              style={{
                borderRight: `${isNews ? 8 : 6}px solid ${c.accent}`,
                paddingRight: 36,
                opacity: interpolate(frame, at(54, 68), [0, 1], { ...CLAMP, easing: CURVE.fade }),
                translate: interpolate(
                  frame,
                  at(54, 58, 72, 82),
                  ["0px 24px", "0px 30px", `0px ${-4 * ov}px`, "0px 0px"],
                  { ...CLAMP, easing: ANTICIPATE_OVERSHOOT_SETTLE },
                ),
              }}
            >
              <p style={{ fontSize: 46, fontWeight: 500, lineHeight: 1.55, color: c.subText, margin: "0 0 20px 0" }}>
                {bodyText}
              </p>
              <span style={{ fontSize: 30, fontWeight: 600, color: c.subText, opacity: 0.75 }}>{source}</span>
            </Interactive.Div>

            {/* 6. التذييل */}
            <Interactive.Div
              name="TXT_Footer"
              style={{
                borderTop: `1px solid ${c.border}`,
                paddingTop: 22,
                display: "flex",
                justifyContent: "space-between",
                fontSize: 28,
                color: c.subText,
                opacity: interpolate(frame, at(70, 86), [0, 0.85], { ...CLAMP, easing: CURVE.fade }),
              }}
            >
              <span>{footerTag}</span>
              <span style={{ direction: "ltr", unicodeBidi: "isolate" }}>{counter}</span>
            </Interactive.Div>
          </AbsoluteFill>
        </AbsoluteFill>
      </CameraMotionBlur>
    </AbsoluteFill>
  );
};
