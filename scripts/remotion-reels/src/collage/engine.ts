// Collage engine — timing, easing and camera maths for the paper-collage style.
// Numbers follow references/motion-and-transitions.md of the collage skill:
// 24 fps, drawings on twos (one step = 1/12 s), camera zoom in log space.

export const FPS = 24;
export const STEP = 1 / 12; // seconds per drawing
export const W = 1920;
export const H = 1080;

/** Time in seconds, snapped to the current drawing (holds of 2 frames). */
export const stepTime = (frame: number) => Math.floor(frame / 2) * STEP;

/* ------------------------------------------------------------------ easing */
export type Ease = (x: number) => number;
const c = (x: number) => Math.min(1, Math.max(0, x));
export const EASE = {
  linear: (x: number) => x,
  sineInOut: (x: number) => -(Math.cos(Math.PI * x) - 1) / 2,
  quadIn: (x: number) => x * x,
  quadOut: (x: number) => 1 - (1 - x) * (1 - x),
  cubicIn: (x: number) => x * x * x,
  cubicOut: (x: number) => 1 - Math.pow(1 - x, 3),
  cubicInOut: (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  quintIn: (x: number) => Math.pow(x, 5),
  quintOut: (x: number) => 1 - Math.pow(1 - x, 5),
  expoOut: (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  // small overshoot, used by drops
  backOut: (x: number) => {
    const k = 1.70158;
    return 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2);
  },
} satisfies Record<string, Ease>;

/** One eased segment: value from a to b between t0 and t1. */
export const seg = (t: number, t0: number, t1: number, a: number, b: number, ease: Ease = EASE.cubicInOut) =>
  t <= t0 ? a : t >= t1 ? b : a + (b - a) * ease(c((t - t0) / (t1 - t0)));

/** Keyframes [[time, value, easeIntoThisKey?], ...] — piecewise, clamped. */
export const kf = (t: number, keys: [number, number, Ease?][]): number => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i];
    if (t <= t1) return seg(t, keys[i - 1][0], t1, keys[i - 1][1], v1, e ?? EASE.cubicInOut);
  }
  return keys[keys.length - 1][1];
};

/** Step tables measured on the reference films (fraction of the move per step). */
export const STEPS = {
  pop: [0.55, 1.1, 0.97, 1.0], // scale per step
  growX: [0.12, 0.41, 0.71, 1.0],
  enter: [0.75, 0.94, 0.98, 1.0], // expo-out share of the move
  exit: [0.003, 0.02, 0.08, 0.19, 0.36, 0.63, 1.0], // cubic-in share of the move
};

/** Read a step table: before `at` → before, then one entry per step, then the last. */
export const steps = (t: number, at: number, table: number[], before = 0) => {
  if (t < at) return before;
  const i = Math.floor((t - at) / STEP + 1e-6);
  return table[Math.min(i, table.length - 1)];
};

/** Log-space zoom between z0 and z1 (a push and a pull of the same amount feel the same). */
export const zoomSeg = (t: number, t0: number, t1: number, z0: number, z1: number, ease: Ease) =>
  Math.exp(seg(t, t0, t1, Math.log(z0), Math.log(z1), ease));

/* ------------------------------------------------------------------ palette */
export const PAPER_WHITE = {
  paper: "#F4F3EF",
  grid: "rgba(20,20,20,0.075)",
  ink: "#151515",
  accent: "#D92B23", // red boxes, the year, underlines
  printWhite: "#FBFBF8",
  placeholder: "#9C9B96",
} as const;

/* ------------------------------------------------------------------ beats types */
export type Print = { image: string; caption?: string; at?: number; caption_at?: number };
export type PhotoLabel = { text: string; point: [number, number]; box: [number, number]; at: number };
export type SceneBeat = {
  recipe: "print_opener" | "photo_full" | "kinetic_paper" | "print_table" | "print_line" | "print_pair";
  start: number;
  name?: string;
  transition?: "cut" | "torn" | "disc";
  exit?: "dive";
  dive_to?: "a" | "b";
  // print_opener
  kicker?: string;
  kicker_at?: number;
  big?: string;
  big_at?: [number, number];
  travel?: [number, number];
  prints?: Print[];
  // photo_full
  image?: string;
  labels?: PhotoLabel[];
  title?: string;
  title_pos?: [number, number];
  title_at?: number;
  caption?: string;
  zoom?: number;
  push_to?: [number, number];
  // kinetic_paper / print_line
  text?: string;
  words?: number[];
  underline_at?: number;
  size?: number;
  line?: string;
  print?: Print;
  // print_table
  pullback_at?: [number, number];
  // print_pair
  note?: string;
  note_at?: number;
};
export type Beats = {
  name: string;
  palette?: string;
  duration?: number;
  vo?: string;
  images?: Record<string, { kind?: string; prompt?: string }>;
  sfx?: { at: number; file: string; volume?: number }[];
  scenes: SceneBeat[];
};

/** Scene duration: until the next scene starts, or the end of the video. */
export const sceneDurations = (b: Beats) =>
  b.scenes.map((s, i) => (i + 1 < b.scenes.length ? b.scenes[i + 1].start : (b.duration ?? s.start + 3)) - s.start);

export const TRANSITION_STEPS = { cut: 0, torn: 5, disc: 4 } as const;
