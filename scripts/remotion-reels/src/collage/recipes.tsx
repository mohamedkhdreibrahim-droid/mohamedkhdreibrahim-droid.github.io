import React from "react";
import { EASE, PAPER_WHITE as P, STEP, STEPS, SceneBeat, kf, seg, steps, zoomSeg } from "./engine";
import { At, Camera, GridPaper, Photo, PrintCard, RedBox, SERIF, HAND, Underline, WordsRise, settle, typed } from "./pieces";

type R = { s: SceneBeat; t: number; dur: number };

/* Camera helpers shared by the recipes ----------------------------------------------- */
// Enter: push from `from` to 1 in 5 steps (expo-out table), then a slow eased drift (+0.15% per step).
const enterZoom = (t: number, dur: number, from = 0.9) => {
  const e = steps(t, 0, STEPS.enter, STEPS.enter[0]);
  const z0 = Math.exp(Math.log(from) * (1 - e));
  return z0 * zoomSeg(t, 5 * STEP, Math.max(dur, 5 * STEP + 0.1), 1, 1 + 0.0015 * (dur / STEP), EASE.sineInOut);
};

// Exit dive into a print: accelerating push (quint-in) over 6 steps, the frame goes soft.
const DIVE_STEPS = 6;
const dive = (t: number, dur: number) => seg(t, dur - DIVE_STEPS * STEP, dur, 0, 1, EASE.quintIn);

// Piece arrivals (step-based, see motion-and-transitions.md)
const slideIn = (t: number, at: number, dx: number, dy: number) => ({
  x: seg(t, at, at + 5 * STEP, dx, 0, EASE.expoOut),
  y: seg(t, at, at + 5 * STEP, dy, 0, EASE.expoOut),
  r: seg(t, at, at + 5 * STEP, 6, 0, EASE.cubicOut),
  o: t < at ? 0 : 1,
});
const pop = (t: number, at: number) => steps(t, at, STEPS.pop, 0);

/* 1. print_opener — a year, a place, the start of the story ----------------------- */
export const PrintOpener: React.FC<R> = ({ s, t, dur }) => {
  const prints = s.prints ?? [];
  const [b0, b1] = s.big_at ?? [0.4, 1.15];
  const big = s.big ?? "";
  const cps = Math.max(1, Array.from(big).length / Math.max(0.2, b1 - b0));
  const [tr0, tr1] = s.travel ?? [0.85, 1.75];

  const A = { x: -380, y: 70, w: 900, r: -2.5 }; // first print (big)
  const B = { x: -20, y: -235, w: 440, r: 4 }; // second print (small)
  const target = (s.dive_to ?? "b") === "a" ? A : B;

  const camX0 = 360;
  const camX1 = -200;
  let x = kf(t, [[0, camX0], [tr0, camX0], [tr1, camX1, EASE.cubicInOut]]);
  let y = kf(t, [[0, -40], [tr0, -40], [tr1, -10, EASE.cubicInOut]]);
  let z = enterZoom(t, dur, 0.9);
  let blur = 0;
  if (s.exit === "dive") {
    const d = dive(t, dur);
    x += (target.x - x) * d;
    y += (target.y - y) * d;
    z *= Math.exp(Math.log((1920 / target.w) * 1.12) * d);
    blur = 22 * d;
  }

  const pa = prints[0] && slideIn(t, prints[0].at ?? 0.95, -620, 60);
  const pbAt = prints[1]?.at ?? 1.95;
  const pb = pop(t, pbAt);

  return (
    <Camera x={x} y={y} zoom={z} blur={blur}>
      <GridPaper />
      {/* kicker + big year (types on, red, on the table plane) */}
      <At x={700} y={-235} anchor={[1, 0.5]} o={t < (s.kicker_at ?? 0.12) ? 0 : 1}>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 92, color: P.ink, direction: "rtl" }}>{s.kicker}</div>
      </At>
      <At x={700} y={-20} anchor={[1, 0.5]}>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 300, lineHeight: 1, color: P.accent, direction: "ltr", whiteSpace: "nowrap" }}>
          {typed(big, t, b0, cps)}
        </div>
      </At>
      {prints[0] && pa && (
        <At x={A.x + pa.x} y={A.y + pa.y} r={A.r + pa.r} o={pa.o}>
          <PrintCard id={prints[0].image} w={A.w} caption={prints[0].caption} captionO={settle(t, prints[0].caption_at ?? 2)} />
        </At>
      )}
      {prints[1] && (
        <At x={B.x} y={B.y} r={B.r} s={pb} o={pb > 0 ? 1 : 0}>
          <PrintCard id={prints[1].image} w={B.w} caption={prints[1].caption} captionO={settle(t, prints[1].caption_at ?? 2.1)} />
        </At>
      )}
    </Camera>
  );
};

/* 2. photo_full — the photo is the frame; red boxes point at real parts ----------- */
const PW = 2592; // photo ground at 1.35x the frame, so the enter and drift never show an edge
const PH = 1458;
const LABEL = 62; // label text size in world px (the photo is 1.35x the frame)
const uv = (u: number, v: number) => ({ x: (u - 0.5) * PW, y: (v - 0.5) * PH });

export const PhotoFull: React.FC<R> = ({ s, t, dur }) => {
  const rest = s.zoom ?? 1;
  const push = s.push_to ? uv(s.push_to[0], s.push_to[1]) : { x: 0, y: 0 };
  // velocity-matched with the dive: starts wide, pushes in over 6 steps, then a slow push toward push_to
  const e = seg(t, 0, 6 * STEP, 0, 1, EASE.expoOut);
  const slow = seg(t, 6 * STEP, dur, 0, 1, EASE.sineInOut);
  const z = rest * Math.exp(Math.log(0.8) * (1 - e)) * Math.exp(Math.log(1.08) * slow);
  const x = push.x * 0.3 * slow;
  const y = push.y * 0.3 * slow;

  return (
    <Camera x={x} y={y} zoom={z}>
      <At x={0} y={0}>
        <div style={{ filter: "grayscale(1) contrast(1.05)" }}>
          <Photo id={s.image ?? ""} w={PW} h={PH} />
        </div>
      </At>
      {(s.labels ?? []).map((l, i) => {
        const p = uv(l.point[0], l.point[1]);
        // keep the box on screen at rest: the visible half-size of the frame in world units, minus the box width
        const visX = 960 / rest - 40;
        const visY = 540 / rest - 50;
        const boxW = Array.from(l.text).length * LABEL * 0.52 + LABEL * 0.84;
        const b0 = uv(l.box[0], l.box[1]);
        const b = { x: Math.min(visX, Math.max(-visX + boxW, b0.x)), y: Math.min(visY, Math.max(-visY, b0.y)) };
        const draw = seg(t, l.at, l.at + 3 * STEP, 0, 1, EASE.quadOut);
        const dot = pop(t, l.at);
        return (
          <React.Fragment key={i}>
            <svg style={{ position: "absolute", left: -PW / 2, top: -PH / 2, overflow: "visible" }} width={PW} height={PH}>
              <line
                x1={p.x + PW / 2} y1={p.y + PH / 2}
                x2={p.x + PW / 2 + (b.x - p.x) * draw} y2={p.y + PH / 2 + (b.y - p.y) * draw}
                stroke={P.accent} strokeWidth={4} strokeLinecap="round"
              />
              <circle cx={p.x + PW / 2} cy={p.y + PH / 2} r={9 * dot} fill={P.accent} />
            </svg>
            <At x={b.x} y={b.y} anchor={[1, 0.5]}>
              <RedBox text={l.text} t={t} at={l.at + 3 * STEP} size={LABEL} />
            </At>
          </React.Fragment>
        );
      })}
      {s.title && s.title_pos && (
        <At x={uv(s.title_pos[0], s.title_pos[1]).x} y={uv(s.title_pos[0], s.title_pos[1]).y} anchor={[1, 0.5]}>
          <RedBox text={s.title} t={t} at={s.title_at ?? 0.3} size={112} />
        </At>
      )}
      {s.caption && (
        <At x={uv(0.82, 0.82).x} y={uv(0.82, 0.82).y} anchor={[1, 0.5]}>
          <RedBox text={s.caption} t={t} at={0.6} size={36} white />
        </At>
      )}
    </Camera>
  );
};

/* 3. kinetic_paper — a turn of time, a short punch line --------------------------- */
export const KineticPaper: React.FC<R> = ({ s, t, dur }) => {
  const size = s.size ?? 170;
  const text = s.text ?? "";
  const widthGuess = Math.min(1500, Array.from(text).length * size * 0.42);
  return (
    <Camera x={0} y={0} zoom={enterZoom(t, dur, 0.9)}>
      <GridPaper />
      <At x={0} y={-30}>
        <WordsRise text={text} times={s.words ?? [0]} t={t} size={size} color={P.ink} />
      </At>
      <At x={0} y={size * 0.62}>
        <Underline width={widthGuess} t={t} at={s.underline_at ?? 0.6} seed={text} />
      </At>
    </Camera>
  );
};

/* 4. print_table — a list: the camera travels print to print, then pulls back ---- */
export const PrintTable: React.FC<R> = ({ s, t, dur }) => {
  const prints = s.prints ?? [];
  const pos = prints.map((_, i) => ({ x: -i * 800, y: i % 2 ? 45 : -25, r: i % 2 ? 2.5 : -2, w: 880 }));
  // camera: travel to each print on its arrival (cubic in-out, bell-shaped steps)
  let x = pos[0]?.x ?? 0;
  prints.forEach((p, i) => {
    if (i === 0) return;
    const at = p.at ?? i;
    x = seg(t, at - 0.1, at + 0.6, x, pos[i].x, EASE.cubicInOut);
  });
  let z = enterZoom(t, dur, 0.9);
  const [p0, p1] = s.pullback_at ?? [dur - 1, dur - 0.3];
  const mid = pos.length ? (pos[0].x + pos[pos.length - 1].x) / 2 : 0;
  const pb = seg(t, p0, p1, 0, 1, EASE.quadOut);
  x += (mid - x) * pb;
  z *= Math.exp(Math.log(0.66) * pb);

  return (
    <Camera x={x} y={10} zoom={z}>
      <GridPaper w={6000} h={3000} />
      {prints.map((p, i) => {
        const a = slideIn(t, p.at ?? i, -520, 80);
        return (
          <At key={i} x={pos[i].x + a.x} y={pos[i].y + a.y} r={pos[i].r + a.r} o={a.o} z={i}>
            <PrintCard id={p.image} w={pos[i].w} caption={p.caption} captionO={settle(t, p.caption_at ?? (p.at ?? i) + 0.4)} />
          </At>
        );
      })}
    </Camera>
  );
};

/* 5. print_line — the spoken line above a print ----------------------------------- */
export const PrintLine: React.FC<R> = ({ s, t, dur }) => {
  const pr = s.print;
  const rise = seg(t, 0, 5 * STEP, 520, 0, EASE.expoOut);
  return (
    <Camera x={0} y={0} zoom={enterZoom(t, dur, 0.92)}>
      <GridPaper />
      <At x={0} y={-345}>
        <WordsRise text={s.line ?? ""} times={s.words ?? [0]} t={t} size={92} color={P.ink} width={1650} />
      </At>
      {pr && (
        <At x={20} y={135 + rise} r={-1.5}>
          <PrintCard id={pr.image} w={820} caption={pr.caption} captionO={settle(t, pr.caption_at ?? 0.6)} />
        </At>
      )}
    </Camera>
  );
};

/* 6. print_pair — two sides, before and after, with a handwritten note ------------- */
export const PrintPair: React.FC<R> = ({ s, t, dur }) => {
  const prints = s.prints ?? [];
  const pos = [{ x: 400, y: -40, r: 2 }, { x: -400, y: 30, r: -2.5 }];
  const noteAt = s.note_at ?? 1.2;
  const reveal = seg(t, noteAt, noteAt + 0.8, 0, 100, EASE.cubicOut); // handwriting, right to left
  return (
    <Camera x={0} y={0} zoom={enterZoom(t, dur, 0.9)}>
      <GridPaper />
      {prints.slice(0, 2).map((p, i) => {
        const a = slideIn(t, p.at ?? i * 0.4, i === 0 ? 520 : -520, 60);
        return (
          <At key={i} x={pos[i].x + a.x} y={pos[i].y + a.y} r={pos[i].r + a.r} o={a.o}>
            <PrintCard id={p.image} w={760} caption={p.caption} captionO={settle(t, p.caption_at ?? (p.at ?? 0) + 0.4)} />
          </At>
        );
      })}
      {s.note && (
        <At x={0} y={370}>
          <div style={{ fontFamily: HAND, fontWeight: 700, fontSize: 96, color: P.accent, direction: "rtl", clipPath: `inset(0 0 0 ${100 - reveal}%)` }}>
            {s.note}
          </div>
        </At>
      )}
    </Camera>
  );
};

export const RECIPES: Record<SceneBeat["recipe"], React.FC<R>> = {
  print_opener: PrintOpener,
  photo_full: PhotoFull,
  kinetic_paper: KineticPaper,
  print_table: PrintTable,
  print_line: PrintLine,
  print_pair: PrintPair,
};
