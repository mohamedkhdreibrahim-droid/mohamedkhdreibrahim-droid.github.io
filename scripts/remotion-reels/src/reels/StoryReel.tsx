import React from "react";
import { AbsoluteFill, interpolate, Series, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { loadFont } from "@remotion/google-fonts/Alexandria";
import { z } from "zod";
import { CURVE, enter, fadeIn } from "../motion/curves";
import { CountUp, PaperCard, SnapHook, WordByWord } from "../motion/components";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "700", "800", "900"],
  subsets: ["arabic", "latin"],
});

/* ريل قصصي 12 ثانية = 4 إيقاعات × 3 ثوانٍ، بقطعات Match-Cut:
   شريط التظليل الأصفر طبقة واحدة فوق كل المشاهد، يتحرك عبر نقطة القطع
   فيربط كل مشهد بالذي بعده (Match on action). */

export const BEAT = 90; // 3 ثوانٍ عند 30fps
export const STORY_DURATION = BEAT * 4;

export const storyReelSchema = z.object({
  stat: z.number(),
  statSuffix: z.string(),
  statLine: z.string(),
  hookBar: z.string(),
  headline: z.string(),
  headlineHighlight: z.string(),
  body: z.string(),
  quoteLabel: z.string(),
  quote: z.string(),
  quoteSource: z.string(),
  cta: z.string(),
  ctaBar: z.string(),
  counter: z.string(),
  audioFile: z.string(),
});
type Props = z.infer<typeof storyReelSchema>;

const C = { bg: "#121214", text: "#FFFFFF", sub: "#D1D1D6", yellow: "#FACC15", ink: "#121214", paper: "#F4EFE4" };
// المنطقة الآمنة: من x=60 إلى x=920 (يمين 160 لأزرار المنصة)، ومن y=220 إلى y=1500
const SAFE = { left: 60, width: 860 };
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ------------------------------------------------------------------ CTRL_Match_Bar */
const MatchBar: React.FC = () => {
  const frame = useCurrentFrame();
  // المركز العمودي: 1180 ← 760 (يمر عبر القطع 90) ← 380 (عبر القطع 180) ← 1180 (عبر القطع 270)
  // كل انتقال: تراجع بسيط ← تجاوز ← استقرار
  const y = interpolate(
    frame,
    [92, 96, 108, 116, 172, 176, 188, 196, 262, 266, 278, 286],
    [1180, 1200, 745, 760, 760, 775, 368, 380, 380, 365, 1192, 1180],
    { ...CLAMP, easing: CURVE.settle },
  );
  const h = interpolate(
    frame,
    [92, 112, 172, 190, 262, 280],
    [120, 14, 14, 100, 100, 120],
    { ...CLAMP, easing: CURVE.settle },
  );
  // المسح الأول من اليمين لليسار
  const sx = interpolate(frame, [58, 60, 72, 80], [0, 0, 1.06, 1], {
    ...CLAMP,
    easing: [CURVE.windUp, CURVE.launch, CURVE.settle],
  });
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.left,
        width: SAFE.width,
        top: y - h / 2,
        height: h,
        backgroundColor: C.yellow,
        transformOrigin: "right",
        scale: `${sx} 1`,
      }}
    />
  );
};

/* ------------------------------------------------------------------ المشاهد */
const Hook: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <SnapHook start={0}>
        <div style={{ position: "absolute", top: 470, left: SAFE.left, width: SAFE.width, textAlign: "center" }}>
          <CountUp to={p.stat} suffix={p.statSuffix} duration={40} style={{ fontSize: 260, fontWeight: 900, color: C.yellow, lineHeight: 1 }} />
        </div>
      </SnapHook>
      <WordByWord
        text={p.statLine}
        start={18}
        style={{ position: "absolute", top: 860, left: SAFE.left, width: SAFE.width, justifyContent: "center", fontSize: 64, fontWeight: 700, color: C.text }}
      />
      <div
        style={{
          position: "absolute", top: 1180 - 60, left: SAFE.left, width: SAFE.width, height: 120,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 58, fontWeight: 900, color: C.ink, opacity: fadeIn(frame, 70, 8),
        }}
      >
        {p.hookBar}
      </div>
    </AbsoluteFill>
  );
};

const Headline: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <WordByWord
        text={p.headline}
        highlight={p.headlineHighlight}
        start={8}
        style={{ position: "absolute", top: 400, left: SAFE.left, width: SAFE.width, fontSize: 84, fontWeight: 800, lineHeight: 1.25, color: C.text }}
      />
      <div
        style={{
          position: "absolute", top: 820, left: SAFE.left, width: SAFE.width, direction: "rtl",
          fontSize: 46, fontWeight: 500, lineHeight: 1.55, color: C.sub,
          opacity: fadeIn(frame, 34, 12), translate: `0px ${enter(frame, 34, 30, 0)}px`,
        }}
      >
        {p.body}
      </div>
    </AbsoluteFill>
  );
};

const Quote: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute", top: 380 - 50, left: SAFE.left, width: SAFE.width, height: 100,
          display: "flex", alignItems: "center", paddingRight: 40, direction: "rtl",
          fontSize: 46, fontWeight: 900, color: C.ink, opacity: fadeIn(frame, 8, 8),
        }}
      >
        {p.quoteLabel}
      </div>
      <div
        style={{
          position: "absolute", top: 470, left: SAFE.left + 20, width: SAFE.width - 40,
          translate: `0px ${enter(frame, 6, 140, 0, { anticipation: 0.1, overshoot: 0.06, timing: [0, 5, 16, 26] })}px`,
          rotate: `${enter(frame, 6, 4, -1.2, { anticipation: 0.2, overshoot: 0.3, timing: [0, 5, 16, 26] })}deg`,
          opacity: fadeIn(frame, 6, 8),
        }}
      >
        <PaperCard style={{ backgroundColor: C.paper, padding: "56px 52px", direction: "rtl" }}>
          <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.5, color: C.ink }}>{p.quote}</div>
          <div style={{ marginTop: 28, fontSize: 32, fontWeight: 500, color: "#5A5A5A" }}>{p.quoteSource}</div>
        </PaperCard>
      </div>
    </AbsoluteFill>
  );
};

const CallToAction: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <WordByWord
        text={p.cta}
        start={10}
        rise={50}
        style={{ position: "absolute", top: 860, left: SAFE.left, width: SAFE.width, justifyContent: "center", fontSize: 92, fontWeight: 900, color: C.text }}
      />
      <div
        style={{
          position: "absolute", top: 1180 - 60, left: SAFE.left, width: SAFE.width, height: 120,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 54, fontWeight: 900, color: C.ink, opacity: fadeIn(frame, 16, 8),
        }}
      >
        {p.ctaBar}
      </div>
      <div
        style={{
          position: "absolute", top: 1400, left: SAFE.left, width: SAFE.width, textAlign: "center",
          fontSize: 34, fontWeight: 700, color: C.sub, direction: "ltr", unicodeBidi: "isolate",
          opacity: fadeIn(frame, 30, 10),
        }}
      >
        {p.counter}
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ الريل */
export const StoryReel: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill name="REEL_Story" style={{ backgroundColor: C.bg, fontFamily }}>
      {p.audioFile ? <Audio name="AUDIO_VO_SFX" src={staticFile(p.audioFile)} /> : null}
      <CameraMotionBlur shutterAngle={180} samples={8}>
        {/* CTRL_Camera: انجراف بطيء مستمر عبر كل القطعات */}
        <AbsoluteFill
          name="CTRL_Camera"
          style={{ scale: String(interpolate(frame, [0, STORY_DURATION], [1, 1.04], { ...CLAMP, easing: CURVE.drift })) }}
        >
          <MatchBar />
          <Series>
            <Series.Sequence name="BEAT_1_Hook" durationInFrames={BEAT}>
              <Hook {...p} />
            </Series.Sequence>
            <Series.Sequence name="BEAT_2_Headline" durationInFrames={BEAT}>
              <Headline {...p} />
            </Series.Sequence>
            <Series.Sequence name="BEAT_3_Quote" durationInFrames={BEAT}>
              <Quote {...p} />
            </Series.Sequence>
            <Series.Sequence name="BEAT_4_CTA" durationInFrames={BEAT}>
              <CallToAction {...p} />
            </Series.Sequence>
          </Series>
        </AbsoluteFill>
      </CameraMotionBlur>
    </AbsoluteFill>
  );
};
