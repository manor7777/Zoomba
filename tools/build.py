import json, os, zipfile, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lines import LINES, CATS

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BP, RP = f"{ROOT}/JJ_Mikey_BP", f"{ROOT}/JJ_Mikey_RP"
# fixed UUIDs so re-installing updates the same pack
BP_U, BP_M, RP_U, RP_M, BP_S = ("6f1d2c3e-1a2b-4c5d-8e9f-0a1b2c3d4e01", "6f1d2c3e-1a2b-4c5d-8e9f-0a1b2c3d4e02",
                                "6f1d2c3e-1a2b-4c5d-8e9f-0a1b2c3d4e03", "6f1d2c3e-1a2b-4c5d-8e9f-0a1b2c3d4e04",
                                "6f1d2c3e-1a2b-4c5d-8e9f-0a1b2c3d4e05")
EGG = {"jj": ("#aa0000", "#5c342b"), "mikey": ("#45a22c", "#1d5412")}   # taken from the skins

def w(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(data) if isinstance(data, str) else json.dump(data, f, indent=2)

w(f"{BP}/manifest.json", {"format_version": 2,
  "header": {"name": "JJ & Mikey Friends (Behavior)", "description": "Interactive JJ and Mikey buddies", "uuid": BP_U, "version": [1, 1, 0], "min_engine_version": [1, 21, 100]},
  "modules": [{"type": "data", "uuid": BP_M, "version": [1, 1, 0]},
              {"type": "script", "language": "javascript", "uuid": BP_S, "version": [1, 1, 0], "entry": "scripts/main.js"}],
  "dependencies": [{"uuid": RP_U, "version": [1, 1, 0]},
                   {"module_name": "@minecraft/server", "version": "2.0.0"},
                   {"module_name": "@minecraft/server-ui", "version": "2.0.0"}]})
w(f"{RP}/manifest.json", {"format_version": 2,
  "header": {"name": "JJ & Mikey Friends (Skins)", "description": "Skins and voices for JJ and Mikey", "uuid": RP_U, "version": [1, 1, 0], "min_engine_version": [1, 21, 100]},
  "modules": [{"type": "resources", "uuid": RP_M, "version": [1, 1, 0]}]})

# dialogue data for the script
data = {k: {"name": c["name"], "color": c["color"], "gifts": c["gifts"],
            **{cat: [{"id": i, "text": t, "when": wh} for (i, t, wh) in c[cat]] for cat in CATS}} for k, c in LINES.items()}
w(f"{BP}/scripts/lines.js", "export const LINES = " + json.dumps(data, indent=1, ensure_ascii=False) + ";\n")

for key, c in LINES.items():
    n = c["name"]
    bp = {"format_version": "1.21.0", "minecraft:entity": {
      "description": {"identifier": f"jjmikey:{key}", "is_spawnable": True, "is_summonable": True, "is_experimental": False},
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
        "stay": {"minecraft:movement": {"value": 0.0}}
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
        "jjmikey:go": {"remove": {"component_groups": ["stay"]}}
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
        "geometry": {"default": "geometry.humanoid.custom"},
        "animations": {"move": "animation.humanoid.move", "base_pose": "animation.humanoid.base_pose",
                       "look_at_target": "animation.humanoid.look_at_target.default"},
        "scripts": {"animate": ["base_pose", {"move": "query.is_moving"}, "look_at_target"]},
        "render_controllers": ["controller.render.default"],
        "spawn_egg": {"base_color": EGG[key][0], "overlay_color": EGG[key][1]}}}})

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
