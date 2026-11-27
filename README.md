# Tiny Tonics (Minecraft Bedrock add-on)

- **Potion of Youth** (`tonics:baby_potion`): half size, 10 max health (5 hearts), slower walk speed (0.08 vs 0.1).
- **Potion of Growth** (`tonics:growth_potion`): back to normal size/health/speed and clears all status effects.

Recipes (crafting table, shapeless): Youth = glass bottle + sugar + golden carrot; Growth = glass bottle + bone meal + golden apple.
Or `/give @s tonics:baby_potion` / `/give @s tonics:growth_potion`.

Build: `python3 build.py` -> `dist/Tiny_Tonics.mcaddon` (open it on the iPad to import).
Tweak the baby stats in `Tiny_Tonics_BP/entities/player.json`, group `tonics:baby`.

`player.json` is Mojang's vanilla player definition (bedrock-samples, subject to the Minecraft EULA) plus the Tiny Tonics additions.
