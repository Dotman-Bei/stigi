import { defineEventHandler } from "h3";

import { LANDING_HTML } from "../landing/landing-html.js";

// Public landing page (spec §18): static HTML built with docs/design/frontend.md, compiled by
// scripts/build-landing.mjs. Every other page still renders through the React Router SSR handler.
export default defineEventHandler(
  () =>
    new Response(LANDING_HTML, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=0, must-revalidate",
      },
    }),
);
