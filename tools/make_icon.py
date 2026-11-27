"""Draws a different pack icon for every version (seeded by tools/VERSION) with the version number on it,
so the packs are easy to tell apart in Minecraft's list. Run by build.py."""
import os, random, colorsys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

def hsv(h, s, v, a=255):
    r, g, b = colorsys.hsv_to_rgb(h % 1, s, v)
    return (int(r * 255), int(g * 255), int(b * 255), a)

STAMPS = {  # tiny pixel art, 1 = filled
    "heart": ["0110110", "1111111", "1111111", "0111110", "0011100", "0001000"],
    "diamond": ["0011100", "0111110", "1111111", "0111110", "0011100", "0001000"],
    "star": ["0001000", "0001000", "1111111", "0111110", "0110110", "1100011"],
    "creeper": ["1100011", "1100011", "0011100", "0111110", "0111110", "0110110"],
    "bolt": ["0001110", "0011100", "0111110", "0001100", "0011000", "0110000"],
}

def font(size):
    try: return ImageFont.load_default(size)
    except TypeError: return ImageFont.load_default()

def make(version, out_path):
    rnd = random.Random("jjmikey-icon-" + version)
    S = 256
    h0 = rnd.random(); h1 = h0 + rnd.choice([0.33, 0.5, 0.17, 0.66])
    c0, c1 = hsv(h0, rnd.uniform(.55, .85), rnd.uniform(.45, .7)), hsv(h1, rnd.uniform(.5, .85), rnd.uniform(.75, .95))
    img = Image.new("RGBA", (S, S), c0); d = ImageDraw.Draw(img)
    style = rnd.choice(["gradient", "rays", "stripes", "checker", "dots", "plaid"])
    if style == "gradient":
        ang = rnd.choice([0, 1])
        for i in range(S):
            t = i / (S - 1); col = tuple(int(c0[k] + (c1[k] - c0[k]) * t) for k in range(3)) + (255,)
            d.line([(i, 0), (i, S)] if ang else [(0, i), (S, i)], fill=col)
    elif style == "rays":
        n = rnd.choice([10, 14, 18]); cx, cy = rnd.randint(80, 176), rnd.randint(80, 176)
        for i in range(n):
            a0, a1 = 360 / n * i, 360 / n * (i + 0.5)
            d.pieslice([cx - 400, cy - 400, cx + 400, cy + 400], a0, a1, fill=c1 if i % 2 == 0 else c0)
    elif style == "stripes":
        w = rnd.choice([16, 24, 32]); diag = rnd.random() < .5
        for i in range(-S, S * 2, w * 2):
            d.polygon([(i, 0), (i + w, 0), (i + w + (S if diag else 0), S), (i + (S if diag else 0), S)], fill=c1)
    elif style == "checker":
        w = rnd.choice([16, 32, 64])
        for y in range(0, S, w):
            for x in range(0, S, w):
                if (x // w + y // w) % 2: d.rectangle([x, y, x + w - 1, y + w - 1], fill=c1)
    elif style == "dots":
        r = rnd.choice([6, 9, 12]); step = r * 3
        d.rectangle([0, 0, S, S], fill=c0)
        for y in range(0, S + step, step):
            for x in range(-step, S + step, step):
                d.ellipse([x + (step // 2 if (y // step) % 2 else 0) - r, y - r, x + (step // 2 if (y // step) % 2 else 0) + r, y + r], fill=c1)
    else:  # plaid
        w = rnd.choice([20, 28, 40]); ov = Image.new("RGBA", (S, S), (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
        for i in range(0, S, w * 2):
            od.rectangle([i, 0, i + w, S], fill=c1[:3] + (150,)); od.rectangle([0, i, S, i + w], fill=c1[:3] + (150,))
        img.alpha_composite(ov)

    # decorative pixel stamps
    acc = hsv(h0 + .5 + rnd.uniform(-.05, .05), .35, 1.0)
    for _ in range(rnd.randint(3, 6)):
        name = rnd.choice(list(STAMPS)); px = rnd.choice([4, 5, 6]); x, y = rnd.randint(4, S - 50), rnd.randint(4, S - 50)
        for r_, row in enumerate(STAMPS[name]):
            for c_, v in enumerate(row):
                if v == "1": d.rectangle([x + c_ * px, y + r_ * px, x + c_ * px + px - 1, y + r_ * px + px - 1], fill=acc)

    # JJ and Mikey (from the real skins: head + hat layer)
    layout = rnd.choice(["side", "stack", "overlap"])
    size = {"side": 104, "stack": 72, "overlap": 96}[layout]
    def face(n):
        s = Image.open(f"{ROOT}/JJ_Mikey_RP/textures/entity/{n}.png").convert("RGBA")
        f = s.crop((8, 8, 16, 16)); h = s.crop((40, 8, 48, 16)); f.paste(h, (0, 0), h)
        return f.resize((size, size), Image.NEAREST)
    pair = [("jj", face("jj")), ("mikey", face("mikey"))]
    if rnd.random() < .5: pair.reverse()
    spots = {"side": [(18, 56), (134, 56)], "stack": [(92, 10), (92, 98)], "overlap": [(30, 40), (120, 70)]}[layout]
    for (n, f), (x, y) in zip(pair, spots):
        d.rectangle([x - 6, y - 6, x + size + 5, y + size + 5], fill=(20, 20, 24, 255))
        d.rectangle([x - 3, y - 3, x + size + 2, y + size + 2], fill=(250, 250, 250, 255))
        img.paste(f, (x, y), f)

    # version banner
    txt = "v" + version
    big = font(46)
    tw = d.textlength(txt, font=big)
    bw, bh = int(tw + 36), 64
    bx, by = (S - bw) // 2, S - bh - 10
    d.rounded_rectangle([bx + 4, by + 4, bx + bw + 4, by + bh + 4], 14, fill=(0, 0, 0, 150))
    d.rounded_rectangle([bx, by, bx + bw, by + bh], 14, fill=(18, 18, 22, 240), outline=acc, width=4)
    d.text((bx + 18, by + 8), txt, font=big, fill=(255, 255, 255, 255))
    img.save(out_path)
    return {"style": style, "layout": layout}

if __name__ == "__main__":
    ver = open(f"{HERE}/VERSION").read().strip()
    for pack in ("JJ_Mikey_RP", "JJ_Mikey_BP"):
        info = make(ver, f"{ROOT}/{pack}/pack_icon.png")
    print("icon", ver, info)
