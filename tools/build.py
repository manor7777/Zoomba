import json, os, zipfile, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lines import LINES, CATS

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BP, RP = f"{ROOT}/JJ_Mikey_BP", f"{ROOT}/JJ_Mikey_RP"
# fixed UUIDs so re-installing updates the same pack
BP_U, BP_M, RP_U, RP_M, BP_S = ("6f1d2c3e-1a2b-4c5d-8e9f-0a1b2c3d4e01", "6f1d2c3e-1a2b-4c5d-8e9f-0a1b2c3d4e02",
                                "6f1d2c3e-1a2b-4c5d-8e9f-0a1b2c3d4e03", "6f1d2c3e-1a2b-4c5d-8e9f-0a1b2c3d4e04",
                                "6f1d2c3e-1a2b-4c5d-8e9f-0a1b2c3d4e05")
VS = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "VERSION")).read().strip()
V = [int(x) for x in open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "VERSION")).read().strip().split(".")]
EGG = {"jj": ("#aa0000", "#5c342b"), "mikey": ("#45a22c", "#1d5412")}   # taken from the skins

def w(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(data) if isinstance(data, str) else json.dump(data, f, indent=2)

w(f"{BP}/manifest.json", {"format_version": 2,
  "header": {"name": f"JJ & Mikey Friends (Behavior) v{VS}", "description": f"Interactive JJ and Mikey buddies, version {VS}", "uuid": BP_U, "version": V, "min_engine_version": [1, 21, 100]},
  "modules": [{"type": "data", "uuid": BP_M, "version": V},
              {"type": "script", "language": "javascript", "uuid": BP_S, "version": V, "entry": "scripts/main.js"}],
  "dependencies": [{"uuid": RP_U, "version": V},
                   {"module_name": "@minecraft/server", "version": "2.0.0"},
                   {"module_name": "@minecraft/server-ui", "version": "2.0.0"}]})
w(f"{RP}/manifest.json", {"format_version": 2,
  "header": {"name": f"JJ & Mikey Friends (Skins) v{VS}", "description": f"Skins and voices for JJ and Mikey, version {VS}", "uuid": RP_U, "version": V, "min_engine_version": [1, 21, 100]},
  "modules": [{"type": "resources", "uuid": RP_M, "version": V}]})

# dialogue data for the script
data = {k: {"name": c["name"], "color": c["color"], "gifts": c["gifts"],
            **{cat: [{"id": i, "text": t, "when": wh} for (i, t, wh) in c[cat]] for cat in CATS}} for k, c in LINES.items()}
w(f"{BP}/scripts/lines.js", "export const LINES = " + json.dumps(data, indent=1, ensure_ascii=False) + ";\n")

for key, c in LINES.items():
    n = c["name"]
    bp = {"format_version": "1.21.0", "minecraft:entity": {
      "description": {"identifier": f"jjmikey:{key}", "is_spawnable": True, "is_summonable": True, "is_experimental": False,
                       "properties": {"jjmikey:sit": {"type": "bool", "default": False, "client_sync": True},
                                      "jjmikey:crouch": {"type": "bool", "default": False, "client_sync": True}}},
      "component_groups": {
        "tamed": {
          "minecraft:is_tamed": {},
          "minecraft:behavior.follow_owner": {"priority": 4, "speed_multiplier": 1.2, "start_distance": 8, "stop_distance": 3},
          "minecraft:behavior.owner_hurt_by_target": {"priority": 1},
          "minecraft:behavior.owner_hurt_target": {"priority": 2},
          # punches hostile mobs near you on its own, so it also works in creative (where you never get hurt)
          "minecraft:behavior.nearest_attackable_target": {"priority": 3, "must_see": False, "reselect_targets": True, "attack_interval": 10,
              "entity_types": [{"max_dist": 14, "filters": {"all_of": [
                  {"test": "is_family", "subject": "other", "value": "monster"},
                  {"test": "is_family", "subject": "other", "operator": "!=", "value": "creeper"}]}}]},
          "minecraft:behavior.melee_attack": {"priority": 3, "speed_multiplier": 1.2, "track_target": True}
        },
        "stay": {"minecraft:movement": {"value": 0.0}},
        "flee": {"minecraft:behavior.avoid_mob_type": {"priority": 0, "remove_target": False, "entity_types": [
            {"filters": {"test": "is_family", "subject": "other", "value": "player"}, "max_dist": 12,
             "walk_speed_multiplier": 1.3, "sprint_speed_multiplier": 1.7}]}}
      },
      "components": {
        "minecraft:type_family": {"family": ["jj_mikey", "friend"]},
        "minecraft:collision_box": {"width": 0.6, "height": 1.9},
        "minecraft:health": {"value": 30, "max": 30},
        "minecraft:movement": {"value": 0.27},
        "minecraft:movement.basic": {},
        "minecraft:navigation.walk": {"can_path_over_water": False, "avoid_water": True, "can_open_doors": True, "can_pass_doors": True, "avoid_damage_blocks": True},
        "minecraft:jump.static": {},
        "minecraft:can_climb": {},
        "minecraft:attack": {"damage": 4},
        "minecraft:physics": {},
        "minecraft:pushable": {"is_pushable": True, "is_pushable_by_piston": True},
        "minecraft:nameable": {},
        "minecraft:persistent": {},
        "minecraft:fall_damage": {"value": 1.0},
        "minecraft:tameable": {"probability": 1.0, "tame_items": ["cookie", "golden_apple"],
                               "tame_event": {"event": "jjmikey:on_tame", "target": "self"}},
        "minecraft:behavior.float": {"priority": 0},
        "minecraft:behavior.panic": {"priority": 1, "speed_multiplier": 1.3},
        "minecraft:behavior.random_stroll": {"priority": 6, "speed_multiplier": 0.8},
        "minecraft:behavior.look_at_player": {"priority": 7, "look_distance": 8},
        "minecraft:behavior.random_look_around": {"priority": 8}
      },
      "events": {
        "jjmikey:on_tame": {"add": {"component_groups": ["tamed"]},
                            "queue_command": {"command": ["tag @s add jjmikey_tamed",
                                'tellraw @a[r=10] {"rawtext":[{"text":"%s%s§r: %s"}]}' % (c["color"], n, c["tamed"][0][1]),
                                "playsound jjmikey.%s.%s @a[r=16,tag=!jjmikey_mute] ~ ~ ~ 1 1" % (key, c["tamed"][0][0])]}},
        "jjmikey:stay": {"add": {"component_groups": ["stay"]}},
        "jjmikey:sit": {"add": {"component_groups": ["stay"]}, "set_property": {"jjmikey:sit": True}},
        "jjmikey:crouch_on": {"set_property": {"jjmikey:crouch": True}},
        "jjmikey:crouch_off": {"set_property": {"jjmikey:crouch": False}},
        "jjmikey:flee_on": {"add": {"component_groups": ["flee"]}},
        "jjmikey:flee_off": {"remove": {"component_groups": ["flee"]}},
        "jjmikey:go": {"remove": {"component_groups": ["stay"]}, "set_property": {"jjmikey:sit": False}}
      }}}
    w(f"{BP}/entities/{key}.json", bp)
    w(f"{BP}/spawn_rules/{key}.json", {"format_version": "1.8.0", "minecraft:spawn_rules": {
        "description": {"identifier": f"jjmikey:{key}", "population_control": "animal"},
        "conditions": [{
            "minecraft:spawns_on_surface": {},
            "minecraft:spawns_on_block_filter": ["minecraft:grass_block", "minecraft:dirt", "minecraft:sand", "minecraft:snow", "minecraft:podzol"],
            "minecraft:biome_filter": {"test": "has_biome_tag", "operator": "==", "value": "overworld"},
            "minecraft:density_limit": {"surface": 1},
            "minecraft:weight": {"default": 2},
            "minecraft:herd": {"min_size": 1, "max_size": 1},
            "minecraft:distance_filter": {"min": 24, "max": 128}}]}})
    w(f"{RP}/entity/{key}.entity.json", {"format_version": "1.10.0", "minecraft:client_entity": {"description": {
        "identifier": f"jjmikey:{key}",
        "materials": {"default": "entity_alphatest"},
        "textures": {"default": f"textures/entity/{key}"},
        "geometry": {"default": "geometry.jjmikey.humanoid"},
        "animations": {"move": "animation.humanoid.move", "base_pose": "animation.humanoid.base_pose",
                       "look_at_target": "animation.humanoid.look_at_target.default",
                       "sit": "animation.jjmikey.sit", "crouch": "animation.jjmikey.crouch"},
        "scripts": {"animate": ["base_pose", {"move": "query.is_moving && !query.property('jjmikey:sit')"}, "look_at_target",
                                {"sit": "query.property('jjmikey:sit')"}, {"crouch": "query.property('jjmikey:crouch')"}]},
        "render_controllers": ["controller.render.default"],
        "spawn_egg": {"base_color": EGG[key][0], "overlay_color": EGG[key][1]}}}})

def cube(ox, oy, oz, sx, sy, sz, u, v, infl=0.0):
    c = {"origin": [ox, oy, oz], "size": [sx, sy, sz], "uv": [u, v]}
    if infl: c["inflate"] = infl
    return c
def bone(name, parent, pivot, cubes=None):
    b = {"name": name, "pivot": pivot}
    if parent: b["parent"] = parent
    if cubes: b["cubes"] = cubes
    return b
w(f"{RP}/models/entity/jjmikey.geo.json", {"format_version": "1.12.0", "minecraft:geometry": [{
    "description": {"identifier": "geometry.jjmikey.humanoid", "texture_width": 64, "texture_height": 64,
                    "visible_bounds_width": 2, "visible_bounds_height": 3, "visible_bounds_offset": [0, 1.5, 0]},
    "bones": [
        bone("root", None, [0, 0, 0]),
        bone("body", "root", [0, 24, 0], [cube(-4, 12, -2, 8, 12, 4, 16, 16)]),
        bone("jacket", "body", [0, 24, 0], [cube(-4, 12, -2, 8, 12, 4, 16, 32, 0.25)]),
        bone("head", "root", [0, 24, 0], [cube(-4, 24, -4, 8, 8, 8, 0, 0)]),
        bone("hat", "head", [0, 24, 0], [cube(-4, 24, -4, 8, 8, 8, 32, 0, 0.5)]),
        bone("rightArm", "root", [-5, 22, 0], [cube(-8, 12, -2, 4, 12, 4, 40, 16)]),
        bone("rightSleeve", "rightArm", [-5, 22, 0], [cube(-8, 12, -2, 4, 12, 4, 40, 32, 0.25)]),
        bone("leftArm", "root", [5, 22, 0], [cube(4, 12, -2, 4, 12, 4, 32, 48)]),
        bone("leftSleeve", "leftArm", [5, 22, 0], [cube(4, 12, -2, 4, 12, 4, 48, 48, 0.25)]),
        bone("rightLeg", "root", [-1.9, 12, 0], [cube(-3.9, 0, -2, 4, 12, 4, 0, 16)]),
        bone("rightPants", "rightLeg", [-1.9, 12, 0], [cube(-3.9, 0, -2, 4, 12, 4, 0, 32, 0.25)]),
        bone("leftLeg", "root", [1.9, 12, 0], [cube(-0.1, 0, -2, 4, 12, 4, 16, 48)]),
        bone("leftPants", "leftLeg", [1.9, 12, 0], [cube(-0.1, 0, -2, 4, 12, 4, 0, 48, 0.25)])]}]})
w(f"{RP}/animations/jjmikey.animation.json", {"format_version": "1.8.0", "animations": {
    "animation.jjmikey.sit": {"loop": True, "bones": {
        "root": {"position": [0, -10, 0]},
        "rightLeg": {"rotation": [-90, 10, 0]}, "leftLeg": {"rotation": [-90, -10, 0]},
        "rightArm": {"rotation": [-25, 0, 8]}, "leftArm": {"rotation": [-25, 0, -8]}},
    },
    "animation.jjmikey.crouch": {"loop": True, "bones": {
        "root": {"position": [0, -3, 0]}, "body": {"rotation": [22, 0, 0]}, "head": {"position": [0, 0, -2]},
        "rightLeg": {"rotation": [-18, 0, 0]}, "leftLeg": {"rotation": [-18, 0, 0]}}}}})

# one sound per dialogue line
sd = {}
for key, c in LINES.items():
    for cat in CATS:
        for (lid, _t, _w) in c[cat]:
            sd[f"jjmikey.{key}.{lid}"] = {"category": "neutral", "min_distance": 2, "max_distance": 16,
                                          "sounds": [{"name": f"sounds/{key}/{lid}", "volume": 1.0}]}
w(f"{RP}/sounds/sound_definitions.json", {"format_version": "1.14.0", "sound_definitions": sd})
w(f"{RP}/texts/languages.json", ["en_US"])
w(f"{RP}/texts/en_US.lang", "entity.jjmikey:jj.name=JJ\nentity.jjmikey:mikey.name=Mikey\n"
  "item.spawn_egg.entity.jjmikey:jj.name=JJ Spawn Egg\nitem.spawn_egg.entity.jjmikey:mikey.name=Mikey Spawn Egg\n")

out = f"{ROOT}/JJ_and_Mikey.mcaddon"
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for pack in ("JJ_Mikey_BP", "JJ_Mikey_RP"):
        for d, _, fs in os.walk(f"{ROOT}/{pack}"):
            for f in fs:
                p = os.path.join(d, f)
                z.write(p, os.path.relpath(p, ROOT))
print("built", out)
