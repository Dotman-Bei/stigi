// Logged-out check of the public Clips share page (fresh context: no cookies, no storage).
import { chromium } from "playwright";
const URL_ = "https://clips.agent-native.com/share/xcUFzqFhqqei";
const br = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await br.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const resp = await page.goto(URL_, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(3000);
const info = await page.evaluate(() => {
  const v = document.querySelector("video");
  return { title: document.title, url: location.href, hasVideo: !!v, src: v && (v.currentSrc || v.src), duration: v && v.duration, ready: v && v.readyState, bodyHasLoginWall: /Welcome to Clips|Sign in or create your account/i.test(document.body.innerText), text: document.body.innerText.slice(0, 400) };
});
console.log("HTTP", resp.status(), JSON.stringify(info, null, 1));
await page.screenshot({ path: "qc/public-share.png" });
await br.close();
