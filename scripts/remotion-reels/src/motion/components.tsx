import React, { useId } from "react";
import { interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { ANTICIPATE_OVERSHOOT_SETTLE, CURVE, enter, fadeIn } from "./curves";

/* ---------------------------------------------------------------------------
   WordByWord — نص عربي يظهر كلمة بكلمة بترتيب القراءة (من اليمين)
   كل كلمة: تنزل قليلاً (Anticipation) ← تطلع وتتجاوز (Overshoot) ← تستقر
--------------------------------------------------------------------------- */
export const WordByWord: React.FC<{
  text: string;
  start?: number;
  stagger?: number; // فريمات بين كل كلمة
  rise?: number; // مسافة الطلوع بالبكسل
  style?: React.CSSProperties;
  highlight?: string; // كلمات تُلوَّن بلون التمييز
  highlightColor?: string;
}> = ({ text, start = 0, stagger = 3, rise = 40, style, highlight = "", highlightColor = "#FACC15" }) => {
  const frame = useCurrentFrame();
  const marked = new Set(highlight.split(/\s+/).filter(Boolean));
  return (
    <div style={{ direction: "rtl", display: "flex", flexWrap: "wrap", columnGap: "0.28em", ...style }}>
      {text.split(/\s+/).map((word, i) => {
        const t = start + i * stagger;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: fadeIn(frame, t, 6),
              translate: `0px ${enter(frame, t, rise, 0)}px`,
              color: marked.has(word) ? highlightColor : undefined,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

/* ---------------------------------------------------------------------------
   SnapHook — "Null" الهوك: زووم خاطف + اهتزاز يتلاشى + وميض إضاءة
   (نفس منطق سكربت After Effects: MOVA_Visual_Hook.jsx)
--------------------------------------------------------------------------- */
export const SnapHook: React.FC<{
  children: React.ReactNode;
  start?: number;
  shake?: number; // أقصى اهتزاز بالبكسل
}> = ({ children, start = 0, shake = 18 }) => {
  const frame = useCurrentFrame();
  const f = frame - start;
  const hit = 6; // لحظة الاصطدام (≈ 0.2s)
  const decay = f >= hit && f <= hit + 8 ? 1 - (f - hit) / 8 : 0;
  const amp = shake * decay * decay;
  const sx = (random(`hook-x-${frame}`) - 0.5) * 2 * amp;
  const sy = (random(`hook-y-${frame}`) - 0.5) * 2 * amp;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        scale: String(
          interpolate(f, [0, 7, 11, 14], [1.45, 0.96, 1.015, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: [CURVE.launch, CURVE.settle, CURVE.settle],
          }),
        ),
        translate: `${sx}px ${sy}px`,
        filter: `brightness(${interpolate(f, [hit - 1, hit + 1, hit + 4], [1, 1.8, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: [CURVE.launch, CURVE.settle],
        })})`,
      }}
    >
      {children}
    </div>
  );
};

/* ---------------------------------------------------------------------------
   PaperCard — بطاقة ورقية بحافة "تغلي" بإيقاع Stop-Motion + ظلين
   (نفس فكرة MOVA_Collage_Paper_FX.jsx)
--------------------------------------------------------------------------- */
export const PaperCard: React.FC<{
  children: React.ReactNode;
  boilFps?: number;
  boil?: number; // قوة اهتزاز الحافة
  style?: React.CSSProperties;
}> = ({ children, boilFps = 8, boil = 5, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const id = `boil-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const seed = Math.floor(frame / (fps / boilFps)); // يتغير 8 مرات في الثانية فقط
  return (
    <>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={id}>
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={seed} />
          <feDisplacementMap in="SourceGraphic" scale={boil} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div
        style={{
          filter: `url(#${id}) drop-shadow(5px 6px 4px rgba(0,0,0,0.45)) drop-shadow(18px 24px 28px rgba(0,0,0,0.30))`,
          ...style,
        }}
      >
        {children}
      </div>
    </>
  );
};

/* ---------------------------------------------------------------------------
   CountUp — عدّاد (أرقام إنجليزية افتراضياً)، يتباطأ عند الوصول ثم ينبض (Overshoot)
--------------------------------------------------------------------------- */
export const CountUp: React.FC<{
  to: number;
  start?: number;
  duration?: number;
  suffix?: string;
  locale?: string; // "en-US" = 70 ، "ar-EG" = ٧٠
  style?: React.CSSProperties;
}> = ({ to, start = 0, duration = 40, suffix = "", locale = "en-US", style }) => {
  const frame = useCurrentFrame();
  const value = interpolate(frame, [start, start + duration], [0, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: CURVE.launch,
  });
  const pulse = interpolate(
    frame,
    [start + duration - 6, start + duration - 2, start + duration + 5, start + duration + 11],
    [1, 0.97, 1.08, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ANTICIPATE_OVERSHOOT_SETTLE },
  );
  return (
    // ترتيب عربي (RTL): الرقم على اليمين والعلامة بعده على اليسار ← % 70
    // نستخدم flex بعنصرين منفصلين حتى لا يدمجهما المتصفح في رقم واحد LTR
    <div style={{ display: "inline-flex", direction: "rtl", alignItems: "baseline", columnGap: "0.12em", scale: String(pulse), ...style }}>
      <span style={{ direction: "ltr", unicodeBidi: "isolate" }}>{new Intl.NumberFormat(locale).format(Math.round(value))}</span>
      {suffix ? <span>{suffix}</span> : null}
    </div>
  );
};
