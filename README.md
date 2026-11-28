# Tiny Tonics (Minecraft Bedrock add-on)

- **Potion of Youth** (`tonics:baby_potion`): half size, **40 HP (20 hearts)** (topped up on drinking), slower walk speed (0.08 vs 0.1),
  higher jump (hidden Jump Boost II), a nappy over the hips, crawl on all fours, crouch to sit.
  Hands you a **Baby Bottle** and a **Rattle** once per conversion (drinking Youth again while a baby gives nothing extra).
- **Potion of Growth** (`tonics:growth_potion`): back to normal size/health/speed, clears all status effects,
  stops crying, and takes the Bottle and Rattle back out of your inventory/offhand.
- **Baby Bottle** (`tonics:baby_bottle`): drinkable snack that returns itself. **Rattle** (`tonics:rattle`): right-click to shake.
- **Crying:** babies randomly burst into tears for ~7 s (about once every 75 s). **Sour Sweet** (`tonics:sour_sweet`) makes you cry
  instantly; **Pacifier** (`tonics:pacifier`, right-click) stops it and keeps you calm for 2 minutes.

Recipes (crafting table, shapeless): Youth = glass bottle + sugar + golden carrot; Growth = glass bottle + bone meal + golden apple;
Sour Sweet = sugar + sweet berries; Pacifier = slime ball + honeycomb. Or `/give @s tonics:<name>`.

Build: `python3 build.py` -> `dist/Tiny_Tonics.mcaddon` (open it on the iPad to import).
When you rebuild after an edit, raise `version` in both manifests (and the BP's dependency on the RP) so Minecraft upgrades in place instead of duplicating.

Where things live:
- Baby/normal stats and the synced `tonics:baby` flag: `Tiny_Tonics_BP/entities/player.json` (groups `tonics:baby` / `tonics:normal`).
- Crying odds, jump height, given items: constants at the top of `Tiny_Tonics_BP/scripts/main.js`.
- Poses (tweak numbers here if crawl/sit looks off): `Tiny_Tonics_RP/animations/tonics.animation.json`.
- Nappy: `Tiny_Tonics_RP/models/entity/tonics_diaper.geo.json` + `textures/entity/tonics_diaper.png`.

Both `player.json` and `player.entity.json` are Mojang's vanilla definitions (bedrock-samples, subject to the Minecraft EULA) plus Tiny Tonics additions.
