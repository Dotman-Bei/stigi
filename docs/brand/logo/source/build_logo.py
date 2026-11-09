"""Stigi logo generator. Mark = a trail of marks gathering into one cluster (stigmergy).
Wordmark = Host Grotesk (SIL OFL) outlines, dotless i + the mark's circles as i-dots."""
import math, os, json
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen

OUT = "out"
os.makedirs(OUT, exist_ok=True)
INK, MID, LIGHT, BONE, BLACK = "#38450f", "#5a6537", "#8d9866", "#ecebe7", "#111111"

# ---------------------------------------------------------------- the mark (64 x 64 grid)
R_S, W_S, GAP_DEG = 11.2, 10.5, 40.0
RX_S = 13.6                                 # slightly wider than tall arcs -> a broader, calmer S          # split S: centre-line radius, stroke, gap at the crossing

def _pt(c, R, deg):
    return (c[0] + RX_S*math.cos(math.radians(deg)), c[1] + R*math.sin(math.radians(deg)))

def split_s_geometry():
    c1, c2 = (32.0, 32.0 - R_S), (32.0, 32.0 + R_S)
    a, b = _pt(c1, R_S, -30), _pt(c1, R_S, -270 + GAP_DEG)      # upper half (counter-clockwise on screen)
    d, e = _pt(c2, R_S, -90 + GAP_DEG), _pt(c2, R_S, 150)       # lower half (clockwise on screen)
    up = f"M{a[0]:.2f} {a[1]:.2f}A{RX_S} {R_S} 0 1 0 {b[0]:.2f} {b[1]:.2f}"
    lo = f"M{d[0]:.2f} {d[1]:.2f}A{RX_S} {R_S} 0 1 1 {e[0]:.2f} {e[1]:.2f}"
    pts = []
    for i in range(0, 241):
        pts.append(_pt(c1, R_S, -30 + (-240 + GAP_DEG) * i/240))
        pts.append(_pt(c2, R_S, -90 + GAP_DEG + (240 - GAP_DEG) * i/240))
    x0 = min(p[0] for p in pts) - W_S/2; x1 = max(p[0] for p in pts) + W_S/2
    y0 = min(p[1] for p in pts) - W_S/2; y1 = max(p[1] for p in pts) + W_S/2
    return up, lo, (x0, y0, x1, y1)

S_UP, S_LO, S_BOX = split_s_geometry()

def split_s(fill_top, fill_bottom=None):
    fill_bottom = fill_bottom or fill_top
    st = f'fill="none" stroke-width="{W_S}" stroke-linecap="round"'
    return f'<path d="{S_UP}" {st} stroke="{fill_top}"/><path d="{S_LO}" {st} stroke="{fill_bottom}"/>'

def svg(w, h, body, vb=None, title="Stigi"):
    vb = vb or f"0 0 {w} {h}"
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{w}" height="{h}" role="img" '
            f'aria-label="{title}"><title>{title}</title>{body}</svg>' + chr(10))

def write(name, content):
    with open(os.path.join(OUT, name), "w", encoding="utf-8", newline=chr(10)) as f:
        f.write(content)

def centred_mark(fill_top, fill_bottom=None, scale=1.0):
    x0, y0, x1, y1 = S_BOX
    cx, cy = (x0+x1)/2, (y0+y1)/2
    return f'<g transform="translate(32 32) scale({scale}) translate({-cx:.2f} {-cy:.2f})">{split_s(fill_top, fill_bottom)}</g>'

variants = {                # name -> (upper half, lower half)
    "": (INK, MID),         # colour: two flat olive tones (no gradients)
    "-ink": (INK, INK), "-black": (BLACK, BLACK), "-white": (BONE, BONE),
}
for suf, (t, bt) in variants.items():
    write(f"stigi-mark{suf}.svg", svg(64, 64, centred_mark(t, bt, 1.0), title="Stigi mark"))

# favicon / app icon: filled olive tile, bone S (highest contrast at 16 px)
fav_scale = 0.78
write("favicon.svg", svg(64, 64, f'<rect width="64" height="64" rx="14" fill="{INK}"/>' + centred_mark(BONE, BONE, fav_scale), title="Stigi"))
write("favicon-square.svg", svg(64, 64, f'<rect width="64" height="64" fill="{INK}"/>' + centred_mark(BONE, BONE, fav_scale), title="Stigi"))

# ---------------------------------------------------------------- the wordmark
font = TTFont("hg.ttf")
inst = instantiateVariableFont(font, {"wght": 640})
gs = inst.getGlyphSet(); cmap = inst.getBestCmap(); upm = inst["head"].unitsPerEm
TRACK = -6

def glyph_path(ch, dx):
    pen = SVGPathPen(gs, ntos=lambda v: f"{v:.1f}".rstrip("0").rstrip("."))
    gs[cmap[ord(ch)]].draw(TransformPen(pen, (1, 0, 0, -1, dx, 0)))
    return pen.getCommands(), gs[cmap[ord(ch)]].width

def i_dot_circle(dx):
    rec = DecomposingRecordingPen(gs); gs[cmap[ord("i")]].draw(rec)
    contours, cur = [], []
    for op, args in rec.value:
        cur.append((op, args))
        if op in ("closePath", "endPath"):
            contours.append(cur); cur = []
    def bounds(c):
        bp = BoundsPen(gs)
        for op, args in c: getattr(bp, op)(*args)
        return bp.bounds
    dot = max(contours, key=lambda c: bounds(c)[1])
    x0, y0, x1, y1 = bounds(dot)
    return dx + (x0+x1)/2, -(y0+y1)/2, max(x1-x0, y1-y0)/2 * 1.06

x = 0; parts = []; i_dots = []
for ch in "stigi":
    glyph = "ı" if ch == "i" else ch
    d, adv = glyph_path(glyph, x)
    parts.append(d)
    if ch == "i": i_dots.append(i_dot_circle(x))
    x += adv + TRACK
word_w = x - TRACK
# vertical extent
bp = BoundsPen(gs); ext_y0, ext_y1 = 1e9, -1e9
for ch in "stgı":
    b = BoundsPen(gs); gs[cmap[ord(ch)]].draw(b); ext_y0 = min(ext_y0, b.bounds[1]); ext_y1 = max(ext_y1, b.bounds[3])
for cx, cy, r in i_dots: ext_y1 = max(ext_y1, -cy + r)
xh = BoundsPen(gs); gs[cmap[ord("s")]].draw(xh); x_height = xh.bounds[3]

def word_body(fill, dot_fill=None):
    dot_fill = dot_fill or fill
    paths = f'<path fill="{fill}" d="{"".join(parts)}"/>'
    dots = "".join(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="{dot_fill}"/>' for cx, cy, r in i_dots)
    return paths + dots

pad = 40
vb_word = (-pad, -ext_y1 - pad, word_w + 2*pad, ext_y1 - ext_y0 + 2*pad)
def word_svg(fill, bg=None):
    body = (f'<rect x="{vb_word[0]}" y="{vb_word[1]}" width="{vb_word[2]}" height="{vb_word[3]}" fill="{bg}"/>' if bg else "") + word_body(fill)
    return svg(round(vb_word[2]), round(vb_word[3]), body, vb=" ".join(f"{v:.1f}" for v in vb_word), title="Stigi")
write("stigi-wordmark.svg", word_svg(INK))
write("stigi-wordmark-white.svg", word_svg(BONE))
write("stigi-wordmark-black.svg", word_svg(BLACK))

# ---------------------------------------------------------------- lockup (mark + wordmark)
def lockup(top, bottom, word_fill, bg=None):
    x0, y0, x1, y1 = S_BOX
    scale = ext_y1 / (y1 - y0)                 # mark height = baseline -> top of the i-dots
    mark_w = (x1 - x0) * scale
    gap = x_height * 0.5
    tx = -(mark_w + gap) - x0*scale
    ty = -ext_y1 - y0*scale
    mark = f'<g transform="translate({tx:.1f} {ty:.1f}) scale({scale:.4f})">{split_s(top, bottom)}</g>'
    left = tx + x0*scale
    topy = min(ty + y0*scale, -ext_y1); bottomy = max(ty + y1*scale, -ext_y0)
    padl = 60
    vb = (left - padl, topy - padl, word_w - left + 2*padl, bottomy - topy + 2*padl)
    body = (f'<rect x="{vb[0]:.1f}" y="{vb[1]:.1f}" width="{vb[2]:.1f}" height="{vb[3]:.1f}" fill="{bg}"/>' if bg else "")
    body += mark + word_body(word_fill)
    return svg(round(vb[2]), round(vb[3]), body, vb=" ".join(f"{v:.1f}" for v in vb), title="Stigi")

write("stigi-logo.svg", lockup(INK, MID, INK))
write("stigi-logo-ink.svg", lockup(INK, INK, INK))
write("stigi-logo-black.svg", lockup(BLACK, BLACK, BLACK))
write("stigi-logo-white.svg", lockup(BONE, BONE, BONE))
json.dump({"split_s": {"R": R_S, "stroke": W_S, "gap_deg": GAP_DEG, "box": S_BOX}, "x_height": x_height, "word_w": word_w}, open(os.path.join(OUT, "geometry.json"), "w"), indent=1)
print("built", sorted(os.listdir(OUT)))

