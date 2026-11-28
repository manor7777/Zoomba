// Tiny Tonics: drink handling + persistence.
// Size / max health / speed come from the "tonics:baby" component group in
// Tiny_Tonics_BP/entities/player.json. The crawl/sit poses and the nappy are
// drawn client-side by the resource pack, keyed off the synced "tonics:baby"
// player property.
import { world, system, ItemStack } from "@minecraft/server";

const BABY_PROP = "tonics:is_baby";
const BABY_POTION = "tonics:baby_potion";
const GROWTH_POTION = "tonics:growth_potion";
const BABY_BOTTLE = "tonics:baby_bottle";
const RATTLE = "tonics:rattle";

function giveItem(player, typeId) {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (!container) return;
  const leftover = container.addItem(new ItemStack(typeId, 1));
  if (leftover) player.dimension.spawnItem(leftover, player.location); // inventory full
}

function clampHealth(player) {
  const health = player.getComponent("minecraft:health");
  if (health && health.currentValue > health.effectiveMax) {
    health.setCurrentValue(health.effectiveMax);
  }
}

function applyBaby(player) {
  player.triggerEvent("tonics:become_baby");
  // Wait a couple of ticks so the new max health is in place before clamping.
  system.runTimeout(() => { try { clampHealth(player); } catch (_) {} }, 3);
}

function makeBaby(player) {
  player.setDynamicProperty(BABY_PROP, true);
  applyBaby(player);
  giveItem(player, BABY_BOTTLE);
  giveItem(player, RATTLE);
}

function makeNormal(player) {
  player.setDynamicProperty(BABY_PROP, undefined);
  player.triggerEvent("tonics:become_normal");
  // Wipe every status effect: speed, strength, slowness, etc.
  for (const effect of player.getEffects()) {
    player.removeEffect(effect.typeId);
  }
}

world.afterEvents.itemCompleteUse.subscribe(({ source, itemStack }) => {
  if (!source || source.typeId !== "minecraft:player" || !itemStack) return;
  switch (itemStack.typeId) {
    case BABY_POTION:
      makeBaby(source);
      source.onScreenDisplay.setActionBar("§dYou feel small...");
      break;
    case GROWTH_POTION:
      makeNormal(source);
      source.onScreenDisplay.setActionBar("§aBack to normal!");
      break;
    case BABY_BOTTLE:
      // The bottle is reusable: hand a fresh one back (not in creative, where nothing is consumed).
      system.run(() => {
        try {
          if (source.getGameMode?.() === "Creative") return;
          giveItem(source, BABY_BOTTLE);
        } catch (_) {}
      });
      break;
  }
});

// Rattle: shake it for a chime.
world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  if (!source || !itemStack || itemStack.typeId !== RATTLE) return;
  try {
    source.runCommand("playsound note.bell @a ~ ~ ~ 1 1.8");
    source.runCommand("particle minecraft:note_particle ~ ~1.2 ~");
  } catch (_) {}
});

// Re-apply after joining or respawning (death recreates the player entity).
world.afterEvents.playerSpawn.subscribe(({ player }) => {
  if (player.getDynamicProperty(BABY_PROP)) {
    system.runTimeout(() => { try { applyBaby(player); } catch (_) {} }, 20);
  }
});
