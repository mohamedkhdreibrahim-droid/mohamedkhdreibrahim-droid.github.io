import React from "react";
import { AbsoluteFill, CalculateMetadataFunction, Sequence, random, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { getStaticFiles } from "@remotion/studio";
import { z } from "zod";
import { Beats, EASE, FPS, H, STEP, TRANSITION_STEPS, W, sceneDurations, stepTime } from "./engine";
import { Finish } from "./pieces";
import { RECIPES } from "./recipes";

/* One beats.json = one video. The look never changes; the topic lives in the beat sheet.
   Images: public/collage/images/<id>.png   Voice: public/<vo>   SFX: public/collage/sfx/<file> */

export const beatsVideoSchema = z.object({
  // a beat sheet in public/, e.g. "collage/beats/radio.json" (see the collage skill's references/beats.md)
  beatsFile: z.string(),
});
type Props = { beatsFile: string; beats?: Beats };

// Reads the beat sheet before rendering, and sets the duration from it.
export const calculateBeatsMetadata: CalculateMetadataFunction<Props> = async ({ props }) => {
  const b: Beats = await (await fetch(staticFile(props.beatsFile))).json();
  const durs = sceneDurations(b);
  const total = b.duration ?? b.scenes[b.scenes.length - 1].start + durs[durs.length - 1];
  return { durationInFrames: Math.ceil(total * FPS), fps: FPS, width: W, height: H, props: { ...props, beats: b } };
};

const hasFile = (name: string) => getStaticFiles().some((f) => f.name === name);

/* Transitions: how scene B arrives over scene A ------------------------------------- */
const tornPolygon = (p: number, seed: string, lift = 0) => {
  const top = H * (1 - p) - lift;
  const pts: string[] = [`0px ${H + 50}px`];
  for (let x = 0; x <= W; x += 48) {
    const j = (random(`${seed}-${x}`) - 0.5) * 26 + Math.sin(x / 170) * 9;
    pts.push(`${x}px ${(top + j).toFixed(1)}px`);
  }
  pts.push(`${W}px ${H + 50}px`);
  return `polygon(${pts.join(",")})`;
};

const Arrive: React.FC<{ kind: "cut" | "torn" | "disc"; t: number; seed: string; children: React.ReactNode }> = ({ kind, t, seed, children }) => {
  const n = TRANSITION_STEPS[kind];
  if (kind === "cut" || t >= n * STEP) return <AbsoluteFill>{children}</AbsoluteFill>;
  // step-quantised progress, one drawing per step
  const k = Math.min(n, Math.floor(t / STEP + 1e-6) + 1) / n;
  if (kind === "torn") {
    // torn sheet rising from the bottom, cubic in-out, pale fibre rim and a soft shadow on A
    const p = EASE.cubicInOut(k) * 1.08;
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{ clipPath: tornPolygon(p, seed, 26), background: "rgba(0,0,0,0.22)", filter: "blur(6px)" }} />
        <AbsoluteFill style={{ clipPath: tornPolygon(p, seed, 5), background: "#F7F4EA" }} />
        <AbsoluteFill style={{ clipPath: tornPolygon(p, seed) }}>{children}</AbsoluteFill>
      </AbsoluteFill>
    );
  }
  // disc growing from outside the right edge, quad-out, with a shadow ring on A
  const cx = W * 1.2;
  const cy = H * 0.55;
  const r = 2600 * EASE.quadOut(k);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute", left: cx - r, top: cy - r, width: 2 * r, height: 2 * r, borderRadius: "50%",
          boxShadow: "0 0 50px 18px rgba(0,0,0,0.28)",
        }}
      />
      <AbsoluteFill style={{ clipPath: `circle(${r}px at ${cx}px ${cy}px)` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/* The video ------------------------------------------------------------------------- */
export const BeatsVideo: React.FC<Props> = ({ beats }) => {
  const frame = useCurrentFrame();
  if (!beats) return null;
  const durs = sceneDurations(beats);

  return (
    <AbsoluteFill style={{ backgroundColor: "#F4F3EF" }}>
      {beats.scenes.map((s, i) => {
        const Recipe = RECIPES[s.recipe];
        const next = beats.scenes[i + 1];
        const overlap = next ? TRANSITION_STEPS[next.transition ?? "cut"] * STEP : 0; // stay under the next arrival
        const from = Math.round(s.start * FPS);
        const len = Math.round((durs[i] + overlap) * FPS) + 1;
        return (
          <Sequence key={i} name={`SCENE_${i + 1}_${s.recipe}${s.name ? `_${s.name}` : ""}`} from={from} durationInFrames={len}>
            <SceneClock>
              {(t) => (
                <Arrive kind={s.transition ?? "cut"} t={t} seed={`${i}`}>
                  <AbsoluteFill style={{ backgroundColor: "#F4F3EF" }}>
                    <Recipe s={s} t={t} dur={durs[i]} />
                  </AbsoluteFill>
                </Arrive>
              )}
            </SceneClock>
          </Sequence>
        );
      })}

      {beats.vo && hasFile(beats.vo) ? <Audio name="AUDIO_VO" src={staticFile(beats.vo)} /> : null}
      {(beats.sfx ?? []).map((c, i) => {
        const file = `collage/sfx/${c.file}`;
        if (!hasFile(file)) return null; // a missing sound is skipped, so the video still renders
        return (
          <Sequence key={`sfx-${i}`} name={`SFX_${c.file}`} from={Math.round(c.at * FPS)}>
            <Audio src={staticFile(file)} volume={c.volume ?? 0.6} />
          </Sequence>
        );
      })}

      <Finish stepIndex={Math.floor(frame / 2)} />
    </AbsoluteFill>
  );
};

/** Gives the scene its own time in seconds, snapped to drawings on twos. */
const SceneClock: React.FC<{ children: (t: number) => React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  return <>{children(stepTime(f))}</>;
};

