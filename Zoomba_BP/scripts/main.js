// Zoomba Potions: drink handling + persistence.
// Size / max health / speed come from the "zoomba:baby" component group
// that Zoomba_BP/entities/player.json adds to the player.
import { world, system } from "@minecraft/server";

const BABY_PROP = "zoomba:is_baby";
const BABY_POTION = "zoomba:baby_potion";
const GROWTH_POTION = "zoomba:growth_potion";

function clampHealth(player) {
  const health = player.getComponent("minecraft:health");
  if (health && health.currentValue > health.effectiveMax) {
    health.setCurrentValue(health.effectiveMax);
  }
}

function makeBaby(player) {
  player.setDynamicProperty(BABY_PROP, true);
  player.triggerEvent("zoomba:become_baby");
  // Wait a couple of ticks so the new max health is in place before clamping.
  system.runTimeout(() => { try { clampHealth(player); } catch (_) {} }, 3);
}

function makeNormal(player) {
  player.setDynamicProperty(BABY_PROP, undefined);
  player.triggerEvent("zoomba:become_normal");
  // Wipe every status effect: speed, strength, slowness, etc.
  for (const effect of player.getEffects()) {
    player.removeEffect(effect.typeId);
  }
}

world.afterEvents.itemCompleteUse.subscribe(({ source, itemStack }) => {
  if (!source || source.typeId !== "minecraft:player" || !itemStack) return;
  if (itemStack.typeId === BABY_POTION) {
    makeBaby(source);
    source.onScreenDisplay.setActionBar("§dYou feel small...");
  } else if (itemStack.typeId === GROWTH_POTION) {
    makeNormal(source);
    source.onScreenDisplay.setActionBar("§aBack to normal!");
  }
});

// Re-apply after joining or respawning (death recreates the player entity).
world.afterEvents.playerSpawn.subscribe(({ player }) => {
  if (player.getDynamicProperty(BABY_PROP)) {
    system.runTimeout(() => { try { makeBaby(player); } catch (_) {} }, 20);
  }
});
