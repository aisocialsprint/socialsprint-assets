"""SocialSprint Blog Visual Kit renderer (signed off 21 Nov 2026).

Usage:  python3 tools/kit.py spec.json OUTDIR
Renders every visual in the spec to OUTDIR and writes OUTDIR/manifest.json
(file, alt, insert_after_heading, kind). The cover is JPEG (LinkedIn/OG safe),
inline visuals are WebP. Templates: hero, bars, people, big_stat, framework,
checklist, quote, analyser.
"""
import json, os, re, sys, base64, io, math, glob
import cairosvg
from PIL import Image, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
BRAND = os.path.join(HERE, '..', 'brand')
BLUE, DARK, SLATE, MUTED = '#2563EB', '#0F172A', '#334155', '#64748B'
BLUE_L, BLUE_T, OFF = '#BFDBFE', '#EFF6FF', '#F8FAFC'
W = 1200

# ---------- config (update ANALYSER when Andrea rescans) ----------
ANALYSER = {"score": 73, "band": "Strong", "name": "Andrea Piras",
            "role": "Growth Marketing Lead at Pelion",
            "pillars": [["Profile", 19], ["Network", 19], ["Posts", 25], ["Best practices", 10]]}

# ---------- helpers ----------
WM = open(os.path.join(BRAND, 'wordmark_paths.svgfrag')).read()
def wordmark(x, y, w=130, white=False):
    h = w * 80 / 466
    p = WM.replace('var(--wmt,#00110b)', '#fff' if white else '#00110b').replace('var(--wmi,#2563EB)', '#fff' if white else BLUE)
    return f'<svg x="{x}" y="{y}" width="{w}" height="{h:.1f}" viewBox="18 207 466 80">{p}</svg>'

def _img_b64(path, fmt='WEBP', size=None):
    im = Image.open(path).convert('RGB')
    if size: im = im.resize((size, size), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, fmt, quality=90)
    return f'data:image/{fmt.lower()};base64,' + base64.b64encode(b.getvalue()).decode()
HEADSHOT = _img_b64(os.path.join(BRAND, 'headshot.png'))

def photo(cx, cy, r, uid, ring=None):
    s = f'<circle cx="{cx}" cy="{cy}" r="{r+3}" fill="{ring}"/>' if ring else ''
    return (s + f'<defs><clipPath id="c{uid}"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath></defs>'
            f'<image href="{HEADSHOT}" x="{cx-r}" y="{cy-r}" width="{2*r}" height="{2*r}" clip-path="url(#c{uid})"/>')

FONTS = {('P', 700): 'Poppins-Bold.ttf', ('P', 800): 'Poppins-ExtraBold.ttf', ('P', 900): 'Poppins-Black.ttf',
         ('I', 400): 'Inter-Regular.otf', ('I', 500): 'Inter-Medium.otf', ('I', 600): 'Inter-SemiBold.otf'}
_fc = {}
def font(fam, w, size):
    k = (fam, w, size)
    if k not in _fc:
        name = FONTS[(fam, w)]
        hits = glob.glob(os.path.expanduser(f'~/.fonts/{name}')) + glob.glob(f'/usr/share/fonts/**/{name}', recursive=True)
        assert hits, f'font missing: {name} (run setup)'
        _fc[k] = ImageFont.truetype(hits[0], size)
    return _fc[k]
def tw(text, fam, w, size): return font(fam, w, size).getlength(text)
def wrap(text, fam, w, size, maxw, maxlines):
    words, lines, cur = text.split(), [], ''
    for wd in words:
        t = (cur + ' ' + wd).strip()
        if tw(t, fam, w, size) <= maxw: cur = t
        else: lines.append(cur); cur = wd
    lines.append(cur)
    assert len(lines) <= maxlines, f'too long for {maxlines} lines at {size}px: {text}'
    return lines
def fit(text, fam, w, sizes, maxw, maxlines):
    for s in sizes:
        try: return s, wrap(text, fam, w, s, maxw, maxlines)
        except AssertionError: pass
    raise AssertionError(f'cannot fit: {text}')
def esc(t): return t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
def T(x, y, text, fam='I', w=400, size=20, fill=SLATE, anchor='start', ls=0, extra=''):
    ff = 'Poppins' if fam == 'P' else 'Inter'
    a = f' text-anchor="{anchor}"' if anchor != 'start' else ''
    l = f' letter-spacing="{ls}"' if ls else ''
    return f'<text x="{x}" y="{y}" font-family="{ff}" font-weight="{w}" font-size="{size}" fill="{fill}"{a}{l}{extra}>{esc(text)}</text>'
def lines(x, y, ls_, fam, w, size, fill, lh):
    return ''.join(T(x, y + i * lh, t, fam, w, size, fill) for i, t in enumerate(ls_))
def meta(x, y, text, fill=BLUE): return T(x, y, text.upper(), 'I', 600, 16, fill, ls=3)
def source(text, fill=MUTED, y=620): return T(64, y, text, 'I', 400, 16, fill)
def svg(h, body, bg):
    assert '—' not in body, 'em dash found'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {h}" width="{W}" height="{h}"><rect width="{W}" height="{h}" fill="{bg}"/>{body}</svg>'

def person(cx, mode, uid=''):
    head = f'<circle cx="{cx}" cy="372" r="22"/>'; body = f'<rect x="{cx-28}" y="404" width="56" height="106" rx="28"/>'
    solid = f'<g fill="#fff">{head}{body}</g>'
    ghost = f'<g fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="7 6" opacity=".75">{head}{body}</g>'
    if mode == 'solid': return solid
    if mode == 'ghost': return ghost
    frac = mode
    return (ghost + f'<defs><clipPath id="p{uid}"><rect x="{cx-28}" y="330" width="{56*frac:.1f}" height="200"/></clipPath></defs>'
            f'<g fill="#fff" clip-path="url(#p{uid})">{head}{body}</g>')

# ---------- templates ----------
def hero(v, title):
    """Insight hero 1200x630. v: value, label, metaphor: people|dots|split|none, plus params."""
    b = wordmark(64, 56, 150, white=True)
    size, tl = fit(title, 'P', 800, [50, 46, 42], 1070, 2)
    b += lines(64, 170, tl, 'P', 800, size, '#fff', size + 10)
    m = v.get('metaphor', 'people')
    if m == 'people':           # total figures, `gone` drawn as dashed outlines from the right
        total, gone = v.get('total', 10), v['gone']
        solid = total - gone
        for i in range(total):
            cx = 90 + 76 * i
            if i + 1 <= solid: mode = 'solid'
            elif i < solid: mode = solid - i
            else: mode = 'ghost'
            b += person(cx, mode, f'h{i}')
        b += '<line x1="56" y1="530" x2="830" y2="530" stroke="#fff" stroke-opacity=".3" stroke-width="2"/>'
    elif m == 'dots':           # n dots, k highlighted
        n, k = v['n'], v['k']; cols = 20 if n > 40 else 10; rows = math.ceil(n / cols)
        gap = min(38, 760 / cols); r = gap * .36
        for i in range(n):
            x = 76 + (i % cols) * gap; y = 330 + (i // cols) * gap
            b += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{"#fff" if i < k else "#fff"}" opacity="{1 if i < k else .3}"/>'
    elif m == 'split':          # one bar split at pct
        p = v['pct'] / 100; wid = 700
        b += f'<rect x="64" y="380" width="{wid}" height="80" rx="12" fill="#fff" opacity=".25"/>'
        b += f'<rect x="64" y="380" width="{wid*p:.1f}" height="80" rx="12" fill="#fff"/>'
    elif m == 'compare':        # [[label, value], ...] two or three bars, widths proportional
        mxv = max(r[1] for r in v['rows'])
        for i, (lab, val) in enumerate(v['rows']):
            y = 340 + i * 90; wv = 700 * val / mxv
            b += T(64, y - 10, lab, 'I', 600, 18, BLUE_L)
            b += f'<rect x="64" y="{y}" width="700" height="44" rx="22" fill="#fff" opacity=".2"/><rect x="64" y="{y}" width="{max(wv,44):.1f}" height="44" rx="22" fill="#fff"/>'
    elif m == 'gauge':          # semicircle meter filled to pct (quota, attainment, adoption)
        p = v['pct'] / 100; cx, cy, r = 400, 520, 200
        th = math.pi * (1 - p); ex, ey = cx + r * math.cos(th), cy - r * math.sin(th)
        b += f'<path d="M{cx-r} {cy} A{r} {r} 0 0 1 {cx+r} {cy}" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="40" stroke-linecap="round"/>'
        b += f'<path d="M{cx-r} {cy} A{r} {r} 0 0 1 {ex:.1f} {ey:.1f}" fill="none" stroke="#fff" stroke-width="40" stroke-linecap="round"/>'
        b += T(cx - r, cy + 50, '0%', 'I', 600, 16, BLUE_L, 'middle') + T(cx + r, cy + 50, v.get('end_label', '100%'), 'I', 600, 16, BLUE_L, 'middle')
    elif m == 'waffle':         # 10 x 10 grid, k of 100 filled
        k = round(v['pct'])
        for i in range(100):
            x = 64 + (i % 10) * 28; y = 270 + (i // 10) * 28
            b += f'<rect x="{x}" y="{y}" width="22" height="22" rx="4" fill="#fff" opacity="{1 if i < k else .22}"/>'
        if v.get('caption'): b += T(370, 410, v['caption'], 'I', 500, 20, BLUE_L)
    b += T(1140, 486, v['value'], 'P', 900, 150 if len(v['value']) <= 4 else 110, '#fff', 'end', -5)
    room = {'people': 310, 'compare': 360, 'split': 360, 'gauge': 500, 'waffle': 500}.get(m, 500)
    assert tw(v['label'], 'I', 500, 22) <= room, f"hero label too long for {m}: {v['label']}"
    b += T(1136, 530, v['label'], 'I', 500, 22, BLUE_L, 'end')
    return svg(630, b, BLUE)

def bars(v):
    rows = v['rows']; mx = v.get('max') or max(r[1] for r in rows) * 1.12; unit = v.get('unit', '%')
    b = meta(64, 80, v['meta'])
    size, hl = fit(v['headline'], 'P', 800, [36, 32], 1072, 1)
    b += T(64, 132, hl[0], 'P', 800, size, DARK)
    n = len(rows); step = min(100, 340 / n); y0 = 200 if n > 3 else 220
    lab_size = next(z for z in (22, 20, 18, 16, 15, 14) if all(tw(r[0], 'P', 700, z) <= 290 for r in rows) or z == 14)
    assert all(tw(r[0], 'P', 700, lab_size) <= 296 for r in rows), 'bar label too long'
    for i, row in enumerate(rows):
        lab, val = row[0], row[1]; disp = row[2] if len(row) > 2 else f'{val:g}{unit}'
        y = y0 + i * step; wv = 720 * val / mx; assert wv <= 720
        b += T(330, y + 29, lab, 'P', 700, lab_size, SLATE, 'end')
        b += f'<rect x="360" y="{y}" width="720" height="44" rx="22" fill="#F1F5F9"/>'
        hl = v.get('highlight', 'first')
        top = (i == 0) if hl == 'first' else (val == max(r[1] for r in rows)) if hl == 'max' else (lab == hl)
        b += f'<rect x="360" y="{y}" width="{max(wv,60):.1f}" height="44" rx="22" fill="{BLUE if top else BLUE_L}"/>'
        bw = max(wv, 60)
        if tw(disp, 'P', 800, 22) + 36 > bw:   # value does not fit inside the bar: put it just after
            b += T(360 + bw + 12, y + 30, disp, 'P', 800, 22, DARK)
        else:
            b += T(360 + bw - 18, y + 30, disp, 'P', 800, 22, '#fff' if top else DARK, 'end')
    if v.get('avg'):
        ax = 360 + 720 * v['avg']['value'] / mx; y1 = y0 + n * step - 10
        b += f'<line x1="{ax:.1f}" y1="{y0-14}" x2="{ax:.1f}" y2="{y1}" stroke="{DARK}" stroke-width="1.5" stroke-dasharray="6 6"/>'
        b += T(ax, y0 - 24, v['avg']['label'], 'I', 600, 16, SLATE, 'middle')
    if v.get('note'): b += T(360, min(560, y0 + n * step + 40), v['note'], 'I', 400, 20, SLATE)
    b += source(v['source']) + wordmark(1006, 603)
    return svg(675, b, '#fff')

def people(v):
    """10 figures; `count` highlighted (decimals allowed). Light background."""
    total, k = v.get('total', 10), v['count']
    b = meta(64, 80, v['meta'])
    size, hl = fit(v['headline'], 'P', 800, [36, 32], 1072, 2)
    b += lines(64, 132, hl, 'P', 800, size, DARK, size + 10)
    for i in range(total):
        cx = 150 + 100 * i
        f = 1 if i + 1 <= k else (k - i if i < k else 0)
        head = f'<circle cx="{cx}" cy="330" r="24"/>'; body = f'<rect x="{cx-34}" y="364" width="68" height="76" rx="34"/>'
        b += f'<g fill="{BLUE_L}">{head}{body}</g>'
        if f > 0:
            b += (f'<defs><clipPath id="q{i}"><rect x="{cx-34}" y="300" width="{68*f:.1f}" height="200"/></clipPath></defs>'
                  f'<g fill="{BLUE}" clip-path="url(#q{i})">{head}{body}</g>')
    split = 116 + 100 * k
    b += f'<path d="M116 470 v14 h{split-116:.0f} v-14" fill="none" stroke="{BLUE}" stroke-width="2.5"/>'
    b += T((116 + split) / 2, 522, v['in_label'], 'P', 700, 22, BLUE, 'middle')
    b += f'<path d="M{split:.0f} 470 v14 h{1084-split:.0f} v-14" fill="none" stroke="#94A3B8" stroke-width="2.5"/>'
    b += T((split + 1084) / 2, 522, v['out_label'], 'P', 700, 22, MUTED, 'middle')
    b += source(v['source']) + wordmark(1006, 603)
    return svg(675, b, BLUE_T)

def big_stat(v):
    b = meta(64, 80, v['meta'], BLUE_L)
    vs = 168 if len(v['value']) <= 8 else 130
    assert tw(v['value'], 'P', 900, vs) < 1080, 'value too wide'
    b += T(56, 310, v['value'], 'P', 900, vs, '#fff', ls=-4)
    _, sl = fit(v['line'], 'I', 400, [26], 1000, 2)
    b += lines(64, 380, sl, 'I', 400, 26, '#E2E8F0', 36)
    for i, c in enumerate(v.get('chips', [])[:4]):
        x = 64 + 266 * i
        b += f'<rect x="{x}" y="476" width="40" height="4" fill="{BLUE}"/>' + T(x, 514, c, 'P', 700, 22, '#fff')
    b += source(v['source'], '#94A3B8') + wordmark(986, 600, 150, white=True)
    return svg(675, b, DARK)

def framework(v):
    items = v['items']; assert 2 <= len(items) <= 4
    b = meta(64, 80, v['meta'])
    b += T(64, 132, v['headline'], 'P', 800, 36, DARK)
    pos = [(64, 180), (616, 180), (64, 384), (616, 384)]
    for i, it in enumerate(items):
        x, y = pos[i]; last = i == len(items) - 1
        b += f'<rect x="{x}" y="{y}" width="520" height="180" rx="8" fill="{OFF}" stroke="#E2E8F0"/>'
        b += f'<circle cx="{x+48}" cy="{y+52}" r="24" fill="{"#10B981" if last else BLUE}"/>'
        b += T(x + 48, y + 60, str(i + 1), 'P', 800, 22, '#fff', 'middle')
        _, tl = fit(it['title'], 'P', 700, [24, 21], 404, 1)
        b += T(x + 92, y + 61, tl[0], 'P', 700, 24 if tw(tl[0], 'P', 700, 24) <= 404 else 21, DARK)
        _, bl = fit(it['text'], 'I', 400, [19], 404, 2)
        b += lines(x + 92, y + 104, bl, 'I', 400, 19, SLATE, 30)
    b += source(v['source']) + wordmark(1006, 603)
    return svg(675, b, '#fff')

def checklist(v):
    items = v['items']; assert 3 <= len(items) <= 4
    b = meta(64, 80, v['meta'], '#7C3AED')
    b += T(64, 132, v['headline'], 'P', 800, 36, DARK)
    for i, (t, s) in enumerate(items):
        y = 190 + 96 * i
        b += f'<rect x="64" y="{y}" width="34" height="34" rx="6" fill="#fff" stroke="#7C3AED" stroke-width="2.5"/>'
        assert tw(t, 'P', 700, 24) < 1000 and tw(s, 'I', 400, 18) < 1000
        b += T(124, y + 25, t, 'P', 700, 24, DARK) + T(124, y + 55, s, 'I', 400, 18, MUTED)
    b += T(64, 620, v['cta'], 'P', 700, 20, '#7C3AED') + wordmark(1006, 603)
    return svg(675, b, '#F5F3FF')

def quote(v):
    """Emphasis card. Modes: person (named expert, initials only), org (a company or report),
    none (a key idea with no author). Text must be verbatim when attributed."""
    mode = v.get('mode', 'none')
    b = f'<rect x="64" y="64" width="8" height="420" fill="{BLUE}"/>'
    if mode == 'none':
        size, ql = fit(v['text'], 'P', 800, [52, 46, 42, 38, 34], 1000, 4)
        lh = size + 14; top = 300 - len(ql) * lh / 2
        b += meta(104, top - 30, v.get('meta', 'Key idea'))
        b += lines(104, top + size, ql, 'P', 800, size, DARK, lh)
    else:
        b += T(104, 170, '\u201c', 'P', 900, 150, BLUE_L)
        size, ql = fit(v['text'], 'P', 800, [40, 36, 32], 1000, 4)
        b += lines(104, 236, ql, 'P', 800, size, DARK, size + 14)
        if mode == 'person':
            initials = ''.join(p[0] for p in v['name'].split()[:2]).upper()
            b += f'<circle cx="148" cy="446" r="44" fill="{BLUE}"/>' + T(148, 460, initials, 'P', 800, 34, '#fff', 'middle')
            b += T(212, 440, v['name'], 'P', 700, 26, DARK) + T(212, 472, v.get('role', ''), 'I', 400, 19, MUTED)
        else:
            b += f'<rect x="104" y="430" width="40" height="4" fill="{BLUE}"/>'
            b += T(104, 470, v['name'], 'P', 700, 26, DARK) + T(104, 500, v.get('role', ''), 'I', 400, 19, MUTED)
    b += source(v['source']) + wordmark(1006, 603)
    return svg(675, b, BLUE_T)

def analyser():
    A = ANALYSER
    def card(x, y, w, h):
        return f'<rect x="{x}" y="{y+8}" width="{w}" height="{h}" rx="12" fill="#1E40AF" opacity=".55"/><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="#fff"/>'
    b = meta(64, 92, 'Free Profile Analyser', BLUE_L)
    b += lines(64, 158, ['Your LinkedIn', 'profile has a score.'], 'P', 800, 48, '#fff', 58)
    b += lines(64, 290, [f'Mine is {A["score"]}.', "What's yours?"], 'P', 800, 48, BLUE_L, 58)
    b += lines(64, 398, ['Get your free score and the first', 'thing to fix.'], 'I', 400, 20, '#fff', 29)
    b += f'<rect x="64" y="462" width="380" height="64" rx="32" fill="#fff"/>' + T(236, 502, 'Score my profile free', 'P', 700, 22, BLUE, 'middle') + f'<path d="M367 494 h20 m-7 -7 l7 7 l-7 7" fill="none" stroke="{BLUE}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
    b += T(64, 562, 'socialsprint.co/profile-analyzer', 'I', 400, 16, BLUE_L)
    b += card(660, 48, 490, 86) + photo(706, 91, 28, 'a') + T(750, 86, A['name'], 'P', 700, 20, DARK) + T(750, 110, A['role'], 'I', 400, 14, MUTED)
    b += card(660, 152, 230, 230) + T(680, 184, 'Overall score', 'P', 700, 15, DARK)
    th = math.pi * (1 - A['score'] / 100); ex, ey = 765 + 72 * math.cos(th), 304 - 72 * math.sin(th)
    b += '<path d="M693 304 A72 72 0 0 1 837 304" fill="none" stroke="#F1F5F9" stroke-width="14" stroke-linecap="round"/>'
    b += f'<path d="M693 304 A72 72 0 0 1 {ex:.1f} {ey:.1f}" fill="none" stroke="{BLUE}" stroke-width="14" stroke-linecap="round"/>'
    b += T(765, 304, str(A['score']), 'P', 900, 48, BLUE, 'middle', -2) + T(765, 330, '/ 100', 'I', 400, 15, MUTED, 'middle')
    b += f'<rect x="729" y="342" width="72" height="26" rx="13" fill="#fff" stroke="{BLUE_L}"/>' + T(765, 360, A['band'], 'P', 700, 13, BLUE, 'middle')
    b += card(906, 152, 244, 230) + T(926, 184, 'Score breakdown', 'P', 700, 15, DARK)
    for i, (l, val) in enumerate(A['pillars']):
        y = 214 + 44 * i
        b += T(926, y, l, 'I', 400, 14, SLATE) + T(1130, y, f'{val}/25', 'P', 700, 14, BLUE, 'end')
        b += f'<rect x="926" y="{y+10}" width="204" height="6" rx="3" fill="#F1F5F9"/><rect x="926" y="{y+10}" width="{204*val/25:.1f}" height="6" rx="3" fill="{BLUE}"/>'
    b += card(660, 400, 490, 128) + f'<rect x="660" y="400" width="5" height="128" fill="{BLUE}"/>'
    b += T(686, 432, 'One place you lose impact', 'I', 600, 14, BLUE)
    b += '<defs><filter id="bl" x="-10%" y="-80%" width="120%" height="260%"><feGaussianBlur stdDeviation="4"/></filter></defs>'
    b += '<g filter="url(#bl)"><rect x="686" y="448" width="400" height="14" rx="7" fill="#94A3B8"/><rect x="686" y="470" width="250" height="14" rx="7" fill="#94A3B8"/></g>'
    b += '<rect x="686" y="496" width="12" height="10" rx="2" fill="#64748B"/><path d="M688.5 496 v-3 a3.5 3.5 0 0 1 7 0 v3" fill="none" stroke="#64748B" stroke-width="2"/>'
    b += T(706, 506, '+3 more in the full report', 'I', 400, 14, MUTED)
    return svg(675, f'<g transform="translate(0,37)">{b}</g>', BLUE)

RENDER = {'bars': bars, 'people': people, 'big_stat': big_stat, 'framework': framework,
          'checklist': checklist, 'quote': quote}

def to_file(svg_text, path, fmt):
    png = cairosvg.svg2png(bytestring=svg_text.encode(), output_width=W * 2)
    im = Image.open(io.BytesIO(png)).convert('RGB')
    if fmt == 'JPEG': im = im.resize((W, im.height * W // im.width), Image.LANCZOS); im.save(path, 'JPEG', quality=86, optimize=True)
    else: im = im.resize((1800, im.height * 1800 // im.width), Image.LANCZOS); im.save(path, 'WEBP', quality=82, method=6)
    return os.path.getsize(path)

def build(spec, out):
    os.makedirs(out, exist_ok=True); man = []
    h = spec['hero']
    man.append({'kind': 'hero', 'metaphor': h.get('metaphor', 'people'), 'file': 'hero.jpg', 'alt': h['alt'], 'bytes': to_file(hero(h, spec['title']), f'{out}/hero.jpg', 'JPEG')})
    for i, v in enumerate(spec.get('visuals', []), 1):
        f = f'{i:02d}-{v["type"]}.webp'
        man.append({'kind': v['type'], 'file': f, 'alt': v['alt'], 'after_heading': v.get('after_heading'),
                    'bytes': to_file(RENDER[v['type']](v), f'{out}/{f}', 'WEBP')})
    if spec.get('analyser', True):
        man.append({'kind': 'analyser', 'file': 'zz-analyser.webp', 'link': 'https://socialsprint.co/profile-analyzer',
                    'alt': f"LinkedIn profile score of {ANALYSER['score']} out of 100. Score your own profile free with the SocialSprint Profile Analyser.",
                    'after_heading': '__END__', 'bytes': to_file(analyser(), f'{out}/zz-analyser.webp', 'WEBP')})
    json.dump(man, open(f'{out}/manifest.json', 'w'), indent=2)
    return man

if __name__ == '__main__':
    print(json.dumps(build(json.load(open(sys.argv[1])), sys.argv[2]), indent=2))
