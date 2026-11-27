# NOMOREEXCUSES — "Monday" Short. Stickman design system (black bg, dashed ground y=1350,
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
KEY = {'dangerous', 'monday', 'math', 'four', 'thousand', 'total', 'fifteen', 'hundred', 'waiting', 'two', 'same',
       'perfect', 'thursday', 'eleven', 'ten', 'still', 'never', 'hiding', 'winner', 'rule', 'today', 'small', 'ugly',
       'badly', 'nobody', 'burned', 'one', 'no', 'year', 'january', 'nothing', 'anything', 'matters'}
def norm(w): return ''.join(ch for ch in w.lower() if ch.isalpha())

def captions(cr, t):
    if t < 1.5: return
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
            if key and norm(s) in ('monday', 'never', 'today'): col = YEL
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

def scene_A(cr, t):  # hook
    tm = ws(10)  # "Monday."
    pawn(cr, 540, GROUND, 360 * spring(t, -0.3), WHITE, True)
    # cover title (frame 0 = thumbnail)
    ca = 1 - ease(t, 1.5, 0.35)
    text(cr, 'STOP WAITING', 540, 700, 132, YEL, ca, fam='Luckiest Guy', outline=16)
    text(cr, 'FOR MONDAY', 540, 850, 150, WHITE, ca, fam='Luckiest Guy', outline=16)
    # "NO" then struck
    if t > 1.6:
        na = ease(t, 1.6, 0.3) * (1 - ease(t, tm - 0.1, 0.25))
        text(cr, 'NO', 540 - 400 * ease(t, tm - 0.1, 0.3), 760, 260, GRAY, na, fam='Luckiest Guy')
        sk = ease(t, ws(7), 0.35)
        if sk > 0:
            cr.new_path(); cr.move_to(380, 790); cr.line_to(380 + 320 * sk, 730); stroke(cr, RED, na, 12)
    if t > tm - 0.12:
        s = spring(t, tm - 0.12, 8, 12)
        dx, dy = shake(t, tm)
        calendar(cr, 540 + dx, lerp(-400, 790, s) + dy, 460, 520, 'DAY 1', 1.0, 'MONDAY')

def scene_B(cr, t):
    xs = [130, 320, 540, 760, 950]
    up = spring(t, PS[2] - 0.15)
    for j, x in enumerate(xs):
        pawn(cr, x, GROUND + (1 - up) * 400, 250, GRAY)
    bubbles = [(2, ws(14), 'MONDAY'), (0, ws(19), 'DIET:\nMONDAY'), (4, ws(22), 'QUIT:\nMONDAY'),
               (1, ws(25), 'NEW ME:\nMONDAY'), (3, ws(25) + 0.15, 'MONDAY.')]
    for j, tb, s in bubbles:
        if t < tb - 0.1: continue
        sc = spring(t, tb - 0.1, 8, 13)
        x = xs[j]; y = GROUND - 330 - (j % 2) * 190
        cr.save(); cr.translate(x, y); cr.scale(max(sc, 1e-3), max(sc, 1e-3))
        rrect(cr, -95, -62, 190, 124, 22); cr.set_source_rgb(0, 0, 0); cr.fill_preserve(); stroke(cr, WHITE, 1, 3)
        cr.new_path(); cr.move_to(-12, 62); cr.line_to(0, 88); cr.line_to(14, 62); stroke(cr, WHITE, 1, 3)
        ls = s.split('\n')
        for li, l in enumerate(ls):
            text(cr, l, 0, (li - (len(ls) - 1) / 2) * 44, 36 if len(ls) > 1 else 40, YEL if 'MONDAY' in l else WHITE)
        cr.restore()

GX0, GY0, DX, DY = 540 - 51 * 8, 530, 16, 9.6
def grid(cr, t, rows_vis, burned_rows=0.0, hl=False):
    for r in range(80):
        if r >= rows_vis: break
        y = GY0 + r * DY
        b = clamp(burned_rows - r)
        for c in range(52):
            if b > 0 and (c / 52) < b:
                cr.set_source_rgb(0.16, 0.06, 0.05)
            else:
                cr.set_source_rgb(0.92, 0.92, 0.92)
            cr.rectangle(GX0 + c * DX - 3.5, y - 3.5, 7, 7)
        cr.fill()
    # labels
    if burned_rows <= 0: text(cr, '1 DOT = 1 MONDAY', 540, GY0 + 80 * DY + 30, 30, (0.6, 0.6, 0.6), clamp(rows_vis / 10), bold=False)

def scene_C(cr, t):
    if t < ws(32) + 0.2:
        a = 1 - ease(t, ws(32), 0.2)
        text(cr, '52 WEEKS × 80 YEARS', 540, 880, 76, WHITE, a * ease(t, PS[7], 0.3))
    rows = 80 * ease(t, ws(32), 1.8) if t > ws(32) else 0
    grid(cr, t, rows)
    if t > ws(37):
        n = int(4160 * ease(t, ws(37), 1.4))
        text(cr, f'{n:,}', 540, 1470, 150, WHITE, 1, fam='Luckiest Guy', glow=True)
        text(cr, 'MONDAYS. IN YOUR WHOLE LIFE.', 540, 1580, 40, (0.7, 0.7, 0.7), ease(t, ws(41), 0.3))
    if t > ws(43) - 0.1:
        s = spring(t, ws(43) - 0.1, 8, 12)
        cr.save(); cr.translate(540, GY0 + 40 * DY); cr.scale(lerp(1.15, 1, s), lerp(1.15, 1, s))
        rrect(cr, -440, -405, 880, 810, 20); stroke(cr, YEL, clamp(s), 6); cr.restore()
    if t < PS[7] + 0.6:  # small protagonist intro looking at math
        pass

def scene_D(cr, t):
    burned = 30 * ease(t, ws(46), 2.6) if t > ws(46) else 0
    grid(cr, t, 80, burned)
    if t > ws(44):
        text(cr, 'AGE 30', GX0 - 20, GY0 + 30 * DY, 30, RED, ease(t, ws(44), 0.3), anchor='r')
        cr.new_path(); cr.move_to(GX0 - 8, GY0 + 30 * DY - 5); cr.line_to(GX0 + 51 * DX + 8, GY0 + 30 * DY - 5)
        stroke(cr, RED, ease(t, ws(44), 0.3), 3, [8, 6])
    if t > ws(46):
        n = int(1560 * clamp(burned / 30))
        text(cr, f'-{n:,}', 540, 1470, 150, RED, 1, fam='Luckiest Guy')
        text(cr, 'ALREADY GONE', 540, 1580, 40, (0.7, 0.7, 0.7), ease(t, ws(50), 0.3))
    if t > ws(54):  # the next one, pulsing
        x = GX0; y = GY0 + 30 * DY
        pr = (t - ws(54)) * 2.2 % 1
        cr.new_path(); cr.arc(x, y, 8 + 40 * pr, 0, 2 * math.pi); stroke(cr, YEL, 1 - pr, 3)
        cr.new_path(); cr.arc(x, y, 9, 0, 2 * math.pi); cr.set_source_rgb(*YEL); cr.fill()
        text(cr, '← STILL WAITING', x + 34, y, 34, YEL, ease(t, ws(54), 0.3), anchor='l')

LX, RX = 300, 780
def flag(cr, x, y, a):
    cr.new_path(); cr.move_to(x, y + 90); cr.line_to(x, y - 60); stroke(cr, WHITE, a, 4)
    cr.new_path(); cr.move_to(x, y - 60); cr.line_to(x + 70, y - 38); cr.line_to(x, y - 16); cr.close_path(); cr.set_source_rgba(*YEL, a); cr.fill()

def two(cr, t, la=1.0, ra=1.0, lh=330, rh=330, rsy=1.0):
    pawn(cr, LX, GROUND, lh * spring(t, PS[14] - 0.1), GRAY, False, la)
    pawn(cr, RX, GROUND, rh * spring(t, PS[14] + 0.1), WHITE, True, ra, sy=rsy)

def scene_E(cr, t):
    two(cr, t)
    if t > PS[15] - 0.1:
        a = ease(t, PS[15] - 0.1, 0.3)
        flag(cr, LX, 760, a); flag(cr, RX, 760, a)
        text(cr, 'GOAL', 540, 740, 44, WHITE, a)
    if t > PS[16] - 0.1:
        calendar(cr, 540, 1020, 200, 220, 'JAN', 1, '1', scale_y=spring(t, PS[16] - 0.1, 8, 12))

def prop_pop(t, t0): return spring(t, t0 - 0.08, 8, 13)

def scene_F(cr, t):
    two(cr, t, 1.0, 1 - 0.7 * ease(t, PS[17], 0.4))
    # waiting dots
    k = int((t * 3) % 4)
    text(cr, 'waiting' + '.' * k, LX, 760, 40, (0.7, 0.7, 0.7), ease(t, PS[17], 0.3), bold=False)
    s = prop_pop(t, PS[18])
    if s > 0: calendar(cr, 150, 1000, 170 * s, 190 * s, 'MON', 1, '✓')
    s = prop_pop(t, PS[19])
    if s > 0:
        cr.save(); cr.translate(450, 980); cr.scale(max(s, 1e-3), max(s, 1e-3))
        rrect(cr, -70, -95, 140, 190, 10); stroke(cr, WHITE, 1, 4)
        for i in range(5):
            cr.new_path(); cr.move_to(-45, -55 + i * 28); cr.line_to(45, -55 + i * 28); stroke(cr, GRAY, 1, 3)
        text(cr, 'NEW', 0, -120, 30, WHITE); cr.restore()
    if t > PS[20] - 0.1:
        for i in range(3):
            d = ease(t, PS[20] + i * 0.18, 0.25)
            y = 570 + i * 50
            cr.new_path(); cr.move_to(170, y); cr.line_to(170 + 260 * d, y); stroke(cr, WHITE, 1, 3)
            if d >= 1:
                cr.new_path(); cr.move_to(130, y); cr.line_to(142, y + 12); cr.line_to(160, y - 14); stroke(cr, YEL, 1, 4)
        text(cr, 'PERFECT PLAN', 300, 520, 36, YEL, ease(t, PS[20], 0.3))

def scene_G(cr, t):
    sy = 1.0
    t0, t1 = ws(84), PH[23]['end']
    reps = 0
    if t0 <= t <= t1 + 0.2:
        ph = clamp((t - t0) / (t1 - t0)) * 10
        reps = min(10, int(ph) + 1); sy = 1 - 0.35 * abs(math.sin(ph * math.pi))
    elif t > t1: reps = 10
    two(cr, t, 0.3, 1.0, rsy=sy)
    if t > PS[21] - 0.1:
        s = prop_pop(t, ws(80))
        cr.save(); cr.translate(RX, 700); cr.scale(max(s, 1e-3), max(s, 1e-3))
        rrect(cr, -150, -40, 300, 80, 40); stroke(cr, WHITE, 1, 3); text(cr, 'THURSDAY', 0, 0, 40, WHITE); cr.restore()
    if t > PS[22] - 0.1:
        s = prop_pop(t, PS[22])
        cr.save(); cr.translate(RX, 560); cr.scale(max(s, 1e-3), max(s, 1e-3))
        rrect(cr, -150, -55, 300, 110, 14); cr.set_source_rgb(0, 0, 0); cr.fill_preserve(); stroke(cr, YEL, 1, 4)
        text(cr, '11:00 PM', 0, 0, 62, YEL, fam='Luckiest Guy'); cr.restore()
    if reps:
        text(cr, f'{reps}', RX, 1470, 160, WHITE, 1, fam='Luckiest Guy', glow=True, scale=0.9 + 0.1 * spring(t, t0 + (reps - 1) * (t1 - t0) / 10, 10, 15))
        text(cr, 'PUSH-UPS', RX, 1590, 40, (0.7, 0.7, 0.7))
    if t > ws(88):
        text(cr, 'NO PLAN', LX + 10, 1500, 52, GRAY, ease(t, ws(88), 0.3))

def scene_H(cr, t):
    g = ease(t, PS[24], 2.0)
    pawn(cr, LX, GROUND, 330, GRAY, False, 1)
    pawn(cr, RX, GROUND, lerp(330, 560, g), WHITE, True)
    text(cr, '365 DAYS LATER', 540, 560, 70, YEL, ease(t, PS[24], 0.3) * (1 - ease(t, PS[25], 0.3)), fam='Luckiest Guy')
    # trajectory arc
    cr.new_path(); n = 40
    for i in range(int(n * g) + 1):
        u = i / n; x = lerp(560, 1000, u); y = lerp(1300, 640, u ** 1.8)
        (cr.move_to if i == 0 else cr.line_to)(x, y)
    stroke(cr, WHITE, 0.9, 3, [10, 8])
    # progress bar
    rrect(cr, 640, 1420, 300, 34, 17); stroke(cr, WHITE, 1, 3)
    rrect(cr, 646, 1426, max(22, 288 * g), 22, 11); cr.set_source_rgb(1, 1, 1); cr.fill()
    if t > PS[25] - 0.1:
        a = ease(t, PS[25] - 0.1, 0.3)
        ang = (t * 6) % (2 * math.pi)
        cr.new_path(); cr.arc(LX, 820, 46, ang, ang + 4.4); stroke(cr, (0.7, 0.7, 0.7), a, 7)
        text(cr, 'STILL WAITING', LX, 1450, 46, GRAY, a)

def scene_I(cr, t):
    s = spring(t, PS[26] - 0.1)
    pawn(cr, 540, GROUND, 460, GRAY, False, 1)
    # calendar wall rises in front (hiding place)
    hy = lerp(1900, 1235, spring(t, PS[27] - 0.1, 7, 9)) if t > PS[27] - 0.1 else 2400
    calendar(cr, 540, hy, 600, 370, 'MONDAY', 1, 'LATER')
    if t < PS[27]:
        text(cr, 'THE PROBLEM?', 540, 700, 64, WHITE, s * (1 - ease(t, PS[27] - 0.2, 0.2)), fam='Luckiest Guy')
    if t > ws(115) - 0.1:  # "winner": fake dashed trophy above head
        a = ease(t, ws(115) - 0.1, 0.3)
        fl = 1.0 if t < ws(116) else (0.25 + 0.75 * (int(t * 14) % 2))
        cx, cy = 540, 760
        cr.new_path(); cr.move_to(cx - 80, cy - 70); cr.line_to(cx + 80, cy - 70); cr.curve_to(cx + 80, cy + 40, cx + 30, cy + 50, cx, cy + 60)
        cr.curve_to(cx - 30, cy + 50, cx - 80, cy + 40, cx - 80, cy - 70); stroke(cr, YEL, a * fl, 4, [10, 8])
        cr.new_path(); cr.move_to(cx, cy + 60); cr.line_to(cx, cy + 110); cr.move_to(cx - 50, cy + 115); cr.line_to(cx + 50, cy + 115); stroke(cr, YEL, a * fl, 4, [10, 8])
        if t > ws(116):
            text(cr, 'FAKE WIN', 540, 600, 56, RED, ease(t, ws(116), 0.25), fam='Luckiest Guy')

def scene_J(cr, t):
    steps = [ws(128), ws(129), ws(130), ws(131), ws(132)]
    labels = [None, 'SMALL.', 'UGLY.', 'BADLY.', 'TODAY.']
    n = sum(1 for s in steps if t >= s - 0.08)
    x = 180 + sum(150 * spring(t, s - 0.08, 9, 12) for s in steps)
    pawn(cr, x, GROUND, 340, WHITE, True)
    # dashed path ahead
    cr.new_path(); cr.move_to(x + 60, GROUND - 20); cr.line_to(1060, GROUND - 20); stroke(cr, WHITE, 0.5, 3, [6, 10])
    if t < PS[31] - 0.1:
        s = spring(t, PS[29] - 0.1, 8, 12)
        cr.save(); cr.translate(540, 760); cr.scale(max(s, 1e-3), max(s, 1e-3))
        rrect(cr, -330, -150, 660, 300, 24); stroke(cr, WHITE, 1, 4)
        text(cr, 'THE RULE', 0, -70, 44, (0.7, 0.7, 0.7))
        if t > PS[30] - 0.1: text(cr, 'IF IT MATTERS →', 0, 40, 64, WHITE, ease(t, PS[30] - 0.1, 0.25), fam='Luckiest Guy')
        cr.restore()
    elif n >= 1:
        i = n - 1
        lab = labels[i] or 'TODAY.'
        s = spring(t, steps[i] - 0.08, 9, 14)
        big = i == 4
        dx, dy = shake(t, steps[4]) if big else (0, 0)
        col = YEL if (big or i == 0) else WHITE
        text(cr, lab, 540 + dx, 760 + dy, 220 if big else 180, col, 1, fam='Luckiest Guy', outline=10, scale=lerp(1.6, 1.0, clamp(s)), glow=big)
        if i == 0: text(cr, 'IT STARTS', 540, 590, 60, WHITE, 1)

def scene_K(cr, t):
    seq = [(ws(134) - 0.1, "TOMORROW"), (ws(136) - 0.1, 'MONDAY'), (ws(140) - 0.05, "NEVER")]
    cur = 0
    for i, (st, _) in enumerate(seq):
        if t >= st: cur = i
    st = seq[cur][0]; lab = seq[cur][1]
    flip = clamp((t - st) / 0.22)
    sy = abs(math.cos(flip * math.pi)) if flip < 1 and cur > 0 else 1.0
    if cur > 0 and flip < 0.5: lab = seq[cur - 1][1]
    never = lab == 'NEVER'
    dx, dy = shake(t, seq[2][0] + 0.11, 24, 0.5) if never else (0, 0)
    calendar(cr, 540 + dx, 860 + dy, 600, 620, lab if not never else 'NEVER', 1, '?' if never else '...', scale_y=sy,
             col=RED if never else WHITE)
    if never and t > seq[2][0] + 0.11:
        c = ease(t, seq[2][0] + 0.11, 0.25)
        cr.new_path(); pts = [(540, 600), (500, 720), (580, 820), (520, 940), (600, 1060), (560, 1160)]
        for i, (px, py) in enumerate(pts[:1 + int(c * (len(pts) - 1))]):
            (cr.move_to if i == 0 else cr.line_to)(px + dx, py + dy)
        stroke(cr, (0, 0, 0), 1, 9)
    pawn(cr, 540, GROUND + 260, 200, GRAY, False, 0.0)

SCENES = [(0, scene_A), (2, scene_B), (7, scene_C), (11, scene_D), (14, scene_E), (17, scene_F), (21, scene_G),
          (24, scene_H), (26, scene_I), (29, scene_J), (36, scene_K)]

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
    # slide-in transition
    off = (1 - ease(t, start, 0.3)) * 120 if idx else 0
    cr.save(); cr.translate(off, 0); fn(cr, t); cr.restore()
    captions(cr, t)
    # end fade (last 0.35s) for a clean loop into the title frame
    fa = ease(t, DUR + 0.2, 0.35)
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
