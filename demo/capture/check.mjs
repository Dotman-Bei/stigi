import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const br = await chromium.launch({ headless: true });
const ctx = await br.newContext({ storageState: path.join(HERE, "auth.json"), viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
await page.goto("https://stigi.suitz.xyz/board", { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const info = await page.evaluate(() => ({
  url: location.pathname,
  heading: document.querySelector("h1")?.textContent,
  load: [...document.querySelectorAll("button")].some((b) => /Load sample data/.test(b.textContent)),
  notes: document.querySelectorAll("[data-note-id]").length,
  turns: (document.body.innerText.match(/\d+ of \d+ agent turns left today/) || [null])[0],
  who: (document.body.innerText.match(/[\w.+-]+@example\.[a-z]+/) || [null])[0],
}));
console.log(JSON.stringify(info));
await ctx.close(); await br.close();
