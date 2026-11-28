"""Generate the potion item icons (16x16) and pack icons. Requires Pillow."""
from PIL import Image

OUTLINE = (52, 46, 66, 255)
GLASS = (206, 224, 240, 255)
GLASS_HI = (245, 250, 255, 255)
CORK = (155, 106, 58, 255)
CORK_DK = (120, 78, 40, 255)

def bottle(liquid, liquid_hi, liquid_dk):
    img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    px = img.load()
    cx, cy, rx, ry = 7.5, 10.5, 5.6, 4.7
    def inside(x, y, k=1.0):
        return ((x - cx) / (rx * k)) ** 2 + ((y - cy) / (ry * k)) ** 2 <= 1.0
    for y in range(16):
        for x in range(16):
            if inside(x, y):
                px[x, y] = OUTLINE if not inside(x, y, 0.78) else GLASS
                if inside(x, y, 0.78) and y >= 10:
                    px[x, y] = liquid
                    if y == 10: px[x, y] = liquid_hi
                    if y >= 13: px[x, y] = liquid_dk
    for y in (3, 4, 5):                       # neck
        px[6, y] = OUTLINE; px[9, y] = OUTLINE
        px[7, y] = GLASS; px[8, y] = GLASS
    for x in range(5, 11): px[x, 3] = OUTLINE  # lip
    for x in range(6, 10):                     # cork
        for y in (1, 2):
            px[x, y] = CORK if y == 1 else CORK_DK
    for x in range(6, 10): px[x, 0] = OUTLINE
    px[6, 1] = OUTLINE; px[9, 1] = OUTLINE; px[6, 2] = OUTLINE; px[9, 2] = OUTLINE
    px[4, 9] = GLASS_HI; px[4, 10] = GLASS_HI; px[5, 8] = GLASS_HI  # shine
    return img

PINK = ((255, 120, 190, 255), (255, 170, 215, 255), (214, 80, 150, 255))
GREEN = ((110, 215, 70, 255), (165, 240, 120, 255), (70, 165, 45, 255))

bottle(*PINK).save("Tiny_Tonics_RP/textures/items/baby_potion.png")
bottle(*GREEN).save("Tiny_Tonics_RP/textures/items/growth_potion.png")

# --- baby bottle ---
def rect(px, x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            px[x, y] = c

O = (52, 46, 66, 255); MILK = (250, 248, 240, 255); MILK_DK = (222, 216, 205, 255)
BLUE = (110, 170, 235, 255); BLUE_DK = (70, 120, 200, 255); TEAT = (236, 190, 120, 255); TEAT_DK = (200, 150, 85, 255)
bt = Image.new("RGBA", (16, 16), (0, 0, 0, 0)); b = bt.load()
rect(b, 7, 0, 8, 0, O); rect(b, 6, 1, 9, 3, O)            # teat outline
rect(b, 7, 1, 8, 3, TEAT); b[8, 2] = TEAT_DK; b[8, 3] = TEAT_DK
rect(b, 4, 4, 11, 5, O); rect(b, 5, 4, 10, 4, BLUE); rect(b, 5, 5, 10, 5, BLUE_DK)   # collar
rect(b, 4, 6, 11, 15, O); rect(b, 5, 6, 10, 14, GLASS)    # bottle body
rect(b, 5, 8, 10, 14, MILK); rect(b, 5, 13, 10, 14, MILK_DK)
for yy in (9, 11): rect(b, 5, yy, 6, yy, BLUE)             # measuring marks
rect(b, 5, 15, 10, 15, O); b[9, 7] = GLASS_HI; b[9, 6] = GLASS_HI
bt.save("Tiny_Tonics_RP/textures/items/baby_bottle.png")

# --- rattle ---
rt = Image.new("RGBA", (16, 16), (0, 0, 0, 0)); r = rt.load()
cx, cy = 10.5, 5.5
for y in range(16):
    for x in range(16):
        d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
        if d <= 4.6: r[x, y] = O
        if d <= 3.6: r[x, y] = (255, 130, 190, 255)
        if d <= 3.6 and (x + y) % 5 == 0: r[x, y] = (255, 235, 120, 255)
        if d <= 3.6 and x < cx and y < cy and d > 1.8: r[x, y] = (255, 175, 215, 255)
for i in range(6):                                          # handle
    x, y = 8 - i, 8 + i
    r[x, y] = O; r[x + 1, y] = (250, 215, 90, 255); r[x + 2, y] = O
for (x, y) in ((1, 14), (2, 14), (1, 15), (2, 15), (0, 14), (0, 15), (1, 13), (2, 13)):  # end ring
    if 0 <= x < 16: r[x, y] = O
rect(r, 1, 14, 1, 15, (250, 215, 90, 255)); r[2, 14] = (250, 215, 90, 255)
rt.save("Tiny_Tonics_RP/textures/items/rattle.png")

# --- sour sweet: wrapped candy with a puckered face ---
sw = Image.new("RGBA", (16, 16), (0, 0, 0, 0)); q = sw.load()
GRN = (150, 225, 70, 255); GRN_DK = (100, 170, 40, 255); YEL = (250, 230, 90, 255)
rect(q, 4, 5, 11, 10, O); rect(q, 5, 6, 10, 9, GRN); rect(q, 5, 9, 10, 9, GRN_DK); rect(q, 5, 6, 10, 6, YEL)
for (x0, x1, c) in ((1, 3, YEL), (12, 14, YEL)):            # twisted wrapper ends
    rect(q, x0, 4, x1, 11, O); rect(q, x0 + (0 if x0 < 5 else 1), 5, x1 - (1 if x0 < 5 else 0), 10, c)
q[1, 4] = (0, 0, 0, 0); q[1, 11] = (0, 0, 0, 0); q[14, 4] = (0, 0, 0, 0); q[14, 11] = (0, 0, 0, 0)
q[6, 7] = O; q[9, 7] = O; rect(q, 7, 8, 8, 8, O)            # scrunched face
sw.save("Tiny_Tonics_RP/textures/items/sour_sweet.png")

# --- pacifier ---
pc = Image.new("RGBA", (16, 16), (0, 0, 0, 0)); c_ = pc.load()
PINKB = (255, 150, 200, 255); PINKD = (225, 105, 160, 255)
rect(c_, 6, 1, 9, 5, O); rect(c_, 7, 1, 8, 5, TEAT); c_[8, 2] = TEAT_DK; c_[8, 3] = TEAT_DK  # teat
rect(c_, 2, 6, 13, 10, O); rect(c_, 3, 7, 12, 9, BLUE); rect(c_, 3, 9, 12, 9, BLUE_DK)       # shield
rect(c_, 7, 6, 8, 6, TEAT)
rect(c_, 6, 11, 9, 14, O); rect(c_, 7, 11, 8, 13, PINKB); rect(c_, 7, 13, 8, 13, PINKD)       # button
rect(c_, 6, 14, 9, 14, O)
c_[4, 7] = GLASS_HI; c_[5, 7] = GLASS_HI
pc.save("Tiny_Tonics_RP/textures/items/pacifier.png")

# --- pacifier attachable texture (16x16; shield uv(0,0) 12x3, teat uv(0,4) 4x2, ring uv(0,8) 6x3) ---
pt = Image.new("RGBA", (16, 16), (0, 0, 0, 0)); t_ = pt.load()
rect(t_, 0, 0, 11, 2, BLUE); rect(t_, 0, 2, 11, 2, BLUE_DK)
rect(t_, 0, 4, 3, 5, TEAT); rect(t_, 0, 5, 3, 5, TEAT_DK)
rect(t_, 0, 8, 5, 10, PINKB); rect(t_, 0, 10, 5, 10, PINKD)
pt.save("Tiny_Tonics_RP/textures/attachable/tonics_pacifier.png")

# --- nappy texture for the 9x5x5 box (box-UV layout in a 32x16 sheet) ---
W_ = (244, 244, 250, 255); W_SH = (214, 216, 232, 255); TAPE = (250, 215, 90, 255); BAND = (140, 195, 245, 255)
nd = Image.new("RGBA", (32, 16), (0, 0, 0, 0)); n = nd.load()
rect(n, 5, 0, 22, 4, W_SH)       # top (5..13) + bottom (14..22)
rect(n, 0, 5, 27, 9, W_)         # sides: left, front, right, back
rect(n, 0, 5, 27, 6, BAND)       # waistband all the way round
rect(n, 0, 9, 27, 9, W_SH)       # shaded lower edge
rect(n, 8, 7, 10, 8, TAPE)       # yellow duck/dot on the front
n[10, 7] = (255, 150, 60, 255)   # beak
rect(n, 19, 7, 20, 8, TAPE); rect(n, 26, 7, 27, 8, TAPE)   # tape tabs on the back
nd.save("Tiny_Tonics_RP/textures/entity/tonics_diaper.png")

# Pack icon: small Youth bottle beside a big Growth bottle, on a gradient with sparkles.
W = 128
icon = Image.new("RGBA", (W, W))
ipx = icon.load()
top, bot = (58, 34, 110), (24, 120, 140)
for y in range(W):
    t = y / (W - 1)
    c = tuple(int(top[k] + (bot[k] - top[k]) * t) for k in range(3)) + (255,)
    for x in range(W):
        ipx[x, y] = c
# soft vignette so the bottles pop
for y in range(W):
    for x in range(W):
        d = ((x - 64) ** 2 + (y - 68) ** 2) ** 0.5 / 90
        f = max(0.0, d - 0.55) * 0.9
        r, g, b, a = ipx[x, y]
        ipx[x, y] = (int(r * (1 - f)), int(g * (1 - f)), int(b * (1 - f)), 255)

def paste_scaled(path, scale, x, y):
    p = Image.open(path).resize((16 * scale, 16 * scale), Image.NEAREST)
    shadow = Image.new("RGBA", p.size, (0, 0, 0, 0))
    sp, pp = shadow.load(), p.load()
    for yy in range(p.height):
        for xx in range(p.width):
            if pp[xx, yy][3]: sp[xx, yy] = (0, 0, 0, 90)
    icon.alpha_composite(shadow, (x + scale, y + scale))
    icon.alpha_composite(p, (x, y))

paste_scaled("Tiny_Tonics_RP/textures/items/baby_potion.png", 3, 10, 66)    # small
paste_scaled("Tiny_Tonics_RP/textures/items/growth_potion.png", 6, 26, 14)  # big

def sparkle(cx, cy, r, color):
    for d in range(-r, r + 1):
        a = 255 if abs(d) < r else 160
        for (x, y) in ((cx + d, cy), (cx, cy + d)):
            if 0 <= x < W and 0 <= y < W: icon.putpixel((x, y), color[:3] + (a,))
    icon.putpixel((cx, cy), (255, 255, 255, 255))
sparkle(20, 24, 6, (255, 240, 170)); sparkle(112, 36, 4, (255, 255, 255))
sparkle(108, 100, 7, (255, 240, 170)); sparkle(14, 104, 3, (255, 255, 255))
sparkle(70, 8, 3, (255, 255, 255))

icon = icon.resize((256, 256), Image.NEAREST)
icon.save("Tiny_Tonics_RP/pack_icon.png"); icon.save("Tiny_Tonics_BP/pack_icon.png")
