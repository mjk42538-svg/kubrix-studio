# NOMOREEXCUSES — "Busy" Short. Stickman design system (black bg, dashed ground y=1350,
# glowing white protagonist pawn, gray NPC pawns, top karaoke captions, 1.5px-style white strokes).
# Usage: python3 render.py [stills t1,t2,...]  -> renders frames to ffmpeg (video only)
import cairo, json, math, sys, subprocess, random
W, H, FPS = 1080, 1920, 30
GROUND = 1350
D = json.load(open('work/timing.json'))
WORDS = D['words']; PH = D['phrases']; DUR = D['duration']
PS = [p['start'] for p in PH]
def ws(i): return WORDS[i]['s']
NF = int(math.ceil((DUR + 0.6) * FPS))

def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def spring(t, t0, k=7.0, w=10.0):
    x = t - t0
    if x <= 0: return 0.0
    return 1 - math.exp(-k * x) * math.cos(w * x)
def ease(t, t0, d=0.4):
    x = clamp((t - t0) / d); return 1 - (1 - x) ** 3
def lerp(a, b, x): return a + (b - a) * x

WHITE = (1, 1, 1); GRAY = (0.333, 0.333, 0.333); DIM = (0.2, 0.2, 0.2); YEL = (1.0, 0.86, 0.1); RED = (1, 0.25, 0.2)

def rgba(c, a): return (*c, a)

def pawn(cr, x, base, h, col, glow=False, a=1.0, sy=1.0, sx=1.0):
    if a <= 0.01: return
    cr.save(); cr.translate(x, base); cr.scale(sx, sy)
    w = h * 0.46; r = h * 0.17
    def path():
        cr.new_path()
        cr.move_to(-w / 2, 0)
        cr.curve_to(-w / 2, -h * 0.25, -w * 0.32, -h * 0.5, 0, -h * 0.6)
        cr.curve_to(w * 0.32, -h * 0.5, w / 2, -h * 0.25, w / 2, 0)
        cr.close_path()
        cr.new_sub_path(); cr.arc(0, -h * 0.6 - r * 0.85, r, 0, 2 * math.pi)
    if glow:
        for k in range(7, 0, -1):
            path(); cr.set_source_rgba(1, 1, 1, 0.035 * a); cr.set_line_width(k * 7); cr.stroke()
    path(); cr.set_source_rgba(*col, a); cr.fill()
    cr.restore()

def font(cr, size, bold=True, fam='Inter'):
    cr.select_font_face(fam, cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD if bold else cairo.FONT_WEIGHT_NORMAL)
    cr.set_font_size(size)

def text(cr, s, x, y, size, col=WHITE, a=1.0, fam='Inter', bold=True, outline=0, glow=False, anchor='c', scale=1.0):
    if a <= 0.01: return
    cr.save(); font(cr, size, bold, fam)
    ext = cr.text_extents(s)
    cr.translate(x, y); cr.scale(scale, scale)
    ox = -ext.x_bearing - ext.width / 2 if anchor == 'c' else (-ext.x_bearing if anchor == 'l' else -ext.x_bearing - ext.width)
    oy = -ext.y_bearing - ext.height / 2
    cr.move_to(ox, oy); cr.text_path(s)
    if glow:
        for k in (14, 9, 5):
            cr.set_source_rgba(*col, 0.07 * a); cr.set_line_width(k); cr.stroke_preserve()
    if outline:
        cr.set_source_rgba(0, 0, 0, a); cr.set_line_width(outline); cr.set_line_join(cairo.LINE_JOIN_ROUND); cr.stroke_preserve()
    cr.set_source_rgba(*col, a); cr.fill()
    cr.restore()
    return ext.width * scale

def rrect(cr, x, y, w, h, r):
    cr.new_path(); cr.arc(x + w - r, y + r, r, -math.pi / 2, 0); cr.arc(x + w - r, y + h - r, r, 0, math.pi / 2)
    cr.arc(x + r, y + h - r, r, math.pi / 2, math.pi); cr.arc(x + r, y + r, r, math.pi, 1.5 * math.pi); cr.close_path()

def stroke(cr, col=WHITE, a=1.0, lw=3.0, dash=None):
    cr.set_source_rgba(*col, a); cr.set_line_width(lw)
    cr.set_dash(dash or []); cr.stroke(); cr.set_dash([])

def calendar(cr, cx, cy, w, h, label, a=1.0, sub=None, scale_y=1.0, col=WHITE):
    cr.save(); cr.translate(cx, cy); cr.scale(1, max(0.001, scale_y))
    rrect(cr, -w / 2, -h / 2, w, h, 18); cr.set_source_rgba(0, 0, 0, a); cr.fill_preserve(); stroke(cr, col, a, 4)
    rrect(cr, -w / 2, -h / 2, w, h * 0.28, 18); cr.set_source_rgba(*col, a); cr.fill()
    for rx in (-w * 0.25, w * 0.25):
        cr.new_path(); cr.arc(rx, -h / 2, 10, 0, 2 * math.pi); cr.set_source_rgba(0, 0, 0, a); cr.fill()
    fs = min(h * 0.17, w * 0.8 / max(1, len(label)) * 1.45)
    text(cr, label, 0, -h / 2 + h * 0.14, fs, (0, 0, 0), a)
    if sub:
        cr.save(); font(cr, h * 0.32, True, 'Luckiest Guy'); sw = cr.text_extents(sub).width; cr.restore()
        fs2 = h * 0.32 * min(1.0, w * 0.86 / max(1, sw))
        text(cr, sub, 0, h * 0.14, fs2, col, a, fam='Luckiest Guy')
    cr.restore()

# ---------------- captions ----------------
KEY = {'busy', 'laziest', 'twelve', 'hours', 'fortyseven', 'six', 'exhausted', 'honest', 'moved', 'ugly', 'truth', 'hide', 'phone', 'twenty', 'minutes', 'ten', 'never', 'easy', 'fast', 'loud', 'all', 'day', 'failed', 'one', 'hard', 'ninety', 'another', 'room', 'year', 'ahead', 'twist', 'not', 'two', 'both', 'you', 'pick', 'tomorrow', 'avoiding', 'stay', 'lazy', 'smart', 'real', 'work'}
def norm(w): return ''.join(ch for ch in w.lower() if ch.isalpha())

def captions(cr, t):
    if t < 1.2: return
    k = max([i for i, s in enumerate(PS) if s - 0.12 <= t] or [-1])
    if k < 0: return
    p = PH[k]
    nxt = PS[k + 1] if k + 1 < len(PS) else DUR + 1
    if t > p['end'] + 0.9 and t < nxt - 0.12: return
    items = []
    for i in range(p['w0'], p['w1'] + 1):
        w = WORDS[i]['w'].strip('"“”')
        key = norm(w) in KEY
        items.append((i, w.upper() if key else w, key))
    # layout lines
    lines = []; cur = []; cw = 0
    for it in items:
        size = 92 if it[2] else 60
        font(cr, size, it[2]); wd = cr.text_extents(it[1]).x_advance + 22
        if cw + wd > 960 and cur: lines.append((cur, cw)); cur = []; cw = 0
        cur.append((it, size, wd)); cw += wd
    if cur: lines.append((cur, cw))
    y0 = 300 - (len(lines) - 1) * 55
    for li, (ln, lw) in enumerate(lines):
        x = 540 - lw / 2; y = y0 + li * 110
        for (i, s, key), size, wd in ln:
            st = ws(i)
            if t < st - 0.05: x += wd; continue
            pop = spring(t, st - 0.05, 9, 14)
            sc = 0.7 + 0.3 * pop
            speaking = WORDS[i]['s'] - 0.05 <= t <= WORDS[i]['e'] + 0.1
            col = WHITE if (key or speaking) else (0.78, 0.78, 0.78)
            if key and norm(s) in ('busy', 'laziest', 'avoiding', 'both', 'hard'): col = YEL
            text(cr, s, x + (wd - 22) / 2, y, size, col, clamp(pop * 1.4), bold=key or speaking, glow=key, scale=sc, outline=0)
            x += wd

def ground(cr, a=1.0):
    cr.new_path(); cr.move_to(0, GROUND); cr.line_to(W, GROUND)
    stroke(cr, (0.2, 0.2, 0.2), a, 3, [12, 12])

# ---------------- scenes ----------------
def shake(t, t0, amp=18, d=0.35):
    x = t - t0
    if x < 0 or x > d: return 0, 0
    f = (1 - x / d) * amp
    return f * math.sin(x * 90), f * math.cos(x * 77)


KEY -= {'you', 'all', 'not', 'real'}
ORANGE = (1.0, 0.55, 0.15)

def badge(cr, cx, cy, label, col, a=1.0, sc=1.0, sy=1.0, w=620, h=230):
    if a <= 0.01: return
    cr.save(); cr.translate(cx, cy); cr.scale(sc, sc * max(0.001, sy))
    rrect(cr, -w / 2, -h / 2, w, h, 40); cr.set_source_rgba(0, 0, 0, a); cr.fill_preserve(); stroke(cr, col, a, 8)
    text(cr, label, 0, 4, h * 0.62, col, a, fam='Luckiest Guy')
    cr.restore()

def busy_flip(cr, t, t_flip, cy=900):
    """BUSY badge that flips into LAZY at t_flip."""
    f = clamp((t - t_flip) / 0.3)
    sy = abs(math.cos(f * math.pi)) if 0 < f < 1 else 1.0
    lab, col = ('BUSY', YEL) if f < 0.5 else ('LAZY', RED)
    dx, dy = shake(t, t_flip + 0.15, 22, 0.45)
    badge(cr, 540 + dx, cy + dy, lab, col, 1, 1, sy)

def sweat(cr, x, y, t, a=1.0):
    for k in range(3):
        ph = (t * 1.6 + k / 3) % 1
        px = x + (k - 1) * 70; py = y + ph * 120
        cr.new_path(); cr.move_to(px, py - 18); cr.curve_to(px + 12, py, px + 10, py + 12, px, py + 12)
        cr.curve_to(px - 10, py + 12, px - 12, py, px, py - 18); cr.set_source_rgba(0.5, 0.75, 1, a * (1 - ph)); cr.fill()

def envelope(cr, x, y, s, col=WHITE, a=1.0):
    cr.save(); cr.translate(x, y); cr.scale(s, s)
    rrect(cr, -50, -34, 100, 68, 8); cr.set_source_rgba(0, 0, 0, a); cr.fill_preserve(); stroke(cr, col, a, 4 / max(s, .2))
    cr.new_path(); cr.move_to(-50, -30); cr.line_to(0, 8); cr.line_to(50, -30); stroke(cr, col, a, 4 / max(s, .2))
    cr.restore()

def phone(cr, x, y, s, a=1.0, ring=0.0, col=WHITE):
    cr.save(); cr.translate(x, y); cr.scale(s, s); cr.rotate(math.sin(ring * 60) * 0.2 * (ring > 0))
    rrect(cr, -40, -72, 80, 144, 14); cr.set_source_rgba(0, 0, 0, a); cr.fill_preserve(); stroke(cr, col, a, 5)
    cr.new_path(); cr.arc(0, 56, 6, 0, 2 * math.pi); cr.set_source_rgba(*col, a); cr.fill()
    cr.restore()

def clockface(cr, x, y, r, frac, col=WHITE, a=1.0, label=None):
    cr.new_path(); cr.arc(x, y, r, 0, 2 * math.pi); stroke(cr, col, a, 5)
    if frac > 0:
        cr.new_path(); cr.move_to(x, y); cr.arc(x, y, r - 10, -math.pi / 2, -math.pi / 2 + 2 * math.pi * frac); cr.close_path()
        cr.set_source_rgba(*col, a * 0.35); cr.fill()
    ang = -math.pi / 2 + 2 * math.pi * frac
    cr.new_path(); cr.move_to(x, y); cr.line_to(x + (r - 18) * math.cos(ang), y + (r - 18) * math.sin(ang)); stroke(cr, col, a, 6)
    if label: text(cr, label, x, y + r + 50, 44, col, a, fam='Luckiest Guy')

def bar(cr, x, y, w, h, frac, col=WHITE, a=1.0, fillcol=None):
    rrect(cr, x, y, w, h, h / 2); stroke(cr, col, a, 4)
    if frac > 0.002:
        rrect(cr, x + 7, y + 7, max(h - 14, (w - 14) * clamp(frac)), h - 14, (h - 14) / 2); cr.set_source_rgba(*(fillcol or col), a); cr.fill()

# ---------- A: hook (frame 0 = cover) ----------
def scene_A(cr, t):
    ca = 1 - ease(t, 1.05, 0.3)
    if ca > 0:
        text(cr, 'BEING BUSY', 540, 690, 150, WHITE, ca, fam='Luckiest Guy', outline=18)
        text(cr, 'IS LAZY', 540, 860, 190, YEL, ca, fam='Luckiest Guy', outline=18)
        pawn(cr, 540, GROUND, 300, GRAY, False, ca)
        sweat(cr, 540, 1000, t, ca)
    if t > 1.0:
        s = spring(t, 1.0, 8, 12)
        pawn(cr, 540, GROUND, 330 * s, GRAY)
        sweat(cr, 540, 1040, t)
        cr.save(); cr.translate(0, (1 - s) * -300)
        busy_flip(cr, t, ws(4) + 0.1, 800)
        cr.restore()
    if t > ws(10) - 0.1:  # "I know" — fades badge
        pass

# ---------- B: the busy day ----------
def scene_B(cr, t):
    sq = 1.0 - 0.28 * ease(t, ws(21), 0.5)  # exhausted squash
    pawn(cr, 540, GROUND, 330, GRAY, sy=sq, sx=1 + (1 - sq) * 0.5)
    if t > ws(21): sweat(cr, 540, GROUND - 330 * sq - 120, t)
    # 12 hours clock
    if t > ws(14) - 0.1:
        s = spring(t, ws(14) - 0.1, 8, 12)
        cr.save(); cr.translate(220, 700); cr.scale(max(s, 1e-3), max(s, 1e-3))
        clockface(cr, 0, 0, 110, (ease(t, ws(14), 1.0)) * 1.0, WHITE, 1, '12 HRS'); cr.restore()
    # 47 emails pile
    if t > ws(17) - 0.1:
        n = int(47 * ease(t, ws(17), 1.0))
        for i in range(min(n, 14)):
            envelope(cr, 540 + ((i * 37) % 60 - 30), 820 - i * 16, 1.1, WHITE if i == n - 1 else (0.75, 0.75, 0.75))
        text(cr, f'{n}', 540, 560, 110, YEL, 1, fam='Luckiest Guy', glow=True)
        text(cr, 'EMAILS', 540, 640, 36, (0.7, 0.7, 0.7))
    # 6 meetings
    if t > ws(19) - 0.1:
        for i in range(6):
            s = spring(t, ws(19) - 0.1 + i * 0.12, 9, 13)
            if s <= 0: continue
            cr.save(); cr.translate(860, 560 + i * 72); cr.scale(max(s, 1e-3), max(s, 1e-3))
            rrect(cr, -110, -28, 220, 56, 10); cr.set_source_rgb(0, 0, 0); cr.fill_preserve(); stroke(cr, WHITE, 1, 3)
            text(cr, f'MEETING {i + 1}', 0, 0, 28, WHITE); cr.restore()
    if t > ws(22):
        text(cr, 'EXHAUSTED', 540, 1500, 70, RED, ease(t, ws(22), 0.3), fam='Luckiest Guy')

# ---------- C: what moved? ----------
def scene_C(cr, t):
    pawn(cr, 300, GROUND, 300, GRAY)
    a = ease(t, PS[6], 0.3)
    text(cr, 'YOUR REAL GOAL', 540, 640, 46, (0.75, 0.75, 0.75), a)
    wig = 0.012 * (1 + math.sin(t * 9)) if t > ws(28) else 0
    bar(cr, 140, 700, 800, 90, wig + 0.002, WHITE, a, YEL)
    if t > ws(28) - 0.1:
        s = spring(t, ws(28) - 0.1, 8, 12)
        text(cr, '0%', 540, 940, 220, RED, clamp(s), fam='Luckiest Guy', scale=lerp(1.5, 1, clamp(s)), outline=10)
    if t > ws(26):
        text(cr, '?', 330, GROUND - 420, 120, WHITE, ease(t, ws(26), 0.3), fam='Luckiest Guy')

# ---------- D: busy is where smart people hide ----------
def scene_D(cr, t):
    if t < PS[9]:
        s = spring(t, PS[8] - 0.1, 8, 12)
        text(cr, 'THE UGLY TRUTH', 540, 760, 100, WHITE, clamp(s), fam='Luckiest Guy', outline=10, scale=lerp(1.3, 1, clamp(s)))
        pawn(cr, 540, GROUND, 300, GRAY)
        return
    # wall of tasks rises in front of the pawn; it ducks behind
    duck = ease(t, ws(38) - 0.1, 0.4)
    pawn(cr, 540, GROUND + duck * 140, 360, WHITE, True)
    rows = 6
    for r in range(rows):
        for c in range(5):
            st = PS[9] + (r * 5 + c) * 0.05
            s = spring(t, st, 9, 12)
            if s <= 0: continue
            x = 140 + c * 200; y = GROUND - 60 - r * 82
            yy = lerp(GROUND + 400, y, clamp(s))
            rrect(cr, x - 92, yy - 36, 184, 72, 10); cr.set_source_rgb(0.05, 0.05, 0.05); cr.fill_preserve(); stroke(cr, GRAY, 1, 3)
            lab = ['EMAIL', 'TASK', 'CALL', 'SLACK', 'TO-DO'][(r + c) % 5]
            text(cr, lab, x, yy, 28, (0.6, 0.6, 0.6))
    if t > ws(38) - 0.1:
        text(cr, 'HIDING', 540, 700, 120, YEL, ease(t, ws(38) - 0.1, 0.3), fam='Luckiest Guy', outline=10)

# ---------- E: phone interruption / focus meter ----------
def focus_val(t):
    # baseline focus; a ping at tp drops it to 0, then refills slowly
    pings = [ws(44)] + [ws(59) + i * 0.32 for i in range(10)]
    v = 1.0
    for tp in pings:
        if t >= tp:
            v = min(v, clamp((t - tp - 0.15) / 7.0)) if t - tp < 7.2 else v
    return v

def scene_E(cr, t):
    if t < PS[11]:
        # single ping: phone buzzes, brain meter drains, 20+ MIN to refill
        pawn(cr, 330, GROUND, 320, GRAY)
        ring = t - ws(44) if ws(44) <= t < ws(44) + 0.6 else 0
        phone(cr, 560, GROUND - 200, 1.1, 1, ring, YEL if ring else WHITE)
        if ring:
            for k in range(3):
                rr = ((t - ws(44)) * 3 + k / 3) % 1
                cr.new_path(); cr.arc(560, GROUND - 200, 80 + rr * 90, -0.8, 0.8); stroke(cr, YEL, 1 - rr, 4)
        a = ease(t, ws(46) - 0.2, 0.3)
        text(cr, 'FOCUS', 540, 560, 46, (0.75, 0.75, 0.75), a)
        drop = ease(t, ws(44), 0.25)
        refill = clamp((t - ws(51)) / 2.5) * 0.35 if t > ws(51) else 0
        bar(cr, 140, 610, 800, 80, max(0.0, 1 - drop) + refill, WHITE, a, YEL if refill else WHITE)
        if t > ws(50) - 0.1:
            s = spring(t, ws(50) - 0.1, 8, 12)
            cr.save(); cr.translate(820, 930); cr.scale(max(s, 1e-3), max(s, 1e-3))
            clockface(cr, 0, 0, 110, clamp((t - ws(50)) / 2.2) * 0.33, YEL, 1, '20+ MIN'); cr.restore()
        return
    # ten pings across a work day timeline
    a = 1.0
    text(cr, 'YOUR DAY', 540, 560, 46, (0.75, 0.75, 0.75), a)
    x0, x1, y = 120, 960, 700
    cr.new_path(); cr.move_to(x0, y); cr.line_to(x1, y); stroke(cr, WHITE, 1, 4)
    text(cr, '9 AM', x0, y + 50, 30, (0.6, 0.6, 0.6)); text(cr, '6 PM', x1, y + 50, 30, (0.6, 0.6, 0.6))
    for i in range(10):
        tp = ws(59) + i * 0.32
        if t < tp: continue
        s = spring(t, tp, 9, 14)
        x = x0 + 40 + i * (x1 - x0 - 80) / 9
        cr.save(); cr.translate(x, y - 70); cr.scale(max(s, 1e-3) * 0.45, max(s, 1e-3) * 0.45)
        phone(cr, 0, 0, 1, 1, 0, RED); cr.restore()
        cr.new_path(); cr.move_to(x, y - 20); cr.line_to(x, y + 20); stroke(cr, RED, 1, 5)
    # deep work counter
    if t > ws(65) - 0.1:
        s = spring(t, ws(65) - 0.1, 8, 12)
        text(cr, 'DEEP WORK', 540, 900, 60, WHITE, clamp(s))
        dx, dy = shake(t, ws(69), 20, 0.4)
        text(cr, '0 MIN', 540 + dx, 1060 + dy, 170, RED, clamp(s), fam='Luckiest Guy', outline=10)
    pawn(cr, 540, GROUND, 200, GRAY)

# ---------- F: easy stuff ----------
EASY = ['Reply to Dave', 'Rename files', 'Inbox zero', 'Tidy desk', 'Another email', 'Check Slack']
def scene_F(cr, t):
    x0, y0 = 150, 520
    for i, lab in enumerate(EASY):
        tc = PS[13] + 0.15 + i * 0.55
        s = spring(t, tc - 0.25, 9, 13)
        if s <= 0: continue
        y = y0 + i * 92
        rrect(cr, x0, y - 30, 60, 60, 10); stroke(cr, WHITE, clamp(s), 4)
        text(cr, lab, x0 + 90, y, 42, (0.8, 0.8, 0.8), clamp(s), bold=False, anchor='l')
        if t > tc:
            d = ease(t, tc, 0.15)
            cr.new_path(); cr.move_to(x0 + 12, y); cr.line_to(x0 + 26, y + 16); cr.line_to(x0 + 26 + 26 * d, y - 18 * d); stroke(cr, YEL, 1, 7)
    # big shout words
    for i0, lab in ((76, 'FAST.'), (77, 'LOUD.'), (78, 'ALL DAY.')):
        nxt = {76: ws(77), 77: ws(78), 78: ws(80)}[i0]
        if ws(i0) - 0.05 <= t < nxt:
            s = spring(t, ws(i0) - 0.05, 9, 14)
            text(cr, lab, 540, 1180, 150, WHITE, 1, fam='Luckiest Guy', outline=12, scale=lerp(1.6, 1, clamp(s)), glow=True)
    # the hard thing, untouched + locked
    if t > ws(80) - 0.1:
        s = spring(t, ws(80) - 0.1, 8, 12)
        cr.save(); cr.translate(820, 1180); cr.scale(max(s, 1e-3), max(s, 1e-3))
        rrect(cr, -190, -90, 380, 180, 16); cr.set_source_rgb(0, 0, 0); cr.fill_preserve(); stroke(cr, RED, 1, 6, [14, 10])
        text(cr, 'THE HARD', 0, -30, 46, RED, fam='Luckiest Guy'); text(cr, 'THING', 0, 30, 46, RED, fam='Luckiest Guy')
        cr.restore()
        pawn(cr, 260, GROUND, 230, GRAY)
        if t > ws(89) - 0.1:
            text(cr, 'CAN\'T FAIL AT EASY', 540, 1500, 56, YEL, ease(t, ws(89) - 0.1, 0.3), fam='Luckiest Guy')

# ---------- G: one hard thing ----------
def scene_G(cr, t):
    pawn(cr, 540, GROUND, 360 * spring(t, PS[18] - 0.2), WHITE, True)
    if t > ws(94) - 0.1:
        s = spring(t, ws(94) - 0.1, 8, 12)
        cr.save(); cr.translate(540, 720); cr.scale(max(s, 1e-3), max(s, 1e-3))
        rrect(cr, -300, -90, 600, 180, 20); cr.set_source_rgb(0, 0, 0); cr.fill_preserve(); stroke(cr, YEL, 1, 7)
        text(cr, '1 HARD THING', 0, 4, 80, YEL, fam='Luckiest Guy'); cr.restore()
    if t > ws(97) - 0.1:
        el = clamp((t - ws(97)) / 2.4)
        m = int(90 * (1 - el)); sec = int((90 * (1 - el) * 60) % 60)
        text(cr, f'{m:02d}:{sec:02d}', 540, 1520, 130, WHITE, ease(t, ws(97) - 0.1, 0.25), fam='Luckiest Guy', glow=True)
        clockface(cr, 220, 1000, 80, el, WHITE, ease(t, ws(97) - 0.1, 0.25))
    if t > ws(99) - 0.1:
        u = ease(t, ws(99) - 0.1, 0.9)
        phone(cr, lerp(800, 1250, u), lerp(1100, 900, u) - math.sin(u * math.pi) * 200, 0.9, 1 - u * 0.6, 0, GRAY)
        if u < 1:
            text(cr, 'BYE', 880, 960, 40, GRAY, 1 - u)
        cr.new_path(); cr.move_to(960, 1350); cr.line_to(960, 950); cr.line_to(1080, 950); stroke(cr, GRAY, ease(t, ws(99), 0.3), 4)
        text(cr, 'OTHER ROOM', 960, 900, 32, GRAY, ease(t, ws(101), 0.3))

# ---------- H: one year later ----------
LX, RX = 300, 780
def scene_H(cr, t):
    g = ease(t, ws(103), 2.0)
    pawn(cr, LX, GROUND, lerp(330, 300, g), GRAY)
    sweat(cr, LX, GROUND - 430, t, 0.8)
    for k in range(5):
        envelope(cr, LX - 80 + (k % 3) * 70, GROUND - 330 - g * k * 60, 0.8, (0.5, 0.5, 0.5), g)
    pawn(cr, RX, GROUND, lerp(330, 600, g), WHITE, True)
    text(cr, '365 DAYS LATER', 540, 560, 76, YEL, ease(t, ws(103), 0.3), fam='Luckiest Guy')
    cr.new_path(); n = 40
    for i in range(int(n * g) + 1):
        u = i / n; x = lerp(560, 1010, u); y = lerp(1300, 640, u ** 1.8)
        (cr.move_to if i == 0 else cr.line_to)(x, y)
    stroke(cr, WHITE, 0.9, 3, [10, 8])
    if t > ws(106) - 0.1:
        a = ease(t, ws(106) - 0.1, 0.3)
        text(cr, '?', 540, 900, 160, WHITE, a, fam='Luckiest Guy')

# ---------- I: the twist ----------
def scene_I(cr, t):
    if t < PS[24]:
        pawn(cr, LX, GROUND, 330, GRAY); pawn(cr, RX, GROUND, 330, WHITE, True)
        s = spring(t, PS[23] - 0.1, 8, 12)
        text(cr, 'THE TWIST', 540, 760, 140, YEL, clamp(s), fam='Luckiest Guy', outline=12, scale=lerp(1.4, 1, clamp(s)))
        return
    m = ease(t, ws(116) - 0.2, 0.6)  # merge on "both you"
    if m < 1:
        pawn(cr, lerp(LX, 540, m), GROUND, 330, GRAY, False, 1 - m * 0.5)
        pawn(cr, lerp(RX, 540, m), GROUND, 330, WHITE, True, 1)
        if t < ws(116): text(cr, '2 PEOPLE?', 540, 760, 90, WHITE, ease(t, PS[24], 0.3), fam='Luckiest Guy')
    else:
        # split body: half gray half white
        pawn(cr, 540, GROUND, 400, WHITE, True)
        cr.save(); cr.rectangle(0, 0, 540, H); cr.clip(); pawn(cr, 540, GROUND, 400, GRAY); cr.restore()
    if t > ws(117) - 0.1 and t < PS[26]:
        dx, dy = shake(t, ws(118), 18, 0.4)
        text(cr, 'BOTH = YOU', 540 + dx, 720 + dy, 130, YEL, ease(t, ws(117) - 0.1, 0.25), fam='Luckiest Guy', outline=12, glow=True)
    if t > PS[26] - 0.1:
        a = ease(t, PS[26] - 0.1, 0.4)
        # sunrise + two doors
        cr.new_path(); cr.arc(540, 640, 110 * a, math.pi, 2 * math.pi); cr.close_path(); cr.set_source_rgba(*YEL, 0.9 * a); cr.fill()
        for k in range(7):
            ang = math.pi + (k + 0.5) * math.pi / 7
            cr.new_path(); cr.move_to(540 + 140 * math.cos(ang), 640 + 140 * math.sin(ang)); cr.line_to(540 + 190 * math.cos(ang), 640 + 190 * math.sin(ang)); stroke(cr, YEL, a, 5)
        cr.new_path(); cr.move_to(380, 640); cr.line_to(700, 640); stroke(cr, YEL, a, 4)
        text(cr, 'EVERY MORNING', 540, 700, 44, WHITE, a)
        if t > ws(123) - 0.1:
            b = ease(t, ws(123) - 0.1, 0.3)
            for x, lab, col in ((180, 'BUSY', GRAY), (900, 'HARD', YEL)):
                rrect(cr, x - 110, 880, 220, 300, 14); stroke(cr, col, b, 6)
                text(cr, lab, x, 1030, 54, col, b, fam='Luckiest Guy')
            pk = 0.5 + 0.5 * math.sin((t - ws(123)) * 5)
            cr.new_path(); cr.move_to(540, 1000); cr.line_to(lerp(310, 770, pk), 1000); stroke(cr, WHITE, b, 4, [10, 8])

# ---------- J: the rule ----------
def scene_J(cr, t):
    icons = [(ws(132), 'EMAIL'), (ws(134), 'MESSAGE'), (ws(136), 'MEETING')]
    for k, (ti, lab) in enumerate(icons):
        if t < ti - 0.15: continue
        s = spring(t, ti - 0.15, 9, 13)
        x = 200 + k * 340; y = 760
        cr.save(); cr.translate(x, y); cr.scale(max(s, 1e-3), max(s, 1e-3))
        if k == 0: envelope(cr, 0, 0, 1.4)
        elif k == 1:
            rrect(cr, -70, -50, 140, 100, 22); stroke(cr, WHITE, 1, 5)
            cr.new_path(); cr.move_to(-30, 50); cr.line_to(-45, 80); cr.line_to(0, 50); stroke(cr, WHITE, 1, 5)
        else: calendar(cr, 0, 0, 140, 150, 'MTG', 1, '3PM')
        text(cr, lab, 0, 130, 34, (0.7, 0.7, 0.7))
        cr.restore()
        if t > ti + 0.25:  # crossed: not yet
            d = ease(t, ti + 0.25, 0.2)
            cr.new_path(); cr.move_to(x - 90, y - 90); cr.line_to(x - 90 + 180 * d, y - 90 + 180 * d); stroke(cr, RED, 1, 10)
    if t > ws(129) - 0.1:
        text(cr, 'BEFORE ANY OF THESE:', 540, 560, 50, WHITE, ease(t, ws(129) - 0.1, 0.3) * (1 - ease(t, PS[28] - 0.2, 0.2)))
    x = 160
    if t > PS[28] - 0.1:
        u = ease(t, PS[28] - 0.1, 1.2)
        x = lerp(160, 460, u)
        s = spring(t, ws(139) - 0.1, 8, 12)
        cr.save(); cr.translate(800, 1130); cr.scale(max(s, 1e-3), max(s, 1e-3))
        rrect(cr, -230, -110, 460, 220, 20); cr.set_source_rgb(0, 0, 0); cr.fill_preserve(); stroke(cr, YEL, 1, 8)
        text(cr, 'THE THING', 0, -35, 62, YEL, fam='Luckiest Guy'); text(cr, "YOU'RE AVOIDING", 0, 40, 46, WHITE, fam='Luckiest Guy')
        cr.restore()
        cr.new_path(); cr.move_to(x + 70, GROUND - 120); cr.line_to(570, GROUND - 120); stroke(cr, WHITE, 0.6, 3, [6, 10])
    pawn(cr, x, GROUND, 300, WHITE, True)

# ---------- K: loop back ----------
def scene_K(cr, t):
    fade = 1 - ease(t, PS[30] - 0.1, 0.3)
    if fade > 0:
        pawn(cr, 540, GROUND, 330, GRAY, False, fade)
        sweat(cr, 540, GROUND - 440, t, fade)
        for k in range(8):
            ang = t * 1.5 + k * math.pi / 4
            envelope(cr, 540 + 300 * math.cos(ang), 1000 + 160 * math.sin(ang), 0.8, (0.6, 0.6, 0.6), fade)
        if t > ws(148) - 0.1:
            text(cr, 'STILL BUSY', 540, 700, 110, GRAY, ease(t, ws(148) - 0.1, 0.3) * fade, fam='Luckiest Guy')
    if t > PS[30] - 0.15:
        s = spring(t, PS[30] - 0.15, 8, 12)
        pawn(cr, 540, GROUND, 330 * clamp(s), GRAY)
        cr.save(); cr.translate(0, (1 - s) * -300)
        busy_flip(cr, t, ws(155) + 0.1, 800)
        cr.restore()

SCENES = [(0, scene_A), (2, scene_B), (6, scene_C), (8, scene_D), (10, scene_E), (13, scene_F), (18, scene_G),
          (21, scene_H), (23, scene_I), (27, scene_J), (29, scene_K)]

def frame(t):
    surf = cairo.ImageSurface(cairo.FORMAT_RGB24, W, H)
    cr = cairo.Context(surf); cr.set_source_rgb(0, 0, 0); cr.paint()
    idx = 0
    for j, (p, fn) in enumerate(SCENES):
        start = PS[p] - 0.25 if p else 0
        if t >= start: idx = j
    p, fn = SCENES[idx]
    start = PS[p] - 0.25 if p else 0
    ground(cr)
    off = (1 - ease(t, start, 0.3)) * 120 if idx else 0
    cr.save(); cr.translate(off, 0); fn(cr, t); cr.restore()
    captions(cr, t)
    fa = ease(t, DUR + 0.15, 0.3)
    if fa > 0: cr.set_source_rgba(0, 0, 0, fa); cr.paint()
    return surf

if __name__ == '__main__':
    if len(sys.argv) > 2 and sys.argv[1] == 'stills':
        for s in sys.argv[2].split(','):
            frame(float(s)).write_to_png(f'stills2/s_{float(s):05.2f}.png')
        sys.exit()
    out = sys.argv[1] if len(sys.argv) > 1 else 'out/video.mp4'
    ff = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', f'{W}x{H}', '-r', str(FPS),
                           '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
    for f in range(NF):
        surf = frame(f / FPS); ff.stdin.write(bytes(surf.get_data()))
        if f % 300 == 0: print(f, '/', NF, flush=True)
    ff.stdin.close(); ff.wait()
