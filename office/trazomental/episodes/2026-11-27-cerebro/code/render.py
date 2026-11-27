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
KEY = {'cerebro','triunfes','sobrevivas','dos','veinte','ciento','energía','mañana','pereza','ahorro','nadie','ganas',
       'después','antes','martes','siete','espera','esperando','zapatillas','minutos','parar','motivación','chispa','humo',
       'fuego','pequeño','hoy','recuerda','gimnasio','estudiar','proyecto','personas'}
YELW = {'mañana','hoy','después','fuego','ahorro'}
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
            if key and norm(s) in YELW: col = YEL
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

# ======================= TRAZOMENTAL — "Tu cerebro no quiere que triunfes" =======================
ORANGE = (1.0, 0.55, 0.1)
def shake(t, t0, amp=18, d=0.35):
    x = t - t0
    if x < 0 or x > d: return 0, 0
    f = (1 - x / d) * amp
    return f * math.sin(x * 90), f * math.cos(x * 77)

def brain(cr, cx, cy, r, col=WHITE, a=1.0, lw=6, glow=False, pulse=0.0):
    if a <= 0.01: return
    cr.save(); cr.translate(cx, cy); s = 1 + 0.05 * pulse; cr.scale(s, s)
    def outline():
        cr.new_path(); n = 14
        for i in range(n + 1):
            ang = math.pi + i * math.pi * 2 / n
            rr = r * (1 + 0.09 * math.cos(i * 2.0))
            x = rr * math.cos(ang) * 1.18; y = rr * math.sin(ang) * 0.92
            if i == 0: cr.move_to(x, y)
            else:
                pa = math.pi + (i - 0.5) * math.pi * 2 / n
                cr.curve_to(r * 1.38 * math.cos(pa) * 1.12, r * 1.3 * math.sin(pa) * 0.9, r * 1.38 * math.cos(pa) * 1.12, r * 1.3 * math.sin(pa) * 0.9, x, y)
        cr.close_path()
    if glow:
        for k in range(6, 0, -1):
            outline(); cr.set_source_rgba(*col, 0.04 * a); cr.set_line_width(lw + k * 8); cr.stroke()
    outline(); cr.set_source_rgba(0, 0, 0, a); cr.fill_preserve(); cr.set_source_rgba(*col, a); cr.set_line_width(lw); cr.stroke()
    cr.new_path(); cr.move_to(0, -r * 0.95); cr.curve_to(-r * 0.15, -r * 0.4, r * 0.15, r * 0.2, 0, r * 0.85)
    for sx in (-1, 1):
        cr.move_to(sx * r * 0.75, -r * 0.35); cr.curve_to(sx * r * 0.3, -r * 0.5, sx * r * 0.5, 0, sx * r * 0.2, r * 0.05)
        cr.move_to(sx * r * 0.85, r * 0.3); cr.curve_to(sx * r * 0.55, r * 0.15, sx * r * 0.45, r * 0.55, sx * r * 0.15, r * 0.5)
    cr.set_source_rgba(*col, a); cr.set_line_width(lw * 0.7); cr.set_line_cap(cairo.LINE_CAP_ROUND); cr.stroke()
    cr.restore()

def trophy(cr, cx, cy, sc, col, a):
    cr.save(); cr.translate(cx, cy); cr.scale(sc, sc)
    cr.new_path(); cr.move_to(-80, -70); cr.line_to(80, -70); cr.curve_to(80, 40, 30, 50, 0, 60)
    cr.curve_to(-30, 50, -80, 40, -80, -70); cr.close_path(); cr.set_source_rgba(*col, a); cr.fill()
    cr.new_path(); cr.arc(-80, -30, 30, math.pi / 2, 1.5 * math.pi); cr.move_to(80, -60); cr.arc(80, -30, 30, -math.pi / 2, math.pi / 2)
    stroke(cr, col, a, 8)
    cr.rectangle(-12, 58, 24, 40); cr.rectangle(-55, 96, 110, 22); cr.set_source_rgba(*col, a); cr.fill()
    cr.restore()

def xmark(cr, cx, cy, s, p, a=1.0):
    for k, (dx0, dy0) in enumerate(((-1, -1), (1, -1))):
        q = clamp(p * 2 - k)
        if q <= 0: continue
        cr.new_path(); cr.move_to(cx + dx0 * s, cy + dy0 * s); cr.line_to(cx + dx0 * s - 2 * dx0 * s * q, cy + dy0 * s + 2 * s * q)
        cr.set_line_cap(cairo.LINE_CAP_ROUND); stroke(cr, RED, a, 16)

def ecg(cr, t, t0, y, a):
    p = ease(t, t0, 1.2)
    if p <= 0: return
    cr.new_path(); pts = []
    for i in range(0, 1081, 6):
        u = (i % 360) / 360
        v = 0
        if 0.40 < u < 0.45: v = -40 * math.sin((u - 0.40) / 0.05 * math.pi)
        elif 0.47 < u < 0.52: v = 150 * math.sin((u - 0.47) / 0.05 * math.pi) * (1 if u < 0.495 else -0.6)
        pts.append((i, y - v))
    n = int(len(pts) * p)
    for i, (x, yy) in enumerate(pts[:max(2, n)]): (cr.move_to if i == 0 else cr.line_to)(x, yy)
    cr.set_line_join(cairo.LINE_JOIN_ROUND); stroke(cr, YEL, a, 6)

def battery(cr, cx, cy, w, h, frac, col, a=1.0, label=None):
    rrect(cr, cx - w / 2, cy - h / 2, w, h, 16); stroke(cr, WHITE, a, 5)
    cr.rectangle(cx + w / 2 + 2, cy - h * 0.2, 16, h * 0.4); cr.set_source_rgba(1, 1, 1, a); cr.fill()
    if frac > 0.002:
        rrect(cr, cx - w / 2 + 10, cy - h / 2 + 10, max(14, (w - 20) * frac), h - 20, 9); cr.set_source_rgba(*col, a); cr.fill()
    if label: text(cr, label, cx, cy + h / 2 + 46, 36, (0.75, 0.75, 0.75), a)

def bubble(cr, x, y, w, h, s, lines, col=WHITE, tcol=WHITE, size=40, tail=True, dashed=False, a=1.0):
    if s <= 0.01: return
    cr.save(); cr.translate(x, y); cr.scale(max(s, 1e-3), max(s, 1e-3))
    rrect(cr, -w / 2, -h / 2, w, h, 26); cr.set_source_rgba(0, 0, 0, a); cr.fill_preserve(); stroke(cr, col, a, 4, [14, 10] if dashed else None)
    if tail:
        cr.new_path(); cr.move_to(-14, h / 2); cr.line_to(0, h / 2 + 30); cr.line_to(16, h / 2); stroke(cr, col, a, 4)
    for li, l in enumerate(lines):
        text(cr, l, 0, (li - (len(lines) - 1) / 2) * size * 1.15, size, tcol, a)
    cr.restore()

def dumbbell(cr, x, y, s, a):
    cr.save(); cr.translate(x, y); cr.scale(s, s)
    cr.rectangle(-60, -6, 120, 12); cr.set_source_rgba(1, 1, 1, a); cr.fill()
    for sx in (-1, 1):
        rrect(cr, sx * 60 - 14, -40, 28, 80, 8); cr.fill(); rrect(cr, sx * 84 - 10, -28, 20, 56, 6); cr.set_source_rgba(1, 1, 1, a); cr.fill()
    cr.restore()
def book(cr, x, y, s, a):
    cr.save(); cr.translate(x, y); cr.scale(s, s)
    cr.new_path(); cr.move_to(0, -40); cr.curve_to(-30, -55, -60, -55, -80, -45); cr.line_to(-80, 45); cr.curve_to(-60, 35, -30, 35, 0, 50)
    cr.curve_to(30, 35, 60, 35, 80, 45); cr.line_to(80, -45); cr.curve_to(60, -55, 30, -55, 0, -40); cr.line_to(0, 50)
    stroke(cr, WHITE, a, 5); cr.restore()
def laptop(cr, x, y, s, a):
    cr.save(); cr.translate(x, y); cr.scale(s, s)
    rrect(cr, -70, -55, 140, 90, 8); stroke(cr, WHITE, a, 5)
    cr.new_path(); cr.move_to(-95, 48); cr.line_to(95, 48); cr.set_line_cap(cairo.LINE_CAP_ROUND); stroke(cr, WHITE, a, 9)
    text(cr, '0%', 0, -10, 34, YEL, a); cr.restore()

def flame(cr, x, y, h, a=1.0, t=0.0):
    if h < 2: return
    wob = math.sin(t * 17) * 0.06
    for k, (col, sc) in enumerate(((ORANGE, 1.0), (YEL, 0.62), (WHITE, 0.3))):
        hh = h * sc; ww = hh * 0.55
        cr.new_path(); cr.move_to(x, y)
        cr.curve_to(x - ww, y, x - ww * 0.9, y - hh * 0.55, x + ww * wob * 4, y - hh)
        cr.curve_to(x + ww * 0.9, y - hh * 0.55, x + ww, y, x, y)
        if k == 0:
            for g in range(5, 0, -1):
                cr.save(); cr.set_source_rgba(*ORANGE, 0.05 * a); cr.set_line_width(g * 14); cr.stroke_preserve(); cr.restore()
        cr.set_source_rgba(*col, a); cr.fill()

def smoke(cr, x, y, t, t0, a=1.0, n=3, spread=1.0):
    if t < t0: return
    for i in range(n):
        ph = ((t - t0) * 0.5 + i / n) % 1
        cr.new_path()
        for j in range(30):
            u = j / 29; yy = y - u * 420 * spread - ph * 120
            xx = x + math.sin(u * 7 + t * 2 + i * 2) * 40 * u + (i - 1) * 50
            (cr.move_to if j == 0 else cr.line_to)(xx, yy)
        stroke(cr, (0.85, 0.85, 0.85), a * (1 - ph) * ease(t, t0, 0.5), 12)

def spark(cr, x, y, s, a):
    for k in range(8):
        ang = k * math.pi / 4; r0, r1 = (14, 60) if k % 2 == 0 else (10, 34)
        cr.new_path(); cr.move_to(x + r0 * s * math.cos(ang), y + r0 * s * math.sin(ang)); cr.line_to(x + r1 * s * math.cos(ang), y + r1 * s * math.sin(ang))
        cr.set_line_cap(cairo.LINE_CAP_ROUND); stroke(cr, YEL, a, 7)

def clockface(cr, x, y, r, t, a, spin=0.0, label=None):
    cr.new_path(); cr.arc(x, y, r, 0, 2 * math.pi); stroke(cr, WHITE, a, 5)
    for k in range(12):
        ang = k * math.pi / 6
        cr.new_path(); cr.move_to(x + r * 0.82 * math.cos(ang), y + r * 0.82 * math.sin(ang)); cr.line_to(x + r * 0.92 * math.cos(ang), y + r * 0.92 * math.sin(ang)); stroke(cr, WHITE, a, 3)
    hm = -math.pi / 2 + spin * 2 * math.pi; hh = -math.pi / 2 + (7 / 12) * 2 * math.pi + spin * math.pi / 6
    cr.new_path(); cr.move_to(x, y); cr.line_to(x + r * 0.75 * math.cos(hm), y + r * 0.75 * math.sin(hm)); stroke(cr, WHITE, a, 5)
    cr.new_path(); cr.move_to(x, y); cr.line_to(x + r * 0.5 * math.cos(hh), y + r * 0.5 * math.sin(hh)); stroke(cr, YEL, a, 7)
    if label: text(cr, label, x, y + r + 44, 38, WHITE, a)

def shoe(cr, x, y, s, a):
    cr.save(); cr.translate(x, y); cr.scale(s, s)
    cr.new_path(); cr.move_to(-70, 0); cr.line_to(-70, -45); cr.curve_to(-50, -50, -30, -48, -20, -40)
    cr.curve_to(0, -20, 40, -20, 70, -12); cr.curve_to(85, -8, 85, 0, 75, 0); cr.close_path()
    cr.set_source_rgba(*YEL, a); cr.fill()
    cr.rectangle(-72, -2, 152, 10); cr.set_source_rgba(1, 1, 1, a); cr.fill()
    for k in range(3):
        cr.new_path(); cr.move_to(-35 + k * 14, -42 + k * 5); cr.line_to(-20 + k * 14, -30 + k * 5); stroke(cr, (0, 0, 0), a, 4)
    cr.restore()

# ---------- scenes ----------
def scene_A(cr, t):  # 0-1 hook
    pawn(cr, 540, GROUND, 380 * spring(t, -0.3), WHITE, True)
    pulse = abs(math.sin(t * 3.2)) if t < ws(6) else 0
    brain(cr, 540, 760, 170, WHITE, 1, 7, glow=True, pulse=pulse)
    ca = 1 - ease(t, 1.1, 0.35)
    text(cr, 'TU CEREBRO', 540, 500, 140, WHITE, ca, fam='Luckiest Guy', outline=18)
    text(cr, 'TE SABOTEA', 540, 1540, 150, YEL, ca, fam='Luckiest Guy', outline=18)
    if t > ws(5) - 0.3 and t < ws(6) + 0.2:
        s = spring(t, ws(5) - 0.3, 8, 12); fa = 1 - ease(t, ws(6), 0.2)
        trophy(cr, 220, 1050, 0.9 * s, YEL, fa); xmark(cr, 220, 1040, 110, ease(t, ws(5) + 0.15, 0.35), fa)
    if t > ws(6) - 0.1:
        ecg(cr, t, ws(6) - 0.1, 1080, 1.0)
        text(cr, 'MODO SUPERVIVENCIA', 540, 1520, 64, YEL, ease(t, ws(8), 0.3), fam='Luckiest Guy')

def scene_B(cr, t):  # 2-3 stats
    brain(cr, 540, 700, 140, WHITE, 1, 6, glow=True)
    a1 = ease(t, ws(11) - 0.1, 0.3)
    battery(cr, 540, 1000, 560, 120, 0.02 if t > ws(11) else 0, WHITE, a1, 'PESO DEL CUERPO')
    if ws(11) < t < PS[3]:
        text(cr, '2%', 540, 1520, 190, WHITE, 1, fam='Luckiest Guy', glow=True, scale=lerp(1.4, 1, clamp(spring(t, ws(11), 9, 12))))
    if t > PS[3] - 0.1:
        a2 = ease(t, PS[3] - 0.1, 0.3)
        p = ease(t, ws(21), 1.2) if t > ws(21) else 0
        battery(cr, 540, 1210, 560, 120, 0.2 * p, RED, a2, 'ENERGÍA QUE CONSUME')
        n = int(round(20 * p))
        if t > ws(21):
            dx, dy = shake(t, ws(26), 16)
            text(cr, f'{n}%', 540 + dx, 1550 + dy, 190, RED, 1, fam='Luckiest Guy', glow=True)

def scene_C(cr, t):  # 4-7 gym/study/project -> "mañana"
    sq = 1 - 0.15 * ease(t, ws(43), 0.6)
    pawn(cr, 540, GROUND, 380, WHITE, True, sy=sq)
    icons = [(ws(35) - 0.15, 210, 820, dumbbell, 'GIMNASIO'), (ws(37) - 0.15, 540, 640, book, 'ESTUDIAR'), (ws(41) - 0.15, 870, 820, laptop, 'PROYECTO')]
    gone = ease(t, ws(43) - 0.2, 0.4)
    for st, x, y, fn, lab in icons:
        if t < st: continue
        s = spring(t, st, 8, 13); a = 1 - 0.75 * gone
        rrect(cr, x - 130, y - 110, 260, 220, 28); stroke(cr, WHITE, a * clamp(s), 4)
        fn(cr, x, y - 10, max(1e-3, s), a); text(cr, lab, x, y + 150, 36, (0.8, 0.8, 0.8), a * clamp(s))
    if t > ws(43) - 0.2:
        s = spring(t, ws(43) - 0.2, 7, 10)
        brain(cr, 860, 1080, 70, (0.6, 0.6, 0.6), clamp(s), 4)
        bubble(cr, 760, 960, 330, 120, s, ['mañana...'], (0.6, 0.6, 0.6), YEL, 54, dashed=True)

def scene_D(cr, t):  # 8-9 not laziness, saving
    pawn(cr, 540, GROUND, 300, WHITE, True)
    s = spring(t, PS[8] - 0.1, 8, 12)
    text(cr, 'PEREZA', 540, 700, 170, GRAY, clamp(s) * (1 - 0.6 * ease(t, PS[9], 0.3)), fam='Luckiest Guy', scale=lerp(1.3, 1, clamp(s)))
    st = ease(t, ws(47) - 0.05, 0.3)
    if st > 0:
        cr.new_path(); cr.move_to(240, 740); cr.line_to(240 + 600 * st, 660); cr.set_line_cap(cairo.LINE_CAP_ROUND); stroke(cr, RED, 1 - 0.6 * ease(t, PS[9], 0.3), 16)
    if t > PS[9] - 0.1:
        s2 = spring(t, PS[9] - 0.1, 8, 12)
        dx, dy = shake(t, ws(49), 14)
        text(cr, 'AHORRO', 540 + dx, 920 + dy, 190, YEL, clamp(s2), fam='Luckiest Guy', outline=10, glow=True, scale=lerp(1.5, 1, clamp(s2)))
        blink = 0.5 + 0.5 * (int(t * 3) % 2)
        battery(cr, 540, 1130, 300, 90, 0.18, YEL, clamp(s2) * blink)

def scene_E(cr, t):  # 10-12 ganas after starting
    a0 = ease(t, PS[10] - 0.1, 0.3)
    text(cr, 'LO QUE NADIE TE CUENTA', 540, 620, 60, WHITE, a0 * (1 - ease(t, PS[11] - 0.2, 0.3)), fam='Luckiest Guy')
    sw = ease(t, ws(65) - 0.1, 0.6) if t > ws(65) - 0.1 else 0
    # box GANAS first then EMPEZAR; swap on "Llegan después"
    ax, bx = lerp(260, 820, sw), lerp(820, 260, sw)
    lift = math.sin(sw * math.pi) * 160
    if t > PS[11] - 0.15:
        s = spring(t, PS[11] - 0.15, 8, 12)
        cr.save(); cr.translate(ax, 900 - lift); cr.scale(max(1e-3, s), max(1e-3, s))
        rrect(cr, -200, -80, 400, 160, 26); cr.set_source_rgb(0, 0, 0); cr.fill_preserve(); stroke(cr, YEL, 1, 5)
        text(cr, 'GANAS', 0, 0, 80, YEL, fam='Luckiest Guy'); cr.restore()
        if t > ws(62) - 0.1:
            s2 = spring(t, ws(62) - 0.1, 8, 12)
            cr.save(); cr.translate(bx, 900 + lift); cr.scale(max(1e-3, s2), max(1e-3, s2))
            rrect(cr, -200, -80, 400, 160, 26); cr.set_source_rgb(0, 0, 0); cr.fill_preserve(); stroke(cr, WHITE, 1, 5)
            text(cr, 'EMPEZAR', 0, 0, 74, WHITE, fam='Luckiest Guy'); cr.restore()
            aa = ease(t, ws(62), 0.3) * (1 - abs(math.sin(sw * math.pi)))
            cr.new_path(); cr.move_to(480, 900); cr.line_to(600, 900); cr.move_to(575, 878); cr.line_to(602, 900); cr.line_to(575, 922)
            stroke(cr, WHITE, aa, 6)
        if t > ws(61) and sw < 0.05:
            xmark(cr, 540, 1150, 60, ease(t, ws(64), 0.3))
        if sw >= 1:
            k = ease(t, ws(66), 0.3)
            text(cr, '1º', 260, 1080, 60, WHITE, k); text(cr, '2º', 820, 1080, 60, YEL, k)
    pawn(cr, 540, GROUND, 200, WHITE, True, a=ease(t, PS[10], 0.3))

LX, RX = 290, 790
def ganasbar(cr, x, frac, a, col):
    rrect(cr, x - 150, 1440, 300, 40, 20); stroke(cr, WHITE, a, 3)
    if frac > 0.01: rrect(cr, x - 144, 1446, max(28, 288 * frac), 28, 14); cr.set_source_rgba(*col, a); cr.fill()
    text(cr, f'GANAS {int(round(frac * 100))}%', x, 1530, 38, col if frac > 0.5 else (0.75, 0.75, 0.75), a)

def scene_F(cr, t):  # 13-17 two people, one waits
    up = spring(t, PS[13] - 0.15)
    pawn(cr, LX, GROUND + (1 - up) * 400, 330, GRAY, False)
    pawn(cr, RX, GROUND + (1 - up) * 400, 330, WHITE, True)
    if t > PS[14] - 0.1: ganasbar(cr, LX, 0, ease(t, PS[14] - 0.1, 0.3), WHITE); ganasbar(cr, RX, 0, ease(t, PS[14] - 0.1, 0.3), WHITE)
    if t > PS[15] - 0.1:
        s = spring(t, PS[15] - 0.1, 8, 12)
        spin = (t - PS[16]) * 1.6 if t > PS[16] else 0
        cr.save(); cr.translate(540, 640); cr.scale(max(1e-3, s), max(1e-3, s)); clockface(cr, 0, 0, 105, t, 1, spin, 'MARTES 19:00'); cr.restore()
    if t > PS[16] - 0.1:
        k = int((t * 3) % 4)
        text(cr, 'esperando' + '.' * k, LX, 880, 44, (0.7, 0.7, 0.7), ease(t, PS[16], 0.3), bold=False)
    if t > PS[17] - 0.1:
        a = ease(t, PS[17] - 0.1, 0.3)
        cr.new_path(); cr.arc(LX, 820 + 120, 50, (t * 5) % 6.28, (t * 5) % 6.28 + 4.4); stroke(cr, (0.6, 0.6, 0.6), a, 7)
        text(cr, 'SIGUE ESPERANDO', LX, 1620, 40, GRAY, a)

def scene_G(cr, t):  # 18-22 shoes, two minutes, no quiere parar
    pawn(cr, LX, GROUND, 330, GRAY, False, 0.45)
    ganasbar(cr, LX, 0, 0.45, WHITE)
    run = t > ws(97)
    bob = abs(math.sin((t - ws(97)) * 9)) * 30 if run else 0
    sy = 1 - 0.08 * abs(math.sin((t - ws(97)) * 9)) if run else 1
    pawn(cr, RX, GROUND - bob, 330, WHITE, True, sy=sy)
    if t > ws(94) - 0.2:
        s = spring(t, ws(94) - 0.2, 8, 12)
        shoe(cr, RX - 50, GROUND - bob + 4, 0.75 * s, 1); shoe(cr, RX + 60, GROUND - bob + 4, 0.75 * s, 1)
    if t > PS[19] - 0.1 and t < PS[20] - 0.1:
        text(cr, 'SOLO ESO.', RX, 760, 80, YEL, ease(t, PS[19] - 0.1, 0.25), fam='Luckiest Guy')
    if t > PS[20] - 0.1:
        p = clamp((t - ws(97)) / (ws(103) - ws(97)))
        sec = int(120 * p)
        rrect(cr, RX - 170, 640, 340, 130, 20); cr.set_source_rgb(0, 0, 0); cr.fill_preserve(); stroke(cr, WHITE, ease(t, PS[20] - 0.1, 0.25), 4)
        text(cr, f'{sec // 60}:{sec % 60:02d}', RX, 705, 96, WHITE, ease(t, PS[20] - 0.1, 0.25), fam='Luckiest Guy', glow=p >= 1)
    gf = ease(t, ws(104), 1.4) if t > ws(104) else 0
    ganasbar(cr, RX, gf, 1, YEL)
    if t > ws(107) - 0.1:
        dx, dy = shake(t, ws(107), 14)
        text(cr, 'NO QUIERE PARAR', RX + dx, 1660 + dy, 46, YEL, ease(t, ws(107) - 0.1, 0.25), fam='Luckiest Guy')

def scene_H(cr, t):  # 23-25 chispa / humo / fuego
    pawn(cr, 540, GROUND, 260, WHITE, True)
    if t < PS[24] - 0.05:
        s = spring(t, ws(110) - 0.1, 8, 12)
        text(cr, 'MOTIVACIÓN', 540, 560, 74, WHITE, clamp(s), fam='Luckiest Guy')
        if t > ws(114) - 0.15:
            s2 = spring(t, ws(114) - 0.15, 9, 13)
            spark(cr, 540, 820, 2.2 * s2, 1); text(cr, '¿CHISPA?', 540, 1000, 64, YEL, clamp(s2), fam='Luckiest Guy')
            xmark(cr, 540, 820, 120, ease(t, ws(114) + 0.25, 0.3))
    else:
        fire_on = t > ws(123) - 0.2
        fh = 320 * spring(t, ws(123) - 0.2, 6, 8) if fire_on else 0
        # smoke first (as idea), then realised to come from fire
        sy0 = 990 - fh * 0.85 if fire_on else 1000
        smoke(cr, 540, sy0, t, PS[24] - 0.05, 1, 3, 0.9)
        text(cr, 'HUMO', 540, 560, 90, (0.75, 0.75, 0.75), ease(t, PS[24], 0.3), fam='Luckiest Guy')
        if fire_on:
            flame(cr, 540, 1010, fh, 1, t)
            text(cr, 'FUEGO = ACCIÓN', 540, 1520, 72, ORANGE, ease(t, ws(123), 0.3), fam='Luckiest Guy', outline=8)

def scene_I(cr, t):  # 26-28 enciende algo pequeño, HOY
    x = 540
    pawn(cr, x, GROUND, 340, WHITE, True)
    if t < PS[27] - 0.1:
        s = spring(t, PS[26] - 0.1, 8, 12)
        bubble(cr, 540, 760, 640, 220, s, ['NO ESPERES', 'A TENER GANAS'], WHITE, WHITE, 62, tail=False)
        xmark(cr, 540, 760, 90, ease(t, ws(130), 0.3), 0.85)
    else:
        fh = 120 * spring(t, ws(132) - 0.1, 7, 10) if t > ws(132) - 0.1 else 0
        cr.new_path(); cr.move_to(x + 120, 1050); cr.line_to(x + 160, 900); cr.set_line_cap(cairo.LINE_CAP_ROUND); stroke(cr, WHITE, 1, 10)
        flame(cr, x + 163, 905, fh + (360 * ease(t, ws(134), 0.5) if t > ws(134) else 0), 1, t)
        if t > ws(134) - 0.08:
            s = spring(t, ws(134) - 0.08, 9, 14); dx, dy = shake(t, ws(134), 26, 0.5)
            text(cr, 'HOY.', 540 + dx, 640 + dy, 300, YEL, 1, fam='Luckiest Guy', outline=14, glow=True, scale=lerp(1.7, 1, clamp(s)))
        elif t > ws(132) - 0.1:
            text(cr, 'ALGO PEQUEÑO', 540, 640, 92, WHITE, ease(t, ws(132) - 0.1, 0.25), fam='Luckiest Guy')

def scene_J(cr, t):  # 29-30 loop back
    pawn(cr, 540, GROUND, 380, WHITE, True)
    brain(cr, 540, 760, 170, WHITE, ease(t, PS[29] - 0.2, 0.4), 7, glow=True, pulse=abs(math.sin(t * 3.2)))
    if t > ws(141) - 0.15:
        s = spring(t, ws(141) - 0.15, 8, 12)
        bubble(cr, 800, 520, 330, 120, s, ['mañana...'], (0.6, 0.6, 0.6), YEL, 54, dashed=True)
    if t > PS[30] - 0.1:
        text(cr, 'RECUERDA:', 540, 1540, 120, WHITE, ease(t, PS[30] - 0.1, 0.25), fam='Luckiest Guy', outline=12)

SCENES = [(0, scene_A), (2, scene_B), (4, scene_C), (8, scene_D), (10, scene_E), (13, scene_F), (18, scene_G),
          (23, scene_H), (26, scene_I, 0.7), (29, scene_J)]

def frame(t):
    surf = cairo.ImageSurface(cairo.FORMAT_RGB24, W, H)
    cr = cairo.Context(surf); cr.set_source_rgb(0, 0, 0); cr.paint()
    idx = 0
    def st(e): return (PS[e[0]] - 0.25 + (e[2] if len(e) > 2 else 0)) if e[0] else 0
    for j, e in enumerate(SCENES):
        if t >= st(e): idx = j
    fn = SCENES[idx][1]; start = st(SCENES[idx])
    ground(cr)
    off = (1 - ease(t, start, 0.3)) * 120 if idx else 0
    cr.save(); cr.translate(off, 0); fn(cr, t); cr.restore()
    captions(cr, t)
    fa = ease(t, DUR + 0.15, 0.3)
    if fa > 0: cr.set_source_rgba(0, 0, 0, fa); cr.paint()
    return surf

if __name__ == '__main__':
    if len(sys.argv) > 2 and sys.argv[1] == 'stills':
        import os; D_ = os.environ.get('SD', 'stills'); os.makedirs(D_, exist_ok=True)
        for s in sys.argv[2].split(','):
            frame(float(s)).write_to_png(f'{D_}/s_{float(s):05.2f}.png')
        sys.exit()
    out = sys.argv[1] if len(sys.argv) > 1 else 'out/video.mp4'
    ff = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', f'{W}x{H}', '-r', str(FPS),
                           '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
    for f in range(NF):
        surf = frame(f / FPS); ff.stdin.write(bytes(surf.get_data()))
        if f % 300 == 0: print(f, '/', NF, flush=True)
    ff.stdin.close(); ff.wait()
