import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio, Video } from "@remotion/media";
import { FPS, type ScenePlan, type Timings, type WordTiming } from "./plan";

export type DemoProps = { plan: { scenes: ScenePlan[]; total: number }; timings: Timings };

const OLIVE = "#38450f";
const BONE = "#ecebe7";
const FONT = '"Host Grotesk", "Segoe UI", system-ui, sans-serif';

const Title: React.FC<{ tagline: string }> = ({ tagline }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 14], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(f, [0, 20], [18, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: OLIVE, alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
      <div style={{ opacity: o, transform: `translateY(${y}px)`, textAlign: "center" }}>
        <Img src={staticFile("brand/stigi-logo-white.svg")} style={{ width: 760 }} />
        <div style={{ marginTop: 56, color: BONE, fontSize: 46, opacity: 0.92, maxWidth: 1200 }}>{tagline}</div>
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 14], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: BONE, alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
      <div style={{ opacity: o, textAlign: "center" }}>
        <Img src={staticFile("brand/stigi-wordmark.svg")} style={{ width: 640 }} />
        <div style={{ marginTop: 48, color: OLIVE, fontSize: 40, letterSpacing: 0.5 }}>stigi.suitz.xyz</div>
        <div style={{ marginTop: 14, color: "#5a6537", fontSize: 28 }}>Sample data only: 200 synthetic comments for a fictional expenses app</div>
      </div>
    </AbsoluteFill>
  );
};

const SampleChip: React.FC = () => (
  <div
    style={{
      position: "absolute", left: 40, bottom: 40, padding: "10px 20px", borderRadius: 999,
      background: "rgba(236,235,231,0.94)", color: OLIVE, border: `2px solid ${OLIVE}`,
      fontFamily: '"JetBrains Mono", Consolas, monospace', fontSize: 24,
    }}
  >
    Sample data · synthetic comments, fictional expenses app
  </div>
);

function chunkWords(words: WordTiming[]): WordTiming[][] {
  const lines: WordTiming[][] = [];
  let cur: WordTiming[] = [];
  for (const w of words) {
    cur.push(w);
    const text = cur.map((x) => x.text).join("");
    if (cur.length >= 9 || /[.!?]$/.test(w.text.trim()) || text.length > 52) { lines.push(cur); cur = []; }
  }
  if (cur.length) lines.push(cur);
  return lines;
}

const Captions: React.FC<{ words: WordTiming[]; delaySec: number }> = ({ words, delaySec }) => {
  const f = useCurrentFrame();
  const t = f / FPS - delaySec;
  const lines = chunkWords(words);
  const line = lines.find((l) => t >= l[0].start - 0.05 && t <= l[l.length - 1].end + 0.35);
  if (!line) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 96, display: "flex", justifyContent: "center", fontFamily: FONT }}>
      <div style={{ background: "rgba(17,17,17,0.82)", borderRadius: 18, padding: "16px 30px", fontSize: 42, color: BONE, maxWidth: 1500, textAlign: "center", lineHeight: 1.25 }}>
        {line.map((w, i) => {
          const active = t >= w.start && t <= w.end;
          return (
            <span key={i} style={{ color: active ? "#ffffff" : "rgba(236,235,231,0.72)", fontWeight: active ? 700 : 500 }}>
              {i > 0 && !/^[,.;:!?]/.test(w.text) ? " " : ""}{w.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const VideoScene: React.FC<{ scene: ScenePlan }> = ({ scene }) => {
  let offset = 0;
  const parts = scene.segs.map((s, i) => {
    const frames = Math.max(1, Math.round(((s.to - s.from) / s.rate) * FPS));
    const el = (
      <Sequence key={i} from={offset} durationInFrames={frames}>
        <Video src={staticFile("scenes/raw.mp4")} trimBefore={Math.round(s.from * FPS)} trimAfter={Math.round(s.to * FPS)} playbackRate={s.rate} muted style={{ width: 1920, height: 1080, objectFit: "cover" }} />
      </Sequence>
    );
    offset += frames;
    return el;
  });
  const last = scene.segs[scene.segs.length - 1];
  if (scene.hold > 0 && last) {
    const lastFrame = Math.max(0, Math.round(last.to * FPS) - 2);
    parts.push(
      <Sequence key="hold" from={offset} durationInFrames={scene.hold}>
        <Video src={staticFile("scenes/raw.mp4")} trimBefore={lastFrame} trimAfter={lastFrame + 2} playbackRate={0.0625} muted style={{ width: 1920, height: 1080, objectFit: "cover" }} />
      </Sequence>,
    );
  }
  return <AbsoluteFill style={{ background: "#111" }}>{parts}</AbsoluteFill>;
};

export const Demo: React.FC<DemoProps> = ({ plan, timings }) => (
  <AbsoluteFill style={{ background: "#111" }}>
    {plan.scenes.map((scene) => {
      return (
        <Sequence key={scene.id} from={scene.start} durationInFrames={scene.frames} name={scene.id}>
          {scene.kind === "title" ? <Title tagline="Teach the agent by dragging two notes." /> : scene.kind === "outro" ? <Outro /> : <VideoScene scene={scene} />}
          {scene.kind === "video" ? (
            // S1 opens on the empty board: the chip appears when the sample data has actually loaded (~4.6 s in)
            <Sequence from={scene.id === "S1" ? Math.round(4.6 * FPS) : 0}><SampleChip /></Sequence>
          ) : null}
          {scene.narrations.map((nr) => {
            const t = timings.scenes[nr.id];
            if (!t) return null;
            return (
              <React.Fragment key={nr.id}>
                <Sequence from={nr.at}><Audio src={staticFile(`audio/${nr.id}.wav`)} /></Sequence>
                {scene.kind === "video" ? (
                  <Sequence from={nr.at} durationInFrames={Math.round((t.duration + 0.5) * FPS)}><Captions words={t.words} delaySec={0} /></Sequence>
                ) : null}
              </React.Fragment>
            );
          })}
        </Sequence>
      );
    })}
  </AbsoluteFill>
);
