// Stigi demo capture: drives the real app with Playwright and records it with page.screencast.
//
//   node capture/record.mjs --login    open a headed browser on the app; the builder signs in once (the
//                                       session is kept in capture/.profile, never in the repo)
//   node capture/record.mjs [--take N]  record the full demo; writes capture/raw/take-N/
//
// Cost guard: one take makes about 3-4 agent turns. Every agent wait fails fast if the agent does not start,
// so a stuck hand-off costs seconds, not minutes. Never run this without checking the take counter.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.STIGI_URL ?? "https://stigi.suitz.xyz";
const AUTH = path.join(HERE, "auth.json");
const args = process.argv.slice(2);
const takeArg = args.indexOf("--take");
const TAKE = takeArg >= 0 ? Number(args[takeArg + 1]) : 1;
const OUT = path.join(HERE, "raw", `take-${TAKE}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A visible cursor: screencast frames do not include the OS pointer.
const CURSOR_INIT = `
(() => {
  const add = () => {
    if (document.getElementById('__demo_cursor')) return;
    const c = document.createElement('div');
    c.id = '__demo_cursor';
    c.style.cssText = 'position:fixed;left:-50px;top:-50px;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;' +
      'background:rgba(56,69,15,.28);border:2px solid #38450f;z-index:2147483647;pointer-events:none;transition:transform .08s;';
    document.documentElement.appendChild(c);
    addEventListener('pointermove', (e) => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }, true);
    addEventListener('pointerdown', () => { c.style.transform = 'scale(.7)'; }, true);
    addEventListener('pointerup', () => { c.style.transform = 'scale(1)'; }, true);
  };
  if (document.readyState !== 'loading') add(); else addEventListener('DOMContentLoaded', add);
  new MutationObserver(add).observe(document, { childList: true });
})();
`;

// Privacy: the signed-in account's name and address must never be legible in the recording. The element is
// blurred in the capture only (the app and the data are untouched).
// DEMO_BLUR_TERMS (comma separated, e.g. the account's name) adds terms to blur; addresses are always blurred.
const EXTRA_TERMS = (process.env.DEMO_BLUR_TERMS ?? "").split(",").map((t) => t.trim()).filter(Boolean).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\\\$&"));
const BLUR_INIT = `
(() => {
  const RX = /${EXTRA_TERMS.length ? EXTRA_TERMS.join("|") + "|" : ""}@[a-z0-9-]+\.[a-z]{2,}/i;
  const sweep = () => {
    for (const el of document.querySelectorAll('aside *, nav *, header *, [class*="sidebar"] *, [class*="account"] *, [class*="user"] *')) {
      if (el.children.length === 0 && RX.test(el.textContent || '') && !el.closest('[data-note-id]') && !el.closest('textarea')) {
        el.style.filter = 'blur(7px)';
        const p = el.parentElement; if (p && p.children.length <= 3 && RX.test(p.textContent || '')) p.style.filter = 'blur(7px)';
      }
    }
  };
  setInterval(sweep, 400);
})();
`;

async function login() {
  // Session cookies do not survive a browser close, so snapshot the signed-in state while the window is open.
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();
  await page.goto(`${BASE}/`);
  console.log("Sign in (or sign up) as the demo account in the opened window and open the Feedback board.");
  let saved = false;
  const timer = setInterval(async () => {
    try {
      const url = new URL(page.url());
      if (url.pathname.startsWith("/board")) {
        await context.storageState({ path: AUTH });
        if (!saved) console.log("session saved to capture/auth.json (git-ignored); you can close the window");
        saved = true;
      }
    } catch { /* window closing */ }
  }, 2000);
  await new Promise((resolve) => browser.on("disconnected", resolve));
  clearInterval(timer);
}

async function record() {
  fs.mkdirSync(OUT, { recursive: true });
  const markers = [];
  let t0 = 0;
  const mark = (name, extra = {}) => {
    const t = (Date.now() - t0) / 1000;
    markers.push({ name, t: Number(t.toFixed(2)), ...extra });
    console.log(`[${t.toFixed(1)}s] ${name}`);
  };
  if (!fs.existsSync(AUTH)) throw new Error("capture/auth.json missing: run `node capture/record.mjs --login` first");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: AUTH,
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    acceptDownloads: true,
  });
  await context.addInitScript(CURSOR_INIT);
  await context.addInitScript(BLUR_INIT);
  await context.addInitScript(() => localStorage.setItem("stigi.autoTeach", "1"));
  const page = await context.newPage();
  let screencast = null;
  const finish = async (ok, why) => {
    markers.push({ name: ok ? "END" : "ABORT", t: Number(((Date.now() - t0) / 1000).toFixed(2)), why });
    if (screencast) await page.screencast.stop();
    await page.screenshot({ path: path.join(OUT, "last-frame.png") });
    fs.writeFileSync(path.join(OUT, "markers.json"), JSON.stringify(markers, null, 2));
    await context.close();
    await browser.close();
    console.log(ok ? "TAKE OK" : `TAKE ABORTED: ${why}`);
    process.exit(ok ? 0 : 2);
  };

  try {
    await page.goto(`${BASE}/board`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Feedback board" }).waitFor({ timeout: 20000 });
    // Preflight: a signed-in demo account, a pristine board (empty, or sample data loaded and untouched), enough turns.
    const loadBtn = page.getByRole("button", { name: "Load sample data (200 notes)" });
    const emptyBoard = await loadBtn.isVisible({ timeout: 6000 }).catch(() => false);
    if (!emptyBoard) {
      const notes = await page.locator("[data-note-id]").count();
      const agentMoved = await page.locator('[data-moved-by="agent"]').count();
      const untitled = await page.locator('section[data-cluster-name="Untitled"]').count();
      const chip = await page.getByText("Sample data · pre-sorted starting layout").isVisible().catch(() => false);
      if (notes !== 200 || !chip || agentMoved > 0 || untitled > 0) return finish(false, `board is not pristine (notes=${notes}, chip=${chip}, agentMoved=${agentMoved}, untitled=${untitled}): needs Reset board or a fresh demo account`);
      console.log("board is pristine with sample data already loaded: skipping the load click");
    }
    const turnsText = (await page.getByText(/\d+ of \d+ agent turns left today/).first().textContent()) ?? "";
    const left = Number(turnsText.match(/(\d+) of/)?.[1] ?? 0);
    if (left < 8) return finish(false, `only ${left} agent turns left`);
    console.log(`preflight ok: ${turnsText}; emptyBoard=${emptyBoard}`);

    const agentState = page.locator("[data-agent-state]");
    const waitIdle = async (label, timeout) => {
      const deadline = Date.now() + timeout;
      while (Date.now() < deadline) {
        if ((await agentState.getAttribute("data-agent-state")) === "idle") return;
        await sleep(400);
      }
      throw new Error(`${label}: agent still running after ${timeout} ms`);
    };
    const waitRunning = async (label, timeout) => {
      const deadline = Date.now() + timeout;
      while (Date.now() < deadline) {
        if ((await agentState.getAttribute("data-agent-state")) === "running") return;
        await sleep(300);
      }
      throw new Error(`${label}: the agent never started within ${timeout} ms (hand-off failed)`);
    };

    t0 = Date.now();
    screencast = await page.screencast.start({ path: path.join(OUT, "page.webm"), size: { width: 1920, height: 1080 }, quality: 100 });

    // ---- S1: load sample data
    mark("S1_start");
    await page.mouse.move(960, 540, { steps: 8 });
    await sleep(1800);
    if (emptyBoard) {
      const bb = await loadBtn.boundingBox();
      await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 25 });
      await sleep(500);
      await loadBtn.click();
      await page.locator("[data-note-id]").nth(199).waitFor({ timeout: 60000 });
    } else {
      // Sample data is already on the board: show the top bar (chip, counts) and sweep across the clusters.
      await page.locator(".stigi").evaluate((el) => { el.scrollTop = 0; });
      await page.mouse.move(700, 120, { steps: 30 });
      await sleep(1500);
      await page.mouse.move(1500, 420, { steps: 60 });
    }
    await page.getByText("Sample data · pre-sorted starting layout").waitFor();
    await sleep(2500);
    mark("S1_end");

    // Scroll only the note's own column list (page stays at the top, so the New cluster zone stays visible).
    const reveal = async (loc, behavior = "instant") => {
      await loc.evaluate((el, beh) => {
        document.querySelector(".stigi").scrollTo({ top: 0, behavior: "instant" });
        const list = el.closest(".stigi-column__notes");
        if (!list) return;
        const lr = list.getBoundingClientRect();
        const er = el.getBoundingClientRect();
        list.scrollTo({ top: list.scrollTop + (er.top - lr.top) - 90, behavior: beh });
      }, behavior);
      await sleep(behavior === "smooth" ? 1300 : 600);
    };

    // ---- S2: the scattered plan/billing notes
    mark("S2_start");
    const seed1 = page.locator("[data-note-id]", { hasText: "which plan am I even on?" }).first();
    const seed2 = page.locator("[data-note-id]", { hasText: "the billing page makes no sense" }).first();
    await reveal(seed2, "smooth");
    let b = await seed2.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 30 });
    await sleep(1800);
    await reveal(seed1, "smooth");
    b = await seed1.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 30 });
    await sleep(2000);
    mark("S2_end");

    // ---- S3: the money shot
    mark("S3_start");
    const zone = page.getByTestId("new-cluster-zone");
    const center = async (loc) => {
      const r = await loc.boundingBox();
      if (!r) throw new Error("drag: element not visible");
      return { x: r.x + r.width / 2, y: r.y + Math.min(r.height / 2, 60) };
    };
    const drag = async (source, target) => {
      await reveal(source); // the board stays at the top; only the note's own column list scrolls
      let cur = await center(source);
      await page.mouse.move(cur.x, cur.y, { steps: 20 });
      await sleep(600);
      await page.mouse.down();
      await page.mouse.move(cur.x + 14, cur.y + 14, { steps: 5 });
      cur = { x: cur.x + 14, y: cur.y + 14 };
      await sleep(300);
      const N = 70;
      for (let i = 1; i <= N; i++) {
        const t = await center(target); // follow the target: autoscroll shifts the board under the pointer
        const k = 1 / (N - i + 1);
        cur = { x: cur.x + (t.x - cur.x) * k, y: cur.y + (t.y - cur.y) * k };
        await page.mouse.move(cur.x, cur.y);
        await sleep(14);
      }
      await sleep(500);
      await page.mouse.up();
    };
    await drag(seed1, zone);
    mark("drag1_done");
    const untitled = page.locator('section[data-cluster-name="Untitled"]');
    await untitled.locator("[data-note-id]").first().waitFor({ timeout: 10000 });
    await sleep(1800);
    await drag(seed2, untitled);
    mark("drag2_done");
    await waitRunning("teach", 20000);
    mark("teach_running");
    {
      // Mark the first agent move into the taught cluster (the glide-in), then wait for the turn to end.
      const deadline = Date.now() + 90000;
      let glided = false;
      while (Date.now() < deadline) {
        if (!glided && (await page.locator('[data-moved-by="agent"]').count()) > 0) { mark("glide_start"); glided = true; }
        if ((await agentState.getAttribute("data-agent-state")) === "idle") break;
        await sleep(250);
      }
      if ((await agentState.getAttribute("data-agent-state")) !== "idle") throw new Error("teach: agent still running after 90000 ms");
    }
    mark("teach_idle");
    const clusterId = await page.locator("[data-note-id]", { hasText: "which plan am I even on?" }).first().getAttribute("data-cluster-id");
    const taught = page.locator(`section[data-cluster-id="${clusterId}"]`);
    await taught.scrollIntoViewIfNeeded();
    await sleep(500);
    const taughtName = await taught.getAttribute("data-cluster-name");
    const agentMoved = await taught.locator('[data-moved-by="agent"]').count();
    mark("teach_result", { taughtName, agentMoved });
    if (taughtName === "Untitled" || agentMoved < 6) throw new Error(`teach produced name=${taughtName}, agent-moved=${agentMoved}`);
    await sleep(4500);
    mark("S3_end");

    // ---- S4: Sort with agent, exactly one batch
    mark("S4_start");
    const sortBtn = page.getByRole("button", { name: "Sort with agent" });
    await sortBtn.scrollIntoViewIfNeeded();
    const before = Number((await page.getByText(/\d+ unsorted/).first().textContent()).match(/(\d+) unsorted/)[1]);
    b = await sortBtn.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 25 });
    await sleep(500);
    await sortBtn.click();
    mark("sort_clicked", { unsortedBefore: before });
    await waitRunning("sort", 20000);
    const stop = page.getByRole("button", { name: "Stop sorting" });
    const deadline = Date.now() + 90000;
    while (Date.now() < deadline) {
      const now = Number((await page.getByText(/\d+ unsorted/).first().textContent()).match(/(\d+) unsorted/)[1]);
      if (now < before) break;
      await sleep(500);
    }
    if (await stop.isVisible().catch(() => false)) await stop.click(); // one batch only
    await waitIdle("sort", 60000);
    const after = Number((await page.getByText(/\d+ unsorted/).first().textContent()).match(/(\d+) unsorted/)[1]);
    mark("sort_done", { unsortedAfter: after });
    if (after >= before) throw new Error(`sort moved nothing (${before} -> ${after})`);
    await sleep(3500);
    mark("S4_end");

    // ---- S5: report, write with agent, edit a line, export
    mark("S5_start");
    const reportBtn = page.getByRole("button", { name: "Report", exact: true });
    b = await reportBtn.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 25 });
    await sleep(400);
    await reportBtn.click();
    const pane = page.getByTestId("report-pane");
    await pane.waitFor({ timeout: 15000 });
    await sleep(1500);
    const writeBtn = pane.getByRole("button", { name: "Write with agent" });
    b = await writeBtn.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 25 });
    await sleep(400);
    await writeBtn.click();
    await waitRunning("report", 20000);
    mark("report_running");
    const editor = pane.getByRole("textbox", { name: "Report markdown" });
    const rdeadline = Date.now() + 120000;
    while (Date.now() < rdeadline) {
      if ((await editor.inputValue()).trim().length > 80) break;
      await sleep(600);
    }
    await waitIdle("report", 60000);
    if ((await editor.inputValue()).trim().length < 80) throw new Error("report is empty after the agent turn");
    mark("report_done");
    await sleep(2500);
    await editor.click();
    await page.keyboard.press("Control+End");
    await page.keyboard.type("\n\nNext step: fix plan and billing copy first.", { delay: 45 });
    await sleep(1200);
    const exportBtn = pane.getByRole("button", { name: "Export .md" });
    b = await exportBtn.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 25 });
    await sleep(400);
    const [download] = await Promise.all([page.waitForEvent("download", { timeout: 15000 }), exportBtn.click()]);
    mark("exported", { file: download.suggestedFilename() });
    await sleep(2500);
    mark("S5_end");

    // ---- S6: rest on the agent sidebar (it opened itself with the first hand-off)
    mark("S6_start");
    await sleep(5000);
    mark("S6_end");
    await finish(true);
  } catch (err) {
    console.error(err);
    await finish(false, String(err?.message ?? err));
  }
}

if (args.includes("--login")) await login();
else await record();
