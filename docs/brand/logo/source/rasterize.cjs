const { chromium } = require('C:/dev/stigi/node_modules/@playwright/test');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const fs = require('node:fs');

// [svg, png, width, height]  (height 0 = keep the SVG's aspect ratio)
const jobs = [
  ['out/favicon.svg', 'out/png/favicon-16.png', 16, 16],
  ['out/favicon.svg', 'out/png/favicon-32.png', 32, 32],
  ['out/favicon.svg', 'out/png/favicon-48.png', 48, 48],
  ['out/favicon.svg', 'out/png/icon-192.png', 192, 192],
  ['out/favicon.svg', 'out/png/icon-512.png', 512, 512],
  ['out/favicon-square.svg', 'out/png/apple-touch-icon-180.png', 180, 180],
  ['out/favicon-square.svg', 'out/png/icon-maskable-512.png', 512, 512],
  ['out/stigi-mark.svg', 'out/png/stigi-mark-512.png', 512, 512],
  ['out/stigi-mark-ink.svg', 'out/png/stigi-mark-ink-512.png', 512, 512],
  ['out/stigi-mark-white.svg', 'out/png/stigi-mark-white-512.png', 512, 512],
  ['out/stigi-logo.svg', 'out/png/stigi-logo-1200.png', 1200, 0],
  ['out/stigi-logo-white.svg', 'out/png/stigi-logo-white-1200.png', 1200, 0],
  ['out/stigi-wordmark.svg', 'out/png/stigi-wordmark-1200.png', 1200, 0],
];

(async () => {
  fs.mkdirSync('out/png', { recursive: true });
  const b = await chromium.launch();
  for (const [svg, png, w, h] of jobs) {
    const url = pathToFileURL(path.resolve(svg)).href;
    const p = await b.newPage({ viewport: { width: w, height: h || 1400 }, deviceScaleFactor: 1 });
    const wrapper = path.resolve('out/_r.html');
    fs.writeFileSync(wrapper, `<!doctype html><style>html,body{margin:0;background:transparent}img{display:block}</style><img id="i" src="${url}" width="${w}" ${h ? `height="${h}"` : ''}>`);
    await p.goto(pathToFileURL(wrapper).href);
    await p.waitForFunction(() => document.getElementById('i').complete && document.getElementById('i').naturalWidth > 0);
    const box = await p.locator('#i').boundingBox();
    await p.screenshot({ path: png, omitBackground: true, clip: { x: 0, y: 0, width: Math.round(box.width), height: Math.round(box.height) } });
    await p.close();
  }
  fs.rmSync('out/_r.html', { force: true });
  await b.close();
  // favicon.ico = PNG-compressed 16 / 32 / 48
  const sizes = [16, 32, 48];
  const imgs = sizes.map((s) => fs.readFileSync(`out/png/favicon-${s}.png`));
  const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
  let offset = 6 + 16 * sizes.length; const entries = [];
  sizes.forEach((s, i) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(s, 0); e.writeUInt8(s, 1); e.writeUInt8(0, 2); e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(imgs[i].length, 8); e.writeUInt32LE(offset, 12);
    offset += imgs[i].length; entries.push(e);
  });
  fs.writeFileSync('out/favicon.ico', Buffer.concat([head, ...entries, ...imgs]));
  console.log('rasterized', jobs.length, 'pngs + favicon.ico');
})();
