# Tiny Tonics (Minecraft Bedrock add-on)

- **Potion of Youth** (`tonics:baby_potion`): half size, 10 max health (5 hearts), slower walk speed (0.08 vs 0.1),
  a nappy over the hips, crawl on all fours, crouch to sit. Also hands you a **Baby Bottle** and a **Rattle**.
- **Potion of Growth** (`tonics:growth_potion`): back to normal size/health/speed and clears all status effects.
- **Baby Bottle** (`tonics:baby_bottle`): drinkable snack that returns itself. **Rattle** (`tonics:rattle`): right-click to shake.

Recipes (crafting table, shapeless): Youth = glass bottle + sugar + golden carrot; Growth = glass bottle + bone meal + golden apple.
Or `/give @s tonics:baby_potion` etc.

Build: `python3 build.py` -> `dist/Tiny_Tonics.mcaddon` (open it on the iPad to import).
When you rebuild after an edit, raise `version` in both manifests (and the BP's dependency on the RP) so Minecraft upgrades in place instead of duplicating.

Where things live:
- Baby stats / synced `tonics:baby` flag: `Tiny_Tonics_BP/entities/player.json`, group `tonics:baby`.
- Poses (tweak numbers here if the crawl/sit looks off): `Tiny_Tonics_RP/animations/tonics.animation.json`.
- Nappy: `Tiny_Tonics_RP/models/entity/tonics_diaper.geo.json` + `textures/entity/tonics_diaper.png`.

Both `player.json` and `player.entity.json` are Mojang's vanilla definitions (bedrock-samples, subject to the Minecraft EULA) plus Tiny Tonics additions.
