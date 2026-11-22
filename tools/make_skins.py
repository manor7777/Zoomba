"""Generates 64x64 Minecraft skins for JJ and Mikey (original pixel-art recreations)."""
from PIL import Image
import random

def box(img, u, v, w, h, d, painter):
    # faces: (name, x, y, fw, fh)
    faces = {
        "top":    (u + d,         v,     w, d),
        "bottom": (u + d + w,     v,     w, d),
        "right":  (u,             v + d, d, h),
        "front":  (u + d,         v + d, w, h),
        "left":   (u + d + w,     v + d, d, h),
        "back":   (u + 2*d + w,   v + d, w, h),
    }
    for name, (x, y, fw, fh) in faces.items():
        for j in range(fh):
            for i in range(fw):
                c = painter(name, i, j, fw, fh)
                if c:
                    img.putpixel((x + i, y + j), c)

def hexc(s, a=255):
    s = s.lstrip("#")
    return (int(s[0:2],16), int(s[2:4],16), int(s[4:6],16), a)

def shade(c, f):
    return tuple(max(0, min(255, int(v*f))) for v in c[:3]) + (c[3],)

def make(name, p):
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    skin, hair, hood, pants, shoe = (hexc(p[k]) for k in ("skin","hair","hood","pants","shoe"))
    eye, mouth, string = hexc("#ffffff"), hexc("#a8525a"), hexc("#e8e8e8")
    pupil = hexc(p["eyes"])
    rnd = random.Random(name)

    def noise(c): return shade(c, 1 + rnd.uniform(-0.04, 0.04))

    def head(face, i, j, w, h):
        if face == "top" or face == "back": return noise(hair)
        if face in ("left", "right"):
            return noise(hair) if j < 3 or i > 5 and face == "right" or (face=="left" and i < 2) else noise(skin)
        if face == "bottom": return noise(skin)
        # front
        if j < 2: return noise(hair)
        if j == 2 and (i < 1 or i > 6 or p.get("fringe") and i % 2 == 0): return noise(hair)
        if j == 2 and p.get("fringe"): return noise(hair)
        if j == 4 and i in (1, 2): return eye
        if j == 4 and i in (5, 6): return eye
        if j == 4 and i in (2,): return pupil
        if j == 5 and i in (2, 5): return pupil
        if j == 4 and i in (1,6): return eye
        if j == 6 and 3 <= i <= 4: return mouth
        if j == 4 and p.get("glasses") and i in (0,3,4,7): return hexc("#222222")
        return noise(skin)
    # fix eyes: whites outer, pupils inner row 5
    def head_front_fix(face, i, j, w, h):
        c = head(face, i, j, w, h)
        if face == "front":
            if j == 4 and i in (1, 6): return eye
            if j == 4 and i in (2, 5): return pupil
            if j == 5 and i in (1, 6): return None or noise(skin)
            if j == 5 and i in (2, 5): return noise(skin)
        return c
    box(img, 0, 0, 8, 8, 8, head_front_fix)

    def hoodie_body(face, i, j, w, h):
        c = noise(hood)
        if face == "front":
            if j == 0 and 2 <= i <= 5: return noise(skin) if j == 0 and 3 <= i <= 4 else shade(hood, 0.8)
            if j in (1, 2) and i in (3, 4): return string
            if 8 <= j <= 10 and (i < 1 or i > 6): return shade(hood, 0.85)
            if j >= 8 and 1 <= i <= 6 and j == 8: return shade(hood, 0.8)
            if p.get("logo") and 4 <= j <= 7 and 2 <= i <= 5:
                return hexc(p["logo"])
        if face == "bottom": return shade(hood, 0.7)
        if j == h - 1: return shade(hood, 0.8)
        return c
    box(img, 16, 16, 8, 12, 4, hoodie_body)

    def sleeve(face, i, j, w, h):
        if face == "bottom": return noise(skin)
        if j >= 10: return noise(skin)
        if j == 9: return shade(hood, 0.8)
        return noise(hood)
    box(img, 40, 16, 4, 12, 4, sleeve)
    box(img, 32, 48, 4, 12, 4, sleeve)

    def leg(face, i, j, w, h):
        if face == "bottom": return shade(shoe, 0.8)
        if j >= 10: return noise(shoe)
        if j == 9: return shade(pants, 0.8)
        return noise(pants)
    box(img, 0, 16, 4, 12, 4, leg)
    box(img, 16, 48, 4, 12, 4, leg)
    return img

JJ = dict(skin="#e8b98f", hair="#4a2f1c", hood="#2fbf3a", pants="#2c3e6b", shoe="#f2f2f2", eyes="#2a7a2a", logo=None)
MIKEY = dict(skin="#e8b98f", hair="#17120f", hood="#f2c618", pants="#34383f", shoe="#f2f2f2", eyes="#3a2a1a", logo=None, fringe=True)

if __name__ == "__main__":
    import sys
    out = sys.argv[1]
    make("jj", JJ).save(f"{out}/jj.png")
    make("mikey", MIKEY).save(f"{out}/mikey.png")
    # pack icon: big face of each, side by side
    icon = Image.new("RGBA", (256, 256), hexc("#1f3a5f"))
    for k, (nm, pp) in enumerate((("jj", JJ), ("mikey", MIKEY))):
        s = make(nm, pp)
        f = s.crop((8, 8, 16, 16)).resize((112, 112), Image.NEAREST)
        icon.paste(f, (12 + k*120, 72), f)
    icon.save(f"{out}/../../pack_icon.png")
