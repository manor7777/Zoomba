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
