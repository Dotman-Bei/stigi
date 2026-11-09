#!/usr/bin/env node
// Post-build fix for `.vercel/output` built on Windows, run before `vercel deploy --prebuilt --prod`.
//
// 1. Nitro links some route functions to `__server.func` with absolute junctions/symlinks, which a
//    prebuilt upload from Windows cannot carry: replace each with a real copy.
// 2. Nitro creates the `vercel.functionRules` functions (the agent-chat routes) as COPIES of
//    `__server.func`, and only afterwards does @agent-native/core's deploy step rewrite `import "yjs"`
//    to its bundled `_libs/yjs-runtime.mjs` and add the traced node_modules — in `__server.func` only.
//    The copies keep a bare `import "yjs"` and crash on Vercel (ERR_MODULE_NOT_FOUND 'yjs').
//    Re-sync every copied function from the processed `__server.func`, keeping its own .vc-config.json.
//
// Prints FIX_VERCEL_OUTPUT_OK when no symlink and no bare `yjs` import remains in any function.
import fs from "node:fs";
import path from "node:path";

const functionsDir = path.resolve(".vercel/output/functions");
const serverDir = path.join(functionsDir, "__server.func");
const BARE_YJS = /\b(?:from\s*|import\s*\(\s*|import\s*)(["'])yjs\1/;

function walk(dir, visit) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const stat = fs.lstatSync(full);
    visit(full, stat);
    if (!stat.isSymbolicLink() && stat.isDirectory()) walk(full, visit);
  }
}

function removeLink(link) {
  try {
    fs.unlinkSync(link);
  } catch {
    fs.rmdirSync(link);
  }
}

if (!fs.existsSync(serverDir)) {
  console.error(`FIX_VERCEL_OUTPUT_FAIL missing ${serverDir} (run the Vercel build first)`);
  process.exit(1);
}

// 1. Symlinks/junctions -> real copies.
const links = [];
walk(functionsDir, (full, stat) => {
  if (stat.isSymbolicLink()) links.push(full);
});
for (const link of links) {
  const target = path.resolve(path.dirname(link), fs.readlinkSync(link));
  removeLink(link);
  fs.cpSync(target, link, { recursive: true, dereference: true });
  console.log(`copied symlink ${path.relative(functionsDir, link)}`);
}

// 2. Re-sync Nitro's server copies (any .func other than __server.func that carries the server bundle).
const funcDirs = [];
walk(functionsDir, (full, stat) => {
  if (stat.isDirectory() && full.endsWith(".func") && full !== serverDir) funcDirs.push(full);
});
for (const funcDir of funcDirs) {
  if (!fs.existsSync(path.join(funcDir, "_chunks", "agent-native-core.mjs"))) continue;
  const configPath = path.join(funcDir, ".vc-config.json");
  const config = fs.existsSync(configPath) ? fs.readFileSync(configPath) : null;
  fs.rmSync(funcDir, { recursive: true, force: true });
  fs.cpSync(serverDir, funcDir, {
    recursive: true,
    dereference: true,
    filter: (src) => path.basename(src) !== ".vc-config.json",
  });
  if (config) fs.writeFileSync(configPath, config);
  else fs.copyFileSync(path.join(serverDir, ".vc-config.json"), configPath);
  console.log(`re-synced ${path.relative(functionsDir, funcDir)} from __server.func`);
}

// Verify.
const problems = [];
walk(functionsDir, (full, stat) => {
  if (stat.isSymbolicLink()) problems.push(`symlink left: ${path.relative(functionsDir, full)}`);
  else if (stat.isFile() && /\.m?js$/.test(full) && !full.includes(`${path.sep}node_modules${path.sep}`)) {
    if (BARE_YJS.test(fs.readFileSync(full, "utf8"))) problems.push(`bare yjs import: ${path.relative(functionsDir, full)}`);
  }
});
if (problems.length > 0) {
  for (const problem of problems) console.error(`- ${problem}`);
  console.error("FIX_VERCEL_OUTPUT_FAIL");
  process.exit(1);
}
console.log(`FIX_VERCEL_OUTPUT_OK symlinksReplaced=${links.length} functionsResynced=${funcDirs.length}`);
