"""Builds JJ & Mikey's house as a Bedrock .mcstructure (little-endian NBT) plus worldgen JSON.
Best-effort recreation from memory: a cosy two-owner house, lime (JJ) on the west half, yellow (Mikey) on the east half."""
import struct, json, os, sys

# ---------- tiny little-endian NBT writer ----------
def _s(s): b = s.encode(); return struct.pack("<H", len(b)) + b
class Byte(int): pass
class Long(int): pass
class Float(float): pass
def _tid(v):
    if isinstance(v, Byte): return 1
    if isinstance(v, Long): return 4
    if isinstance(v, Float): return 5
    if isinstance(v, bool): return 1
    if isinstance(v, int): return 3
    if isinstance(v, str): return 8
    if isinstance(v, list): return 9
    if isinstance(v, dict): return 10
    raise TypeError(type(v))
def _payload(v):
    t = _tid(v)
    if t == 1: return struct.pack("<b", int(v))
    if t == 3: return struct.pack("<i", v)
    if t == 4: return struct.pack("<q", v)
    if t == 5: return struct.pack("<f", v)
    if t == 8: return _s(v)
    if t == 9:
        et = _tid(v[0]) if v else 0
        return struct.pack("<bi", et, len(v)) + b"".join(_payload(x) for x in v)
    if t == 10:
        return b"".join(bytes([_tid(x)]) + _s(k) + _payload(x) for k, x in v.items()) + b"\0"
def nbt(root): return bytes([10]) + _s("") + _payload(root)

# ---------- voxel grid ----------
SX, SY, SZ = 15, 14, 13           # house footprint (+1 overhang), foundation 3 deep
FY = 3                             # floor level (y index) -> foundation below
grid = {}
def put(x, y, z, name, **st): grid[(x, y, z)] = (name, tuple(sorted(st.items())))
def fill(x0, y0, z0, x1, y1, z1, name, **st):
    for x in range(x0, x1+1):
        for y in range(y0, y1+1):
            for z in range(z0, z1+1): put(x, y, z, name, **st)
def Y(n): return FY + n            # relative to floor

X0, X1, Z0, Z1 = 1, 13, 1, 11      # wall rectangle
# foundation + floor
fill(X0, 0, Z0, X1, FY-1, Z1, "minecraft:stone_bricks")
fill(X0, FY, Z0, X1, FY, Z1, "minecraft:spruce_planks")
# walls (white concrete) y1..y3
for y in range(1, 4):
    for x in range(X0, X1+1):
        put(x, Y(y), Z0, "minecraft:white_concrete"); put(x, Y(y), Z1, "minecraft:white_concrete")
    for z in range(Z0, Z1+1):
        put(X0, Y(y), z, "minecraft:white_concrete"); put(X1, Y(y), z, "minecraft:white_concrete")
# colour band y3: lime (JJ) west, yellow (Mikey) east
for x in range(X0, X1+1):
    c = "minecraft:lime_concrete" if x < 7 else "minecraft:yellow_concrete" if x > 7 else "minecraft:white_concrete"
    put(x, Y(3), Z0, c); put(x, Y(3), Z1, c)
for z in range(Z0, Z1+1):
    put(X0, Y(3), z, "minecraft:lime_concrete"); put(X1, Y(3), z, "minecraft:yellow_concrete")
# corner pillars
for (x, z) in ((X0, Z0), (X0, Z1), (X1, Z0), (X1, Z1)):
    fill(x, Y(1), z, x, Y(3), z, "minecraft:stripped_oak_log", pillar_axis="y")
# windows (y2)
for x in (3, 5, 9, 11):
    put(x, Y(2), Z0, "minecraft:glass_pane"); put(x, Y(2), Z1, "minecraft:glass_pane")
for z in (3, 5, 7, 9):
    put(X0, Y(2), z, "minecraft:glass_pane"); put(X1, Y(2), z, "minecraft:glass_pane")
# front door (south wall, x=7)
put(7, Y(1), Z1, "minecraft:oak_door", direction=1, door_hinge_bit=Byte(0), open_bit=Byte(0), upper_block_bit=Byte(0))
put(7, Y(2), Z1, "minecraft:oak_door", direction=1, door_hinge_bit=Byte(0), open_bit=Byte(0), upper_block_bit=Byte(1))
# path out front
fill(6, FY, Z1+1, 8, FY, Z1+1, "minecraft:stone_bricks")
# open beamed gable roof (dark oak): ridge along X, slopes N/S
# weirdo_direction: 2 = ascends south (north-edge stairs), 3 = ascends north (south-edge stairs)
for k in range(0, 6):
    y = Y(4 + k)
    for x in range(0, 15):
        put(x, y, k, "minecraft:dark_oak_stairs", weirdo_direction=2, upside_down_bit=Byte(0))
        put(x, y, 12 - k, "minecraft:dark_oak_stairs", weirdo_direction=3, upside_down_bit=Byte(0))
    # gable ends
    for z in range(k + 1, 12 - k):
        put(X0, y, z, "minecraft:white_concrete"); put(X1, y, z, "minecraft:white_concrete")
for x in range(0, 15): put(x, Y(10), 6, "minecraft:dark_oak_planks")
# gable end accent windows
put(X0, Y(5), 6, "minecraft:lime_stained_glass"); put(X1, Y(5), 6, "minecraft:yellow_stained_glass")
# ceiling beams
for x in (3, 7, 11):
    fill(x, Y(4), Z0, x, Y(4), Z1, "minecraft:dark_oak_log", pillar_axis="z")
# hanging lanterns
for (x, z) in ((3, 3), (3, 9), (11, 3), (11, 9), (7, 6)):
    put(x, Y(3), z, "minecraft:lantern", hanging=Byte(1))
    if (x, z) == (7, 6): fill(7, Y(4), 3, 7, Y(4), 9, "minecraft:dark_oak_log", pillar_axis="z")
# --- furniture ---
BED = []
def bed(x, z, color):
    # foot at z, head at z+1 (direction 0 = head toward +z)
    put(x, Y(1), z, "minecraft:bed", direction=0, head_piece_bit=Byte(0), occupied_bit=Byte(0))
    put(x, Y(1), z+1, "minecraft:bed", direction=0, head_piece_bit=Byte(1), occupied_bit=Byte(0))
    BED.append((x, Y(1), z, color)); BED.append((x, Y(1), z+1, color))
bed(2, 2, 5)    # lime  (JJ)
bed(12, 2, 4)   # yellow (Mikey)
put(3, Y(1), 2, "minecraft:chest", **{"minecraft:cardinal_direction": "south"})
put(11, Y(1), 2, "minecraft:chest", **{"minecraft:cardinal_direction": "south"})
put(6, Y(1), 2, "minecraft:crafting_table")
put(7, Y(1), 2, "minecraft:furnace", **{"minecraft:cardinal_direction": "south"})
put(8, Y(1), 2, "minecraft:smoker", **{"minecraft:cardinal_direction": "south"})
for z in (3, 4): put(6, Y(1), z, "minecraft:bookshelf"); put(8, Y(1), z, "minecraft:bookshelf")
# rugs
fill(3, Y(1), 5, 5, Y(1), 8, "minecraft:lime_carpet")
fill(9, Y(1), 5, 11, Y(1), 8, "minecraft:yellow_carpet")
fill(6, Y(1), 5, 8, Y(1), 8, "minecraft:white_carpet")
# table with stools
put(7, Y(1), 7, "minecraft:oak_fence"); put(7, Y(2), 7, "minecraft:oak_pressure_plate")
for (x, z, d) in ((6, 7, 1), (8, 7, 0), (7, 8, 3)):
    put(x, Y(1), z, "minecraft:spruce_stairs", weirdo_direction=d, upside_down_bit=Byte(0))
# flower pots / plants by door
put(5, Y(1), 10, "minecraft:potted_cactus" if False else "minecraft:flower_pot")
put(9, Y(1), 10, "minecraft:flower_pot")

# ---------- encode ----------
palette, index = [], {}
def pid(v):
    if v not in index:
        index[v] = len(palette)
        name, st = v
        states = {k: (x if isinstance(x, (Byte, int, str)) and not isinstance(x, bool) else Byte(int(x))) for k, x in st}
        palette.append({"name": name, "states": states, "version": 18153475})
    return index[v]
AIR = ("minecraft:air", ())
pid(AIR)
indices = [0] * (SX * SY * SZ)
for (x, y, z), v in grid.items():
    assert 0 <= x < SX and 0 <= y < SY and 0 <= z < SZ, (x, y, z)
    indices[x * SY * SZ + y * SZ + z] = pid(v)
posdata = {}
for (x, y, z, color) in BED:
    posdata[str(x * SY * SZ + y * SZ + z)] = {"block_entity_data": {"id": "Bed", "color": Byte(color), "isMovable": Byte(1),
                                                                   "x": x, "y": y, "z": z}}
def ent(ident, x, y, z, rot):
    return {"identifier": ident, "Pos": [Float(x), Float(y), Float(z)], "Rotation": [Float(rot), Float(0)],
            "Motion": [Float(0), Float(0), Float(0)], "OnGround": Byte(1), "Persistent": Byte(1)}
entities = [ent("jjmikey:jj", 4.5, Y(1), 7.5, 180.0), ent("jjmikey:mikey", 10.5, Y(1), 7.5, 180.0)]
root = {"format_version": 1, "size": [SX, SY, SZ],
        "structure": {"block_indices": [indices, [-1] * len(indices)], "entities": entities,
                      "palette": {"default": {"block_palette": palette, "block_position_data": posdata}}},
        "structure_world_origin": [0, 0, 0]}

def w(path, data, binary=False):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb" if binary else "w") as f:
        f.write(data) if binary else json.dump(data, f, indent=2)

if __name__ == "__main__":
    bp = sys.argv[1]
    w(f"{bp}/structures/jjmikey/house.mcstructure", nbt(root), True)
    FV = "1.21.100"
    biomes = {"any_of": [{"test": "has_biome_tag", "value": v} for v in ("plains", "forest", "taiga", "savanna")]}
    w(f"{bp}/worldgen/template_pools/house.json", {"format_version": FV, "minecraft:template_pool": {
        "description": {"identifier": "jjmikey:house_pool"},
        "elements": [{"weight": 1, "element": {"element_type": "minecraft:single_pool_element",
                                               "location": "jjmikey/house", "projection": "rigid"}}]}})
    w(f"{bp}/worldgen/structures/house.json", {"format_version": FV, "minecraft:jigsaw": {
        "description": {"identifier": "jjmikey:house"},
        "biome_filters": [biomes],
        "step": "surface_structures", "terrain_adaptation": "beard_thin",
        "start_pool": "jjmikey:house_pool", "max_depth": 1,
        "start_height": {"type": "constant", "value": {"absolute": -FY}},
        "heightmap_projection": "world_surface", "dimension_padding": 10}})
    w(f"{bp}/worldgen/structure_sets/house.json", {"format_version": FV, "minecraft:structure_set": {
        "description": {"identifier": "jjmikey:house"},
        "placement": {"type": "minecraft:random_spread", "salt": 20260611, "separation": 24, "spacing": 48, "spread_type": "linear"},
        "structures": [{"structure": "jjmikey:house", "weight": 1}]}})
    print("house blocks:", len(grid), "palette:", len(palette))
