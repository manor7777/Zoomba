// Tiny Tonics: drink handling, crying, persistence.
// Size / max health / speed come from the "tonics:baby" component group in
// Tiny_Tonics_BP/entities/player.json. The crawl/sit poses, nappy and pacifier
// are drawn client-side by the resource pack, keyed off the synced
// "tonics:baby" player property.
import { world, system, ItemStack, EquipmentSlot } from "@minecraft/server";

const BABY_PROP = "tonics:is_baby";
const BABY_POTION = "tonics:baby_potion";
const GROWTH_POTION = "tonics:growth_potion";
const BABY_BOTTLE = "tonics:baby_bottle";
const RATTLE = "tonics:rattle";
const SOUR_SWEET = "tonics:sour_sweet";
const PACIFIER = "tonics:pacifier";

const STARTER_ITEMS = [BABY_BOTTLE, RATTLE];                       // given once per conversion
const BABY_ITEMS = [BABY_BOTTLE, RATTLE, SOUR_SWEET, PACIFIER];    // all removed when you grow up

// Tunables
const CHECK_EVERY = 4;                // ticks between crying checks
const AVG_SECONDS_BETWEEN_CRIES = 240; // average gap between random cries (4 min)
const CRY_TICKS = 140;                // how long a cry lasts (7 s)
const BABY_JUMP_AMPLIFIER = 1;        // Jump Boost II while a baby (0 = I, 2 = III ...)

const crying = new Map(); // player.id -> { until, nextSound }

function giveItem(player, typeId) {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (!container) return;
  const leftover = container.addItem(new ItemStack(typeId, 1));
  if (leftover) player.dimension.spawnItem(leftover, player.location); // inventory full
}

// fill = true tops you up to the new max (used when drinking Youth: 40 HP / 20 hearts).
function fixHealth(player, fill) {
  const health = player.getComponent("minecraft:health");
  if (!health) return;
  if (fill || health.currentValue > health.effectiveMax) {
    health.setCurrentValue(health.effectiveMax);
  }
}

function applyBaby(player, fill = false) {
  player.triggerEvent("tonics:become_baby");
  // Wait a couple of ticks so the new max health is in place first.
  system.runTimeout(() => { try { fixHealth(player, fill); } catch (_) {} }, 3);
}

function makeBaby(player) {
  const alreadyBaby = !!player.getDynamicProperty(BABY_PROP);
  player.setDynamicProperty(BABY_PROP, true);
  applyBaby(player, !alreadyBaby);
  if (alreadyBaby) return; // starter items are given once per conversion
  for (const id of STARTER_ITEMS) giveItem(player, id);
}

// Take every baby item back (inventory, offhand, worn pacifier) when growing up.
function removeBabyItems(player) {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container) {
    for (let i = 0; i < container.size; i++) {
      const it = container.getItem(i);
      if (it && BABY_ITEMS.includes(it.typeId)) container.setItem(i, undefined);
    }
  }
  const equip = player.getComponent("minecraft:equippable");
  if (equip) {
    for (const slot of [EquipmentSlot.Offhand, EquipmentSlot.Head]) {
      const it = equip.getEquipment(slot);
      if (it && BABY_ITEMS.includes(it.typeId)) equip.setEquipment(slot, undefined);
    }
  }
}

function makeNormal(player) {
  player.setDynamicProperty(BABY_PROP, undefined);
  player.triggerEvent("tonics:become_normal");
  crying.delete(player.id);
  try { removeBabyItems(player); } catch (_) {}
  system.runTimeout(() => { try { fixHealth(player, false); } catch (_) {} }, 3);
  // Safety net: confirm the baby flag really cleared; if not, fire the event again via command.
  for (const delay of [5, 20, 60]) {
    system.runTimeout(() => {
      try {
        if (player.getDynamicProperty(BABY_PROP)) return; // drank Youth again meanwhile
        if (player.getProperty("tonics:baby") === true) {
          player.runCommand("event entity @s tonics:become_normal");
        }
      } catch (_) {}
    }, delay);
  }
  // Wipe every status effect: speed, strength, slowness, etc.
  for (const effect of player.getEffects()) {
    player.removeEffect(effect.typeId);
  }
}

// A pacifier worn in the head slot keeps a baby from crying.
function wearingPacifier(player) {
  try {
    return player.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Head)?.typeId === PACIFIER;
  } catch (_) {
    return false;
  }
}

function startCry(player) {
  if (wearingPacifier(player)) return;
  crying.set(player.id, { until: system.currentTick + CRY_TICKS, nextSound: 0 });
}

// Two falling tears at the baby's eyes. Where the head is depends on the pose
// (crawling = head out in front and low; sitting = head upright, close in).
function spawnTears(player) {
  const v = player.getViewDirection();
  const len = Math.hypot(v.x, v.z) || 1;
  const fx = v.x / len, fz = v.z / len;          // horizontal facing
  const sx = -fz, sz = fx;                        // sideways
  const sitting = player.isSneaking;
  const forward = sitting ? 0.14 : 0.48;
  const height = sitting ? 0.56 : 0.46;
  const base = player.location;
  for (const side of [-0.04, 0.04]) {
    player.dimension.spawnParticle("tonics:tear_particle", {
      x: base.x + fx * forward + sx * side,
      y: base.y + height,
      z: base.z + fz * forward + sz * side,
    });
  }
}

// Random crying for babies: tears + a whiny sound for a few seconds.
system.runInterval(() => {
  const now = system.currentTick;
  for (const player of world.getAllPlayers()) {
    try {
      if (!player.getDynamicProperty(BABY_PROP)) { crying.delete(player.id); continue; }
      let cry = crying.get(player.id);
      if (wearingPacifier(player)) {
        if (cry) {
          crying.delete(player.id);
          player.onScreenDisplay.setActionBar("§bAhh... all soothed");
        }
        continue;
      }
      if (!cry) {
        if (Math.random() >= CHECK_EVERY / (AVG_SECONDS_BETWEEN_CRIES * 20)) continue;
        startCry(player);
        cry = crying.get(player.id);
        if (!cry) continue;
      }
      if (now >= cry.until) { crying.delete(player.id); continue; }
      if (now % 8 < CHECK_EVERY) spawnTears(player);
      if (now >= cry.nextSound) {
        cry.nextSound = now + 25;
        player.runCommand("playsound mob.villager.no @a ~ ~ ~ 1 1.9");
        player.onScreenDisplay.setActionBar("§9*waaah!*");
      }
    } catch (_) {}
  }
}, CHECK_EVERY);

// Babies bounce higher: keep a hidden Jump Boost topped up (also survives milk / respawn).
system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    try {
      if (!player.getDynamicProperty(BABY_PROP)) continue;
      player.addEffect("jump_boost", 80, { amplifier: BABY_JUMP_AMPLIFIER, showParticles: false });
    } catch (_) {}
  }
}, 20);

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
    case SOUR_SWEET:
      // Sour! Instant tears (unless a pacifier is in).
      startCry(source);
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
