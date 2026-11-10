import React from "react";
import { Composition, staticFile } from "remotion";
import { Demo, type DemoProps } from "./Demo";
import { buildPlan, FPS, type Marker, type Timings } from "./plan";

export const Root: React.FC = () => (
  <Composition
    id="Demo"
    component={Demo}
    width={1920}
    height={1080}
    fps={FPS}
    durationInFrames={90 * FPS}
    defaultProps={{ plan: { scenes: [], total: 1 }, timings: { voice: "", scenes: {} } } as DemoProps}
    calculateMetadata={async () => {
      const [markers, timings] = await Promise.all([
        fetch(staticFile("markers.json")).then((r) => r.json() as Promise<Marker[]>),
        fetch(staticFile("audio/timings.json")).then((r) => r.json() as Promise<Timings>),
      ]);
      const plan = buildPlan(markers, timings);
      return { durationInFrames: plan.total, props: { plan, timings } };
    }}
  />
);
