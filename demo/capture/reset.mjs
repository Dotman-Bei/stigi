// Resets the demo account's board through the app's own Reset board button (two clicks to confirm).
// Authorized by the builder for this demo account only (2026-11-10).
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const br = await chromium.launch({ headless: true });
const ctx = await br.newContext({ storageState: path.join(HERE, "auth.json"), viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
await page.goto("https://stigi.suitz.xyz/board", { waitUntil: "networkidle" });
const btn = page.getByRole("button", { name: /Reset board|Click again to reset/ });
await btn.click();
await page.getByRole("button", { name: "Click again to reset" }).click();
await page.getByRole("button", { name: "Load sample data (200 notes)" }).waitFor({ timeout: 30000 });
console.log("board reset: empty state with the Load sample data button");
await ctx.close(); await br.close();
