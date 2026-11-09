import fs from "node:fs";

import { describe, expect, it } from "vitest";

const html = fs.readFileSync("public/landing/index.html", "utf8");
const text = html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ");
const imgs = html.match(/<img\b[^>]*>/g) ?? [];
const SHOTS = ["board-hero.jpg", "board-overview.jpg", "board-teach.jpg", "board-selection.jpg"];

describe("landing page", () => {
  it("declares the software kind and the dealt system", () => {
    expect(html).toMatch(/<html[^>]*\sdata-type="software"/);
    expect(html).toMatch(/<html[^>]*\sdata-page="stigi-landing"/);
    expect(html).toMatch(/<html[^>]*\sdata-radius="soft"/);
    expect(html).toMatch(/<html[^>]*\sdata-buttons="pill"/);
    expect(html).toMatch(/<html[^>]*\sdata-ground="sky"/);
    expect(html).toContain('<meta name="page-type" content="software">');
    expect(html).toContain('<meta name="site-kind" content="software">');
    expect(html).toContain("<title>Stigi: the feedback board for product teams</title>");
    expect(html).toContain("--p-bg: #ecebe7;");
    expect(html).toContain('--font-display: "Host Grotesk"');
    expect(html).toContain("family=Host+Grotesk");
    expect(html).toContain('href="/landing/assets/system.css"');
    expect(html).toContain('data-mark="ring"');
  });

  it("leads with the h1 and the one main action in nav, hero and close", () => {
    expect(html).toMatch(/<h1[^>]*>The feedback board for product teams<\/h1>/);
    const ctas = html.match(/<a\b[^>]*href="\/board"[^>]*>\s*Try Stigi\s*(<svg[\s\S]*?<\/svg>\s*)?<\/a>/g) ?? [];
    expect(ctas).toHaveLength(3);
    expect(html).toContain('class="hero hero--split"');
  });

  it("has every planned section in order", () => {
    const order = ["top", "how", "teach", "steps", "actions", "by-hand", "faq"].map((id) => html.indexOf(`id="${id}"`));
    expect(order.every((i) => i > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html).toContain('class="footer closing');
  });

  it("shows the product only as real screenshots of the running app", () => {
    const shots = imgs.filter((img) => img.includes('data-subject="screenshot"'));
    expect(shots).toHaveLength(4);
    for (const name of SHOTS) {
      expect(shots.some((img) => img.includes(`src="/landing/assets/shots/${name}"`))).toBe(true);
      const file = `public/landing/assets/shots/${name}`;
      expect(fs.existsSync(file), file).toBe(true);
      expect(fs.statSync(file).size, file).toBeGreaterThan(20_000);
    }
    for (const img of shots) expect(img).toContain('data-source="client"');
    // no drawn mock-ups of the app: no kit UI windows or fragments
    expect(html).not.toMatch(/class="ui[\s"]|data-ui=|data-ui-load=/);
  });

  it("is honest: no testimonials, logos, invented statistics or people", () => {
    expect(html).not.toMatch(/<blockquote|logo-row|customer-proof/i);
    // wording and figures are checked on the visible text (kit inline styles such as --ly-pos: 50% 58% are fine)
    expect(text).not.toMatch(/testimonial|trusted by|our customers|customers love|\b\d+(\.\d+)?\s?%/i);
    for (const img of imgs) {
      expect(img).toMatch(/\salt="[^"]+"/);
      expect(img).toMatch(/\sdata-source="[^"]+"/);
    }
    expect(imgs.filter((img) => img.includes('data-source="library-057"'))).toHaveLength(1);
    expect(imgs.filter((img) => /data-subject="(person|people|portrait|team|customer)"/.test(img))).toHaveLength(0);
  });

  it("credits the photograph and the fonts, and says the demo data is synthetic", () => {
    expect(html).toContain("Jan Kahánek");
    expect(html).toContain("CC0");
    expect(html).toContain("Wikimedia Commons");
    expect(html).toContain("SIL Open Font License");
    expect(text).toContain("200 synthetic sample comments for a fictional expenses app");
  });

  it("contains no violet", () => {
    expect(html.toLowerCase()).not.toMatch(/violet|lavender|#8b5cf6|#7c3aed|#a78bfa/);
  });
});
