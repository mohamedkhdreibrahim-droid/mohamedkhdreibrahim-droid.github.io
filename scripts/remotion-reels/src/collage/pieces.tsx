import React from "react";
import { AbsoluteFill, Img, random, staticFile } from "remotion";
import { getStaticFiles } from "@remotion/studio";
import { loadFont as loadAmiri } from "@remotion/google-fonts/Amiri";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadRuqaa } from "@remotion/google-fonts/ArefRuqaa";
import { EASE, PAPER_WHITE as P, STEP, STEPS, seg, steps } from "./engine";

// Free stand-ins for the skill's fonts: Lyon Arabic Display -> Amiri, Cairo -> Cairo, Aref Ruqaa -> Aref Ruqaa.
export const SERIF = loadAmiri("normal", { weights: ["400", "700"], subsets: ["arabic", "latin"] }).fontFamily;
loadAmiri("italic", { weights: ["400"], subsets: ["arabic", "latin"] });
export const SANS = loadCairo("normal", { weights: ["700", "800"], subsets: ["arabic", "latin"] }).fontFamily;
export const HAND = loadRuqaa("normal", { weights: ["700"], subsets: ["arabic"] }).fontFamily;

/* ------------------------------------------------------------------ images */
// A beat sheet names images by id; the file is public/collage/images/<id>.png (or .jpg).
// A missing image becomes a labelled grey placeholder, so the beat sheet can be checked first.
export const imageFile = (id: string): string | null => {
  const files = new Set(getStaticFiles().map((f) => f.name));
  for (const ext of ["png", "jpg", "jpeg", "webp"]) {
    const name = `collage/images/${id}.${ext}`;
    if (files.has(name)) return name;
  }
  return null;
};

export const Photo: React.FC<{ id: string; w: number; h: number }> = ({ id, w, h }) => {
  const file = imageFile(id);
  if (file) {
    return <Img src={staticFile(file)} style={{ width: w, height: h, objectFit: "cover", display: "block" }} />;
  }
  return (
    <div
      style={{
        width: w, height: h, background: `linear-gradient(160deg, #b3b2ad, ${P.placeholder} 60%, #85847f)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "rgba(255,255,255,0.85)", fontFamily: "monospace", fontSize: Math.max(18, w / 22), letterSpacing: 1,
      }}
    >
      {id}.png
    </div>
  );
};

/* ------------------------------------------------------------------ camera + layers */
/** CTRL_Camera: everything inside is the world (px of a 1920x1080 frame at zoom 1, origin at the centre). */
export const Camera: React.FC<{ x: number; y: number; zoom: number; roll?: number; blur?: number; children: React.ReactNode }> = ({
  x, y, zoom, roll = 0, blur = 0, children,
}) => (
  <AbsoluteFill style={{ overflow: "hidden", filter: blur > 0.2 ? `blur(${blur}px)` : undefined }}>
    <div
      style={{
        position: "absolute", left: "50%", top: "50%", width: 0, height: 0,
        transform: `scale(${zoom}) rotate(${roll}deg) translate(${-x}px, ${-y}px)`,
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

/** A piece placed in the world, centred on (x, y) unless an anchor is given. */
export const At: React.FC<{
  x: number; y: number; s?: number; sx?: number; r?: number; o?: number;
  anchor?: [number, number]; z?: number; children: React.ReactNode;
}> = ({ x, y, s = 1, sx = 1, r = 0, o = 1, anchor = [0.5, 0.5], z, children }) => (
  <div
    style={{
      position: "absolute", left: x, top: y, opacity: o, zIndex: z,
      transform: `translate(${-anchor[0] * 100}%, ${-anchor[1] * 100}%) rotate(${r}deg) scale(${s * sx}, ${s})`,
      transformOrigin: `${anchor[0] * 100}% ${anchor[1] * 100}%`,
    }}
  >
    {children}
  </div>
);

/* ------------------------------------------------------------------ grounds */
const hasPaper = () => getStaticFiles().some((f) => f.name === "collage/paper.jpg");
/** White paper with the faint black grid (116 px cells), ~1.45x the frame so drift never shows an edge. */
export const GridPaper: React.FC<{ w?: number; h?: number }> = ({ w = 4200, h = 2400 }) => (
  <div style={{ position: "absolute", left: -w / 2, top: -h / 2, width: w, height: h, backgroundColor: P.paper, overflow: "hidden" }}>
    {/* paper texture tiles (<Img> so the render waits for them to load); plain paper if the texture is missing */}
    {hasPaper() && <div style={{ position: "absolute", inset: 0, opacity: 0.5, mixBlendMode: "multiply", filter: "grayscale(0.9) contrast(1.1)" }}>
      {Array.from({ length: Math.ceil(h / 1600) * Math.ceil(w / 1600) }, (_, i) => {
        const cols = Math.ceil(w / 1600);
        return (
          <Img
            key={i} src={staticFile("collage/paper.jpg")}
            style={{ position: "absolute", left: (i % cols) * 1600, top: Math.floor(i / cols) * 1600, width: 1600, height: 1600 }}
          />
        );
      })}
    </div>}
    <div
      style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(${P.grid} 2px, transparent 2px), linear-gradient(90deg, ${P.grid} 2px, transparent 2px)`,
        backgroundSize: "116px 116px", backgroundPosition: "-1px -1px",
      }}
    />
  </div>
);

/* ------------------------------------------------------------------ prints */
/** A white-bordered print: border 3.6% of the width, bottom band 11.5% with an italic serif caption. */
export const PrintCard: React.FC<{ id: string; w: number; caption?: string; captionO?: number }> = ({ id, w, caption, captionO = 1 }) => {
  const b = Math.round(w * 0.036);
  const pw = w - 2 * b;
  const ph = Math.round((pw * 9) / 16);
  const band = Math.round(w * 0.115);
  return (
    <div
      style={{
        width: w, padding: `${b}px ${b}px 0 ${b}px`, backgroundColor: P.printWhite,
        boxShadow: "0 3px 6px rgba(0,0,0,0.22), 0 18px 38px rgba(0,0,0,0.20)",
      }}
    >
      <div style={{ filter: "grayscale(1) contrast(1.06)" }}>
        <Photo id={id} w={pw} h={ph} />
      </div>
      <div
        style={{
          height: band, display: "flex", alignItems: "center", justifyContent: "center", direction: "rtl",
          fontFamily: SERIF, fontStyle: "italic", fontSize: Math.round(w * 0.036), color: "#3a3a3a", opacity: captionO,
        }}
      >
        {caption}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ text */
/** Type-on, one logical character per step at cps characters per second. */
export const typed = (text: string, t: number, at: number, cps = 14) => {
  const chars = Array.from(text);
  const n = t < at ? 0 : Math.min(chars.length, 1 + Math.floor((t - at) * cps));
  return chars.slice(0, n).join("");
};

/** Colour settle: from the paper tint toward the ink over 3 steps. */
export const settle = (t: number, at: number) => steps(t, at, [0.45, 0.75, 0.92, 1], 0);

/** Words of a line rising one by one (each from 40 px below, expo-out over 5 steps, colour settles). */
export const WordsRise: React.FC<{
  text: string; times: number[]; t: number; size: number; color: string; font?: string; weight?: number; width?: number;
}> = ({ text, times, t, size, color, font = SERIF, weight = 700, width = 1700 }) => {
  const words = text.split(/\s+/);
  return (
    // explicit width: the world container has no width, so without it every word would wrap
    <div style={{ direction: "rtl", display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: size * 0.28, width }}>
      {words.map((w, i) => {
        const at = times[Math.min(i, times.length - 1)] ?? 0;
        const k = settle(t, at);
        return (
          <span
            key={i}
            style={{
              fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.25, color,
              opacity: t < at ? 0 : 0.35 + 0.65 * k,
              transform: `translateY(${seg(t, at, at + 5 * STEP, 40, 0, EASE.expoOut)}px)`,
              display: "inline-block",
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** Red marker underline drawn right to left over 4 steps (quad-out). */
export const Underline: React.FC<{ width: number; t: number; at: number; seed?: string }> = ({ width, t, at, seed = "u" }) => {
  const p = seg(t, at, at + 4 * STEP, 0, 1, EASE.quadOut);
  const pts = Array.from({ length: 9 }, (_, i) => {
    const x = width - (i / 8) * width;
    const y = 10 + (random(`${seed}-${i}`) - 0.5) * 7 + Math.sin(i / 2) * 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const len = width * 1.02;
  return (
    <svg width={width} height={22} style={{ overflow: "visible", display: "block" }}>
      <polyline
        points={pts.join(" ")} fill="none" stroke={P.accent} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={len} strokeDashoffset={len * (1 - p)}
      />
    </svg>
  );
};

/** Red label box with white text; grows from the reading side (right) in 4 steps. */
export const RedBox: React.FC<{ text: string; t: number; at: number; size?: number; white?: boolean }> = ({ text, t, at, size = 44, white }) => {
  const sx = steps(t, at, STEPS.growX, 0);
  return (
    <div
      style={{
        transform: `scaleX(${sx})`, transformOrigin: "100% 50%", opacity: sx > 0 ? 1 : 0,
        backgroundColor: white ? P.printWhite : P.accent, color: white ? P.ink : "#fff",
        fontFamily: SANS, fontWeight: 800, fontSize: size, lineHeight: 1, padding: `${size * 0.28}px ${size * 0.42}px ${size * 0.36}px`,
        direction: "rtl", whiteSpace: "nowrap", boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
      }}
    >
      {text}
    </div>
  );
};

/* ------------------------------------------------------------------ finish */
/** Film grain that changes with every drawing, plus a light vignette. */
export const Finish: React.FC<{ stepIndex: number }> = ({ stepIndex }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.09, mixBlendMode: "multiply" }}>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={stepIndex % 50} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 62%, rgba(0,0,0,0.10) 100%)" }} />
  </AbsoluteFill>
);
