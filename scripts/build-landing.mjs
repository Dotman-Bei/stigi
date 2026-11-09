import fs from "node:fs";
import path from "node:path";

import { LANDING_MODULE, LANDING_SOURCE, toLandingModule } from "./lib/landing-html.mjs";

const normalise = (text) => text.replace(/\r\n/g, "\n");
const expected = toLandingModule(normalise(fs.readFileSync(LANDING_SOURCE, "utf8")));

if (process.argv.includes("--check")) {
  const actual = fs.existsSync(LANDING_MODULE) ? normalise(fs.readFileSync(LANDING_MODULE, "utf8")) : "";
  if (actual !== expected) {
    console.error("LANDING_MODULE_STALE: run node scripts/build-landing.mjs after editing public/landing/index.html");
    process.exit(1);
  }
  console.log("LANDING_MODULE_OK");
} else {
  fs.mkdirSync(path.dirname(LANDING_MODULE), { recursive: true });
  fs.writeFileSync(LANDING_MODULE, expected);
  console.log("LANDING_MODULE_OK written");
}
