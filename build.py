#!/usr/bin/env python3
"""Zip both packs into dist/Zoomba.mcaddon (what Minecraft imports on iPad)."""
import json, pathlib, zipfile

root = pathlib.Path(__file__).parent
for p in root.glob("Zoomba_*/**/*.json"):      # fail the build on broken JSON
    json.loads(p.read_text())

out = root / "dist" / "Zoomba.mcaddon"
out.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for pack in ("Zoomba_BP", "Zoomba_RP"):
        for f in sorted((root / pack).rglob("*")):
            if f.is_file():
                z.write(f, f.relative_to(root).as_posix())
print("built", out, out.stat().st_size, "bytes")
