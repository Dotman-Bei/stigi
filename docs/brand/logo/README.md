# Stigi logo kit

**Idea.** *Stigi* comes from *stigmergy*: coordination by leaving marks in a shared medium. The mark is a bold
**S** made of two round-ended strokes with a gap at the crossing — **two notes pulled together**. The upper half is
the darker olive, the lower half a lighter tone, so the two "notes" read as separate pieces that form one letter.
The round stroke ends rhyme with the round dots of the two **i**s in the wordmark. Flat shapes only: no gradients,
no stock imagery, no sticky-note / thought-bubble / spinner clichés.

## Files
| Use | File |
|---|---|
| Favicon (modern browsers, scalable) | `svg/favicon.svg` (olive tile, bone S) |
| Favicon (legacy, 16/32/48) | `favicon.ico` |
| PNG favicons | `png/favicon-16.png`, `-32`, `-48` |
| iOS home screen | `png/apple-touch-icon-180.png` (full-bleed square; iOS rounds it) |
| PWA / Android | `png/icon-192.png`, `png/icon-512.png`, `png/icon-maskable-512.png` |
| Mark, colour / ink / black / white | `svg/stigi-mark.svg`, `-ink`, `-black`, `-white` (+ `png/stigi-mark-512.png`, `-ink-512`, `-white-512`) |
| Logo lockup (mark + wordmark) | `svg/stigi-logo.svg`, `-ink`, `-black`, `-white` (+ `png/stigi-logo-1200.png`, `stigi-logo-white-1200.png`) |
| Wordmark only | `svg/stigi-wordmark.svg`, `-black`, `-white` (+ `png/stigi-wordmark-1200.png`) |
| Previews | `preview-sheet.png`, `preview-exports.png` |
| Regenerate | `source/build_logo.py` + `source/rasterize.cjs` |

## Colour
| Token | Hex | Use |
|---|---|---|
| Ink olive | `#38450f` | Primary mark, wordmark, favicon tile (8.7:1 on bone) |
| Mid olive | `#5a6537` | Lower half of the colour mark (5.3:1 on bone) |
| Bone | `#ecebe7` | Background; the S on the favicon tile and on dark |
| Black / white | `#111111` / `#ecebe7` | Single-colour and reversed versions |

Use the **colour** mark only on light backgrounds. On dark or busy backgrounds use the **white** version. On the
olive tile use the bone S (`favicon.svg`).

## Rules
- Minimum size: mark 16 px (use `favicon.svg` below 24 px, it has a tuned scale); lockup 96 px wide; wordmark 64 px wide.
- Clear space: at least the height of the S's stroke (about 1/5 of the mark height) on every side.
- Don't stretch, rotate, outline, add shadows or gradients, recolour the halves differently, or put the colour mark on dark.
- The lockup repeats the S and the word "stigi" on purpose (monogram + wordmark). Use the wordmark alone where the S is already nearby.

## HTML
```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="apple-touch-icon" href="/apple-touch-icon-180.png">
```

## Provenance and caveats
- The mark is original geometry (two elliptical arcs). The wordmark is outlined from **Host Grotesk** (SIL Open Font License 1.1,
  https://github.com/google/fonts/tree/main/ofl/hostgrotesk) with the two i-dots replaced by perfect circles; outlining is allowed by the OFL.
- No trademark search was run. Before commercial use, run a clearance search for "Stigi" and a split-S monogram in your jurisdiction.
