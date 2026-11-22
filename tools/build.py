import json, uuid, os, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BP, RP = f"{ROOT}/JJ_Mikey_BP", f"{ROOT}/JJ_Mikey_RP"
# fixed UUIDs so re-builds update the same pack on the device
BP_U, BP_M, RP_U, RP_M = ("6f1d2c3e-1a2b-4c5d-8e9f-0a1b2c3d4e01", "6f1d2c3e-1a2b-4c5d-8e9f-0a1b2c3d4e02",
                          "6f1d2c3e-1a2b-4c5d-8e9f-0a1b2c3d4e03", "6f1d2c3e-1a2b-4c5d-8e9f-0a1b2c3d4e04")
def w(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2) if not isinstance(data, str) else f.write(data)

w(f"{BP}/manifest.json", {"format_version": 2,
  "header": {"name": "JJ & Mikey Friends (Behavior)", "description": "Interactive JJ and Mikey buddies", "uuid": BP_U, "version": [1,0,0], "min_engine_version": [1,21,100]},
  "modules": [{"type": "data", "uuid": BP_M, "version": [1,0,0]}],
  "dependencies": [{"uuid": RP_U, "version": [1,0,0]}]})
w(f"{RP}/manifest.json", {"format_version": 2,
  "header": {"name": "JJ & Mikey Friends (Skins)", "description": "Skins for JJ and Mikey", "uuid": RP_U, "version": [1,0,0], "min_engine_version": [1,21,100]},
  "modules": [{"type": "resources", "uuid": RP_M, "version": [1,0,0]}]})

def say(who, color, msg, key=None, r=8):
    cmds = ['tellraw @a[r=%d] {"rawtext":[{"text":"%s%s: %s"}]}' % (r, color, who, msg)]
    if key:
        cmds.append("playsound jjmikey.%s.talk @a[r=16] ~ ~ ~ 1 1" % key)
    return {"queue_command": {"command": cmds}}

CHAR = {
 "jj": dict(name="JJ", color="§a", egg=("#2fbf3a", "#2c3e6b"),
   talk=["Hey! Wanna go on an adventure?", "Mikey said he found diamonds... maybe.", "Creeper? Awww man.",
         "Don't worry, I'll protect you!", "Let's build a secret base!", "Have some emeralds, friend!"],
   idle=["Hmm hmm hmm...", "Where did Mikey go?", "This place is pretty cool.", "I wonder what's in that chest."],
   tamed="Yay! I'm your buddy now, let's go!",
   gifts=[("emerald",3,1,3),("bread",3,1,2),("iron_ingot",2,1,2),("golden_apple",1,1,1),("diamond",1,1,1)]),
 "mikey": dict(name="Mikey", color="§e", egg=("#f2c618", "#34383f"),
   talk=["JJ, don't leave me!", "I made a snack, want some?", "Look at this cool thing I found!",
         "I'm not scared... okay, maybe a little.", "Wanna play hide and seek?", "Here, take this gold!"],
   idle=["Is it snack time yet?", "JJ? JJ, are you there?", "I think I heard something...", "La la la la."],
   tamed="Okay okay, I'm following you! Don't go too far!",
   gifts=[("gold_ingot",3,1,3),("cookie",3,1,4),("cooked_beef",2,1,2),("golden_apple",1,1,1),("diamond",1,1,1)]),
}

for key, c in CHAR.items():
    n = c["name"]
    base_not_cookie = {"test": "has_equipment", "subject": "other", "domain": "hand", "operator": "not", "value": "cookie"}
    talk_event = f"{key}:talk"
    bp = {"format_version": "1.21.0", "minecraft:entity": {
      "description": {"identifier": f"jjmikey:{key}", "is_spawnable": True, "is_summonable": True, "is_experimental": False},
      "component_groups": {
        "tamed": {
          "minecraft:is_tamed": {},
          "minecraft:behavior.follow_owner": {"priority": 4, "speed": 1.2, "start_distance": 8, "stop_distance": 3},
          "minecraft:behavior.owner_hurt_by_target": {"priority": 1},
          "minecraft:behavior.owner_hurt_target": {"priority": 2},
          "minecraft:behavior.melee_attack": {"priority": 3, "speed_multiplier": 1.2, "track_target": True}
        }},
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
        "minecraft:timer": {"looping": True, "randomInterval": True, "time": [45, 120], "time_down_event": {"event": f"{key}:idle", "target": "self"}},
        "minecraft:persistent": {},
        "minecraft:fall_damage": {"value": 1.0},
        "minecraft:tameable": {"probability": 1.0, "tame_items": ["cookie", "golden_apple"],
                               "tame_event": {"event": "jjmikey:on_tame", "target": "self"}},
        "minecraft:interact": {"interactions": [{
            "on_interact": {"filters": {"all_of": [{"test": "is_family", "subject": "other", "value": "player"}, base_not_cookie]},
                            "event": talk_event, "target": "self"},
            "swing": True, "cooldown": 8,
            "play_sounds": "random.levelup",
            "particle_on_start": {"particle_type": "heart", "particle_offset_towards_interactor": True},
            "spawn_items": {"table": f"loot_tables/{key}_gift.json"}}]},
        "minecraft:behavior.float": {"priority": 0},
        "minecraft:behavior.panic": {"priority": 1, "speed_multiplier": 1.3},
        "minecraft:behavior.random_stroll": {"priority": 6, "speed_multiplier": 0.8},
        "minecraft:behavior.look_at_player": {"priority": 7, "look_distance": 8},
        "minecraft:behavior.random_look_around": {"priority": 8}
      },
      "events": {
        talk_event: {"randomize": [{"weight": 1, **say(n, c["color"], t, key)} for t in c["talk"]]},
        f"{key}:idle": {"randomize": [{"weight": 1, **say(n, c["color"], t, key, 10)} for t in c["idle"]]},
        "jjmikey:on_tame": {"add": {"component_groups": ["tamed"]}, **say(n, c["color"], c["tamed"], key)}
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

    pools = {"pools": [{"rolls": 1, "entries": [
        {"type": "item", "name": f"minecraft:{i}", "weight": wt,
         "functions": [{"function": "set_count", "count": {"min": lo, "max": hi}}]} for i, wt, lo, hi in c["gifts"]]}]}
    w(f"{BP}/loot_tables/{key}_gift.json", pools)

    rp = {"format_version": "1.10.0", "minecraft:client_entity": {"description": {
        "identifier": f"jjmikey:{key}",
        "materials": {"default": "entity_alphatest"},
        "textures": {"default": f"textures/entity/{key}"},
        "geometry": {"default": "geometry.humanoid.custom"},
        "animations": {"move": "animation.humanoid.move", "base_pose": "animation.humanoid.base_pose",
                       "look_at_target": "animation.humanoid.look_at_target.default"},
        "scripts": {"animate": ["base_pose", {"move": "query.is_moving"}, "look_at_target"]},
        "render_controllers": ["controller.render.default"],
        "spawn_egg": {"base_color": c["egg"][0], "overlay_color": c["egg"][1]}}}}
    w(f"{RP}/entity/{key}.entity.json", rp)

w(f"{RP}/sounds/sound_definitions.json", {"format_version": "1.14.0", "sound_definitions": {
    f"jjmikey.{k}.talk": {"category": "neutral", "min_distance": 2, "max_distance": 16,
                          "sounds": [{"name": f"sounds/{k}/talk{i}", "volume": 1.0} for i in range(1, 7)]} for k in CHAR}})
w(f"{RP}/texts/languages.json", ["en_US"])
w(f"{RP}/texts/en_US.lang", "entity.jjmikey:jj.name=JJ\nentity.jjmikey:mikey.name=Mikey\n"
  "item.spawn_egg.entity.jjmikey:jj.name=JJ Spawn Egg\nitem.spawn_egg.entity.jjmikey:mikey.name=Mikey Spawn Egg\n")

# package
out = f"{ROOT}/JJ_and_Mikey.mcaddon"
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for pack in ("JJ_Mikey_BP", "JJ_Mikey_RP"):
        for d, _, fs in os.walk(f"{ROOT}/{pack}"):
            for f in fs:
                p = os.path.join(d, f)
                z.write(p, os.path.relpath(p, ROOT))
print("built", out)
