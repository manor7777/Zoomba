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

bottle(*PINK).save("Zoomba_RP/textures/items/baby_potion.png")
bottle(*GREEN).save("Zoomba_RP/textures/items/growth_potion.png")

# Pack icon: both potions side by side on a dark tile.
icon = Image.new("RGBA", (16, 16), (38, 34, 52, 255))
for src, dx in (("baby_potion", -4), ("growth_potion", 4)):
    p = Image.open(f"Zoomba_RP/textures/items/{src}.png")
    tmp = Image.new("RGBA", (16, 16), (0, 0, 0, 0)); tmp.paste(p, (dx // 2, 0), p)
    icon.alpha_composite(tmp)
icon = icon.resize((256, 256), Image.NEAREST)
icon.save("Zoomba_RP/pack_icon.png"); icon.save("Zoomba_BP/pack_icon.png")
