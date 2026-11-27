# Zoomba Potions (Minecraft Bedrock add-on)

- **Potion of Youth** (`zoomba:baby_potion`): half size, 10 max health (5 hearts), slower walk speed (0.08 vs 0.1).
- **Potion of Growth** (`zoomba:growth_potion`): back to normal size/health/speed and clears all status effects.

Recipes (crafting table, shapeless): Youth = glass bottle + sugar + golden carrot; Growth = glass bottle + bone meal + golden apple.
Or `/give @s zoomba:baby_potion` / `/give @s zoomba:growth_potion`.

Build: `python3 build.py` -> `dist/Zoomba.mcaddon` (open it on the iPad to import).
Tweak the baby stats in `Zoomba_BP/entities/player.json`, group `zoomba:baby`.

`player.json` is Mojang's vanilla player definition (bedrock-samples, subject to the Minecraft EULA) plus the Zoomba additions.
