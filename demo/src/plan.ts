// Turns capture markers + Kokoro timings into a timeline. Audio-first: each scene lasts at least as long
// as its narration; dead agent-wait stretches are played faster, the money-shot glide-in at 1x.
export const FPS = 30;

export type Marker = { name: string; t: number; [k: string]: unknown };
export type WordTiming = { text: string; start: number; end: number };
export type SceneTiming = { duration: number; text: string; words: WordTiming[] };
export type Timings = { voice: string; scenes: Record<string, SceneTiming> };
export type Seg = { from: number; to: number; rate: number };
export type ScenePlan = {
  id: string;
  kind: "title" | "video" | "outro";
  start: number; // frames on the final timeline
  frames: number;
  segs: Seg[]; // video scenes only (raw seconds)
  hold: number; // frames of frozen last frame appended after the segments
  narrations: { id: string; at: number }[]; // frame offsets inside the scene
};

const ORDER = ["T0", "S1", "S2", "S3", "S4", "S5", "S6", "O1"] as const;
const PAD = 0.9; // seconds of air after the last narrated word
const MIN_LEN: Record<string, number> = { T0: 4.5, O1: 4.5 };
const NARR_IDS: Record<string, string[]> = { S3: ["S3a", "S3b"] };
const NARRATION_DELAY = 0.35;

export function buildPlan(markers: Marker[], timings: Timings): { scenes: ScenePlan[]; total: number } {
  const m = (name: string, fallback?: number): number => {
    const found = markers.find((x) => x.name === name);
    if (found) return found.t;
    if (fallback !== undefined) return fallback;
    throw new Error(`marker ${name} missing`);
  };
  const raw = (id: string): Seg[][] => {
    // [slowBefore, fast, slowAfter] raw-second ranges, rate filled in later
    switch (id) {
      case "S1": return [[{ from: m("S1_start"), to: m("S1_end"), rate: 1 }]];
      case "S2": return [[{ from: m("S2_start"), to: m("S2_end"), rate: 1 }]];
      case "S3": {
        const drag2 = m("drag2_done");
        const glide = Math.max(drag2, m("glide_start", m("teach_idle") - 6) - 1.5);
        return [[{ from: m("S3_start"), to: drag2, rate: 1 }], [{ from: drag2, to: glide, rate: 1 }], [{ from: glide, to: m("S3_end"), rate: 1 }]];
      }
      case "S4": {
        const a = m("sort_clicked") + 2;
        const b = Math.max(a, m("sort_done") - 3);
        return [[{ from: m("S4_start"), to: a, rate: 1 }], [{ from: a, to: b, rate: 1 }], [{ from: b, to: m("S4_end"), rate: 1 }]];
      }
      case "S5": {
        const a = m("report_running") + 1;
        const b = Math.max(a, m("report_done") - 2.5);
        return [[{ from: m("S5_start"), to: a, rate: 1 }], [{ from: a, to: b, rate: 1 }], [{ from: b, to: m("S5_end"), rate: 1 }]];
      }
      case "S6": return [[{ from: m("S6_start"), to: m("S6_end"), rate: 1 }]];
      default: return [];
    }
  };

  // frame offset, inside the scene, of a raw-video second (segments play at their own rates)
  const sceneTime = (segs: Seg[], rawT: number): number => {
    let off = 0;
    for (const s of segs) {
      if (rawT >= s.from && rawT <= s.to) return Math.round(off + ((rawT - s.from) / s.rate) * FPS);
      off += ((s.to - s.from) / s.rate) * FPS;
    }
    return Math.round(off);
  };
  const dur = (id: string) => timings.scenes[id]?.duration ?? 3;

  const scenes: ScenePlan[] = [];
  let cursor = 0;
  for (const id of ORDER) {
    const narr = (NARR_IDS[id] ?? [id]).reduce((n, k) => n + dur(k), 0);
    const target = Math.max(narr + NARRATION_DELAY + PAD, MIN_LEN[id] ?? 0);
    if (id === "T0" || id === "O1") {
      const frames = Math.round(target * FPS);
      scenes.push({ id, kind: id === "T0" ? "title" : "outro", start: cursor, frames, segs: [], hold: 0, narrations: [{ id, at: Math.round(NARRATION_DELAY * FPS) }] });
      cursor += frames;
      continue;
    }
    const groups = raw(id);
    let segs: Seg[];
    if (groups.length === 3) {
      const base = (groups[0][0].to - groups[0][0].from) + (groups[2][0].to - groups[2][0].from);
      const fastLen = groups[1][0].to - groups[1][0].from;
      const room = Math.max(target - base, fastLen / 6);
      const rate = fastLen <= 0.05 ? 1 : Math.min(6, Math.max(1, fastLen / room));
      segs = [groups[0][0], { ...groups[1][0], rate }, groups[2][0]].filter((s) => s.to - s.from > 0.04);
    } else {
      segs = groups[0];
    }
    const segFrames = segs.reduce((n, s) => n + Math.round(((s.to - s.from) / s.rate) * FPS), 0);
    let narrations = [{ id, at: Math.round(NARRATION_DELAY * FPS) }];
    if (id === "S3") {
      // the first clip rides the first drag, the second rides the glide-in; never overlapping
      const a = Math.max(Math.round(NARRATION_DELAY * FPS), sceneTime(segs, m("drag1_done") - 5.5));
      const bAnchor = sceneTime(segs, m("glide_start", m("teach_idle") - 6) - 1.0);
      const b = Math.max(bAnchor, a + Math.round((dur("S3a") + 0.4) * FPS));
      narrations = [{ id: "S3a", at: a }, { id: "S3b", at: b }];
    }
    const lastNarr = narrations[narrations.length - 1];
    const narrEnd = lastNarr.at + Math.round((dur(lastNarr.id) + PAD) * FPS);
    const frames = Math.max(segFrames, Math.round(target * FPS), narrEnd);
    scenes.push({ id, kind: "video", start: cursor, frames, segs, hold: frames - segFrames, narrations });
    cursor += frames;
  }
  return { scenes, total: cursor };
}
