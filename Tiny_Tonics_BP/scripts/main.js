// Tiny Tonics: drink handling + persistence.
// Size / max health / speed come from the "tonics:baby" component group in
// Tiny_Tonics_BP/entities/player.json. The crawl/sit poses and the nappy are
// drawn client-side by the resource pack, keyed off the synced "tonics:baby"
// player property.
import { world, system, ItemStack, EquipmentSlot } from "@minecraft/server";

const BABY_PROP = "tonics:is_baby";
const BABY_POTION = "tonics:baby_potion";
const GROWTH_POTION = "tonics:growth_potion";
const BABY_BOTTLE = "tonics:baby_bottle";
const RATTLE = "tonics:rattle";
const SOUR_SWEET = "tonics:sour_sweet";
const PACIFIER = "tonics:pacifier";

// Crying tunables
const CHECK_EVERY = 4;               // ticks between crying checks
const AVG_SECONDS_BETWEEN_CRIES = 75; // average gap between random cries
const CRY_TICKS = 140;               // how long a cry lasts (7 s)
const CALM_TICKS = 2400;             // pacifier keeps you calm for 2 min
const BABY_JUMP_AMPLIFIER = 1;       // Jump Boost II while a baby (0 = I, 2 = III ...)
const GIVEN_ITEMS = [BABY_BOTTLE, RATTLE]; // handed out on becoming a baby, removed on growing up
const crying = new Map();            // player.id -> { until, nextSound }
const calmUntil = new Map();         // player.id -> tick

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
  for (const id of GIVEN_ITEMS) giveItem(player, id);
}

// Take the starter baby items back (inventory + offhand) when growing up.
function removeBabyItems(player) {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container) {
    for (let i = 0; i < container.size; i++) {
      const it = container.getItem(i);
      if (it && GIVEN_ITEMS.includes(it.typeId)) container.setItem(i, undefined);
    }
  }
  const equip = player.getComponent("minecraft:equippable");
  const off = equip?.getEquipment(EquipmentSlot.Offhand);
  if (off && GIVEN_ITEMS.includes(off.typeId)) equip.setEquipment(EquipmentSlot.Offhand, undefined);
}

function makeNormal(player) {
  player.setDynamicProperty(BABY_PROP, undefined);
  player.triggerEvent("tonics:become_normal");
  crying.delete(player.id);
  calmUntil.delete(player.id);
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

function startCry(player) {
  crying.set(player.id, { until: system.currentTick + CRY_TICKS, nextSound: 0 });
}

function soothe(player) {
  crying.delete(player.id);
  calmUntil.set(player.id, system.currentTick + CALM_TICKS);
}

// Random crying for babies: tears + a whiny sound for a few seconds.
system.runInterval(() => {
  const now = system.currentTick;
  for (const player of world.getAllPlayers()) {
    try {
      if (!player.getDynamicProperty(BABY_PROP)) { crying.delete(player.id); continue; }
      let cry = crying.get(player.id);
      if (!cry) {
        if ((calmUntil.get(player.id) ?? 0) > now) continue;
        if (Math.random() >= CHECK_EVERY / (AVG_SECONDS_BETWEEN_CRIES * 20)) continue;
        startCry(player);
        cry = crying.get(player.id);
      }
      if (now >= cry.until) { crying.delete(player.id); continue; }
      player.runCommand("particle minecraft:water_splash_particle ~ ~0.7 ~");
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
      // Sour! Instant tears.
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

// Rattle: shake it for a chime. Pacifier: stops crying and keeps you calm for a while.
world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  if (!source || !itemStack) return;
  try {
    if (itemStack.typeId === RATTLE) {
      source.runCommand("playsound note.bell @a ~ ~ ~ 1 1.8");
      source.runCommand("particle minecraft:note_particle ~ ~1.2 ~");
    } else if (itemStack.typeId === PACIFIER) {
      soothe(source);
      source.runCommand("playsound random.pop @a ~ ~ ~ 0.8 1.4");
      source.runCommand("particle minecraft:heart_particle ~ ~1.0 ~");
      source.onScreenDisplay.setActionBar("§bAhh... all soothed");
    }
  } catch (_) {}
});

// Re-apply after joining or respawning (death recreates the player entity).
world.afterEvents.playerSpawn.subscribe(({ player }) => {
  if (player.getDynamicProperty(BABY_PROP)) {
    system.runTimeout(() => { try { applyBaby(player); } catch (_) {} }, 20);
  }
});
