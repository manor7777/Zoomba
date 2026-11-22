// JJ & Mikey buddies: tap-to-talk menu, context-aware chatter, gifts, stay/follow, punching.
import { world, system, ItemStack } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { LINES } from "./lines.js";

const TYPES = { "jjmikey:jj": "jj", "jjmikey:mikey": "mikey" };
const NO_PUNCH_BLOCKS = ["minecraft:bedrock", "minecraft:barrier", "minecraft:command_block", "minecraft:structure_block", "minecraft:end_portal_frame"];
const state = new Map(); // entity.id -> { next, last, lastGift }

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const st = (e) => {
  let s = state.get(e.id);
  if (!s) { s = { next: system.currentTick + 20 * rand(20, 60), last: "", lastGift: -99999 }; state.set(e.id, s); }
  return s;
};
const alive = (e) => { try { return e && e.isValid; } catch { return false; } };

// ---------- context ----------
function scanBlocks(entity, tags, r = 6) {
  const { x, y, z } = entity.location;
  const bx = Math.floor(x), by = Math.floor(y), bz = Math.floor(z);
  const dim = entity.dimension;
  for (let dx = -r; dx <= r; dx++) for (let dy = -2; dy <= 3; dy++) for (let dz = -r; dz <= r; dz++) {
    let b;
    try { b = dim.getBlock({ x: bx + dx, y: by + dy, z: bz + dz }); } catch { continue; }
    if (!b) continue;
    const id = b.typeId.replace("minecraft:", "");
    if (id.includes("chest") || id === "barrel") tags.add("chest");
    else if (id.endsWith("bed")) tags.add("bed");
    else if (id === "crafting_table") tags.add("crafting");
    else if (id === "furnace" || id === "smoker" || id === "blast_furnace") tags.add("furnace");
    else if (id === "bookshelf") tags.add("bookshelf");
    else if (id === "water" || id === "flowing_water") tags.add("water");
    else if (id === "lava" || id === "flowing_lava") tags.add("lava");
    else if (id.includes("diamond_ore")) tags.add("diamond_ore");
  }
}

function context(entity, player) {
  const tags = new Set();
  try { scanBlocks(entity, tags); } catch { }
  try {
    const t = world.getTimeOfDay();
    if (t >= 13000 && t < 23000) tags.add("night"); else tags.add("day");
  } catch { }
  try { if (entity.dimension.getWeather() !== "Clear") tags.add("rain"); } catch { }
  try {
    if (entity.dimension.getEntities({ location: entity.location, maxDistance: 16, families: ["monster"] }).length > 0) tags.add("monster");
  } catch { }
  try {
    const other = entity.typeId === "jjmikey:jj" ? "jjmikey:mikey" : "jjmikey:jj";
    if (entity.dimension.getEntities({ location: entity.location, maxDistance: 12, type: other }).length > 0) tags.add("buddy");
  } catch { }
  try {
    if (entity.location.y < 50) tags.add("underground");
    if (entity.location.y > 110) tags.add("high");
  } catch { }
  if (player) {
    try {
      const hp = player.getComponent("minecraft:health");
      if (hp && hp.currentValue <= 8) tags.add("lowhealth");
    } catch { }
    try {
      const item = player.getComponent("minecraft:equippable").getEquipment("Mainhand");
      if (item) {
        if (item.typeId.includes("sword")) tags.add("sword");
        if (item.typeId.includes("pickaxe")) tags.add("pickaxe");
      }
    } catch { }
  }
  return tags;
}

function chooseLine(entity, player, category) {
  const c = LINES[TYPES[entity.typeId]];
  const s = st(entity);
  const ctx = category === "talk" ? context(entity, player) : new Set();
  const ok = c[category].filter((l) => (l.when || []).every((t) => ctx.has(t)));
  const specific = ok.filter((l) => l.when && l.when.length > 0 && l.id !== s.last);
  const generic = ok.filter((l) => (!l.when || l.when.length === 0) && l.id !== s.last);
  let pool = specific.length > 0 && (Math.random() < 0.7 || generic.length === 0) ? specific : generic;
  if (pool.length === 0) pool = ok;
  const line = pick(pool);
  s.last = line.id;
  return line;
}

function speak(entity, category, player) {
  if (!alive(entity)) return;
  if (category === "talk" && Math.random() < 0.18) category = "catch";
  const c = LINES[TYPES[entity.typeId]];
  const line = chooseLine(entity, player, category);
  const msg = `${c.color}${c.name}§r: ${line.text}`;
  try {
    for (const p of entity.dimension.getPlayers({ location: entity.location, maxDistance: 12 })) p.sendMessage(msg);
  } catch { }
  try {
    entity.runCommand(`playsound jjmikey.${TYPES[entity.typeId]}.${line.id} @a[r=16,tag=!jjmikey_mute] ~ ~ ~ 1 1`);
  } catch { }
}

// ---------- idle chatter (only when a player is nearby) ----------
system.runInterval(() => {
  const now = system.currentTick;
  for (const dimId of ["overworld", "nether", "the_end"]) {
    let dim;
    try { dim = world.getDimension(dimId); } catch { continue; }
    for (const type of Object.keys(TYPES)) {
      let list = [];
      try { list = dim.getEntities({ type }); } catch { continue; }
      for (const e of list) {
        const s = st(e);
        if (games.has(e.id)) continue;
        if (now < s.next) continue;
        s.next = now + 20 * rand(45, 120);
        let near = [];
        try { near = dim.getPlayers({ location: e.location, maxDistance: 10 }); } catch { }
        if (near.length > 0) speak(e, "talk", near[0]);
      }
    }
  }
}, 100);

// ---------- menu ----------
async function showMenu(player, buddy, tries = 0) {
  if (!alive(buddy)) return;
  const c = LINES[TYPES[buddy.typeId]];
  const tamed = buddy.hasTag("jjmikey_tamed");
  const mode = buddy.hasTag("jjmikey_sit") ? "sit" : buddy.hasTag("jjmikey_stay") ? "stay" : "follow";
  const muted = player.hasTag("jjmikey_mute");
  const buttons = [];
  const form = new ActionFormData().title(`${c.color}${c.name}`);
  form.body(tamed ? `${c.name} is your buddy!` : `Feed ${c.name} a cookie or a golden apple to make friends.`);
  const add = (label, fn) => { form.button(label); buttons.push(fn); };
  add("Chat", () => speak(buddy, "talk", player));
  add("Ask for a gift", () => gift(buddy, player));
  if (mode === "follow") {
    add("Stay here (standing)", () => setMode(buddy, player, "stay"));
    add("Sit down", () => setMode(buddy, player, "sit"));
  } else {
    add(tamed ? "Follow me" : "Wander again", () => setMode(buddy, player, "follow"));
    if (mode === "stay") add("Sit down", () => setMode(buddy, player, "sit"));
    else add("Stand up (stay here)", () => setMode(buddy, player, "stay"));
  }
  if (tamed) add("Punch what I'm looking at", () => punch(buddy, player));
  add(games.has(buddy.id) ? "Stop the game" : "Play a game", () => (games.has(buddy.id) ? endGame(buddy, player, true) : gameMenu(player, buddy)));
  add(muted ? "Voices: OFF (tap to turn on)" : "Voices: ON (tap to turn off)", () => {
    if (muted) player.removeTag("jjmikey_mute"); else player.addTag("jjmikey_mute");
    player.sendMessage(muted ? "§7Buddy voices on." : "§7Buddy voices off.");
  });
  add("Close", () => { });
  let res;
  try { res = await form.show(player); } catch { return; }
  if (res.canceled) {
    if (res.cancelationReason === "UserBusy" && tries < 6) system.runTimeout(() => showMenu(player, buddy, tries + 1), 10);
    return;
  }
  try { buttons[res.selection](); } catch { }
}

function heart(entity) {
  try { entity.runCommand("particle minecraft:heart_particle ~ ~1.6 ~"); } catch { }
}

function gift(buddy, player, force = false) {
  const c = LINES[TYPES[buddy.typeId]];
  const s = st(buddy);
  const now = system.currentTick;
  if (!force && now - s.lastGift < 20 * 45) { speak(buddy, "nogift", player); return; }
  if (!force) s.lastGift = now;
  const total = c.gifts.reduce((a, g) => a + g[1], 0);
  let roll = Math.random() * total, g = c.gifts[0];
  for (const cand of c.gifts) { roll -= cand[1]; if (roll <= 0) { g = cand; break; } }
  const count = Math.floor(rand(g[2], g[3] + 0.999));
  try {
    player.dimension.spawnItem(new ItemStack(`minecraft:${g[0]}`, count), player.location);
  } catch { }
  heart(buddy);
  if (!force) speak(buddy, "gift", player);
}

function applyMode(buddy, mode) {
  buddy.removeTag("jjmikey_stay");
  buddy.removeTag("jjmikey_sit");
  try { buddy.triggerEvent("jjmikey:go"); } catch { }
  if (mode === "stay") {
    buddy.addTag("jjmikey_stay");
    try { buddy.triggerEvent("jjmikey:stay"); } catch { }
  } else if (mode === "sit") {
    buddy.addTag("jjmikey_sit");
    try { buddy.triggerEvent("jjmikey:sit"); } catch { }
  }
}
function setMode(buddy, player, mode) {
  applyMode(buddy, mode);
  speak(buddy, mode === "stay" ? "stay" : mode === "sit" ? "sit" : "go", player);
}

// ---------- names (fixes "Unknown was slain") ----------
function ensureName(e) {
  try {
    if (e.typeId in TYPES && !e.nameTag) e.nameTag = LINES[TYPES[e.typeId]].name;
  } catch { }
}
world.afterEvents.entitySpawn.subscribe((ev) => ensureName(ev.entity));

// ---------- noticing things (diamonds, chests, flowers, ...) ----------
const FLOWERS = ["dandelion", "poppy", "blue_orchid", "allium", "azure_bluet", "red_tulip", "orange_tulip", "white_tulip", "pink_tulip",
  "oxeye_daisy", "cornflower", "lily_of_the_valley", "sunflower", "lilac", "rose_bush", "peony", "wither_rose", "torchflower", "pink_petals"];
const ORES = ["gold_ore", "deepslate_gold_ore", "emerald_ore", "deepslate_emerald_ore", "ancient_debris", "lapis_ore", "deepslate_lapis_ore"];
const PRIORITY = ["diamond", "spawner", "ore", "creeper", "chest", "villager", "flower"];

function classify(id) {
  id = id.replace("minecraft:", "");
  if (id.includes("diamond_ore")) return "diamond";
  if (id === "mob_spawner" || id === "spawner") return "spawner";
  if (ORES.includes(id)) return "ore";
  if (id === "chest" || id === "trapped_chest" || id === "ender_chest") return "chest";
  if (FLOWERS.includes(id)) return "flower";
  return null;
}

function exposed(dim, b) {
  const { x, y, z } = b.location;
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    try {
      const n = dim.getBlock({ x: x + dx, y: y + dy, z: z + dz });
      if (n && (n.isAir || n.isLiquid)) return true;
    } catch { }
  }
  return false;
}

function notice(e, player) {
  const s = st(e);
  const now = system.currentTick;
  if (now - (s.lastNotice ?? -99999) < 20 * 15) return;
  s.seen = s.seen || {};
  const dim = e.dimension;
  const found = new Set();
  const { x, y, z } = e.location;
  const bx = Math.floor(x), by = Math.floor(y), bz = Math.floor(z), r = 7;
  for (let dx = -r; dx <= r; dx++) for (let dy = -3; dy <= 4; dy++) for (let dz = -r; dz <= r; dz++) {
    let b;
    try { b = dim.getBlock({ x: bx + dx, y: by + dy, z: bz + dz }); } catch { continue; }
    if (!b) continue;
    const k = classify(b.typeId);
    if (k && !found.has(k) && exposed(dim, b)) found.add(k);
  }
  try { if (dim.getEntities({ location: e.location, maxDistance: 12, type: "minecraft:creeper" }).length > 0) found.add("creeper"); } catch { }
  try { if (dim.getEntities({ location: e.location, maxDistance: 12, type: "minecraft:villager_v2" }).length > 0) found.add("villager"); } catch { }
  for (const k of PRIORITY) {
    if (!found.has(k)) continue;
    if (now - (s.seen[k] ?? -99999) < 20 * 120) continue;
    s.seen[k] = now;
    s.lastNotice = now;
    speak(e, "notice_" + k, player);
    return;
  }
}

system.runInterval(() => {
  for (const dimId of ["overworld", "nether", "the_end"]) {
    let dim;
    try { dim = world.getDimension(dimId); } catch { continue; }
    for (const type of Object.keys(TYPES)) {
      let list = [];
      try { list = dim.getEntities({ type }); } catch { continue; }
      for (const e of list) {
        ensureName(e);
        if (games.has(e.id)) continue;
        let near = [];
        try { near = dim.getPlayers({ location: e.location, maxDistance: 14 }); } catch { }
        if (near.length > 0) notice(e, near[0]);
      }
    }
  }
}, 60);

// ---------- punching ----------
function nearTo(loc, from) {
  const dx = from.x - loc.x, dz = from.z - loc.z, d = Math.hypot(dx, dz) || 1;
  return { x: loc.x + (dx / d) * 1.2, y: loc.y, z: loc.z + (dz / d) * 1.2 };
}

function punch(buddy, player) {
  let target;
  try {
    const hits = player.getEntitiesFromViewDirection({ maxDistance: 16 });
    target = hits.map((h) => h.entity).find((e) => e.id !== buddy.id && e.typeId !== "minecraft:player" && !(e.typeId in TYPES) && e.getComponent("minecraft:health"));
  } catch { }
  if (target) {
    try { buddy.teleport(nearTo(target.location, buddy.location), { facingLocation: target.location }); } catch { }
    system.runTimeout(() => {
      if (!alive(buddy) || !alive(target)) return;
      try { target.applyDamage(4, { cause: "entityAttack", damagingEntity: buddy }); } catch { }
      speak(buddy, "punch", player);
    }, 8);
    return;
  }
  let creative = false;
  try { creative = String(player.getGameMode()).toLowerCase() === "creative"; } catch { }
  let block;
  try { block = player.getBlockFromViewDirection({ maxDistance: 16 })?.block; } catch { }
  if (block && creative && !NO_PUNCH_BLOCKS.includes(block.typeId)) {
    const { x, y, z } = block.location;
    try { buddy.teleport(nearTo({ x: x + 0.5, y, z: z + 0.5 }, buddy.location), { facingLocation: { x: x + 0.5, y: y + 0.5, z: z + 0.5 } }); } catch { }
    system.runTimeout(() => {
      if (!alive(buddy)) return;
      try { buddy.dimension.runCommand(`setblock ${x} ${y} ${z} air destroy`); } catch { }
      speak(buddy, "punch_block", player);
    }, 8);
    return;
  }
  speak(buddy, "punch_none", player);
}

// ---------- quick controls (backups in case the menu won't open) ----------
function quickToggle(buddy, player) {
  const following = !buddy.hasTag("jjmikey_sit") && !buddy.hasTag("jjmikey_stay");
  setMode(buddy, player, following ? "sit" : "follow");
}

// /scriptevent buddy:follow | buddy:stay | buddy:sit   (affects every JJ/Mikey within 48 blocks of you)
system.afterEvents.scriptEventReceive.subscribe((ev) => {
  if (!ev.id.startsWith("buddy:")) return;
  const cmd = ev.id.slice(6);
  if (cmd === "hint") { giveHint(ev.sourceEntity); return; }
  const mode = cmd === "sit" ? "sit" : cmd === "stay" ? "stay" : cmd === "follow" || cmd === "wander" ? "follow" : null;
  const player = ev.sourceEntity;
  if (!mode || !player || !player.dimension) return;
  let n = 0;
  for (const type of Object.keys(TYPES)) {
    try {
      for (const b of player.dimension.getEntities({ type, location: player.location, maxDistance: 48 })) { setMode(b, player, mode); n++; }
    } catch { }
  }
  if (n === 0) try { player.sendMessage("§7No JJ or Mikey within 48 blocks."); } catch { }
});

// ---------- tap to open the menu (sneak + tap = quick toggle follow <-> sit) ----------
// The "before" event fires on every tap, even with an empty hand. (The "after" event only fires when the game
// itself handled the tap, e.g. feeding a cookie, which is why the menu only showed up once.) Both are wired up
// and de-duplicated so it works either way.
const lastOpen = new Map(); // player.id -> tick
function handleTap(player, buddy, itemStack) {
  if (!buddy || !(buddy.typeId in TYPES)) return;
  const now = system.currentTick;
  if (now - (lastOpen.get(player.id) ?? -999) < 8) return;
  const g = games.get(buddy.id);
  if (g && g.type === "hide" && g.hidden) { lastOpen.set(player.id, now); system.run(() => hideFound(buddy, player)); return; }
  const held = itemStack?.typeId;
  if (!buddy.hasTag("jjmikey_tamed") && (held === "minecraft:cookie" || held === "minecraft:golden_apple")) return; // let taming happen
  lastOpen.set(player.id, now);
  system.run(() => {
    if (player.isSneaking) quickToggle(buddy, player); else showMenu(player, buddy);
  });
}
world.beforeEvents.playerInteractWithEntity.subscribe((ev) => handleTap(ev.player, ev.target, ev.itemStack));
world.afterEvents.playerInteractWithEntity.subscribe((ev) => handleTap(ev.player, ev.target, ev.itemStack));

// =====================================================================
// GAMES: hide and seek, tag, Simon Says, rock-paper-scissors
// =====================================================================
const games = new Map(); // buddy.id -> game state
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const actionBar = (p, text) => { try { p.onScreenDisplay.setActionBar(text); } catch { try { p.sendMessage(text); } catch { } } };
const later = (buddy, g, ticks, fn) => system.runTimeout(() => { if (games.get(buddy.id) === g) fn(); }, ticks);

function endGame(buddy, player, manual = false) {
  const g = games.get(buddy.id);
  if (!g) return;
  games.delete(buddy.id);
  if (g.interval !== undefined) { try { system.clearRun(g.interval); } catch { } }
  try {
    if (g.type === "tag") buddy.triggerEvent("jjmikey:flee_off");
    if (g.type === "hide") applyMode(buddy, "follow");
  } catch { }
  if (manual) { try { player.sendMessage("§7Game stopped."); } catch { } }
}

async function gameMenu(player, buddy) {
  if (!alive(buddy)) return;
  const c = LINES[TYPES[buddy.typeId]];
  const form = new ActionFormData().title(`${c.color}${c.name}: games`).body("What do you want to play?");
  const opts = [];
  const add = (label, fn) => { form.button(label); opts.push(fn); };
  add("Hide and seek", () => startHide(buddy, player));
  add("Simon Says", () => startSimon(buddy, player));
  add("Rock, paper, scissors", () => rpsMenu(player, buddy));
  if (buddy.hasTag("jjmikey_tamed")) add("Tag (catch me!)", () => startTag(buddy, player));
  add("Back", () => showMenu(player, buddy));
  let res;
  try { res = await form.show(player); } catch { return; }
  if (res.canceled) return;
  try { opts[res.selection](); } catch { }
}

// ---------- hide and seek ----------
function findHideSpot(player) {
  const dim = player.dimension, { x, y, z } = player.location;
  let best = null;
  for (let i = 0; i < 60; i++) {
    const a = Math.random() * Math.PI * 2, d = rand(12, 28);
    const bx = Math.floor(x + Math.cos(a) * d), bz = Math.floor(z + Math.sin(a) * d);
    for (let by = Math.floor(y) + 10; by >= Math.floor(y) - 12; by--) {
      let b, u1, u2;
      try { b = dim.getBlock({ x: bx, y: by, z: bz }); u1 = dim.getBlock({ x: bx, y: by + 1, z: bz }); u2 = dim.getBlock({ x: bx, y: by + 2, z: bz }); } catch { break; }
      if (!b || !u1 || !u2) break;
      if (b.isAir || b.isLiquid) continue;
      if (!u1.isAir || !u2.isAir) break;
      const id = b.typeId;
      if (id.includes("lava") || id.includes("cactus") || id.includes("magma") || id.includes("fire") || id.includes("leaves")) break;
      let walls = 0;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        try { const n = dim.getBlock({ x: bx + dx, y: by + 1, z: bz + dz }); if (n && !n.isAir && !n.isLiquid) walls++; } catch { }
      }
      const spot = { x: bx + 0.5, y: by + 1, z: bz + 0.5 };
      if (walls >= 2) return spot;
      if (!best || walls > best.walls) best = { spot, walls };
      break;
    }
  }
  return best ? best.spot : null;
}

function startHide(buddy, player) {
  const c = LINES[TYPES[buddy.typeId]];
  const g = { type: "hide", buddy, player, hidden: false, start: 0, lastGiggle: 0, lastPsst: 0 };
  games.set(buddy.id, g);
  applyMode(buddy, "stay");
  speak(buddy, "hs_start", player);
  actionBar(player, "Count to 20... no peeking!");
  later(buddy, g, 20 * 20, () => {
    const spot = findHideSpot(player);
    if (!spot) { player.sendMessage("§7Couldn't find a hiding spot here. Try somewhere more open."); endGame(buddy, player); return; }
    try { buddy.teleport(spot); } catch { }
    g.hidden = true; g.start = system.currentTick;
    player.sendMessage(`${c.color}${c.name}§r is hiding! Tap them or get close to find them. Stuck? Type §e/scriptevent buddy:hint`);
  });
  g.interval = system.runInterval(() => hideTick(buddy, player, g), 20);
}

function hideTick(buddy, player, g) {
  if (!alive(buddy) || !alive(player)) { games.delete(buddy.id); try { system.clearRun(g.interval); } catch { } return; }
  if (!g.hidden) return;
  const now = system.currentTick, d = dist(buddy.location, player.location);
  if (d <= 2.5) { hideFound(buddy, player); return; }
  if (now - g.start > 20 * 240) {
    speak(buddy, "hs_timeout", player);
    const l = buddy.location;
    player.sendMessage(`§7They were hiding at ${Math.floor(l.x)}, ${Math.floor(l.y)}, ${Math.floor(l.z)}.`);
    endGame(buddy, player);
    return;
  }
  if (d <= 9 && now - g.lastPsst > 20 * 14) { g.lastPsst = now; speak(buddy, "hs_psst", player); }
  else if (d <= 16 && now - g.lastGiggle > 20 * 35) { g.lastGiggle = now; speak(buddy, "hs_giggle", player); }
}

function hideFound(buddy, player) {
  if (!games.has(buddy.id)) return;
  heart(buddy);
  speak(buddy, "hs_found", player);
  gift(buddy, player, true);
  endGame(buddy, player);
}

function giveHint(player) {
  if (!player) return;
  for (const g of games.values()) {
    if (g.type !== "hide" || !g.hidden || g.player !== player) continue;
    const a = player.location, b = g.buddy.location, d = dist(a, b);
    const dir = Math.abs(b.x - a.x) > Math.abs(b.z - a.z) ? (b.x > a.x ? "east" : "west") : (b.z > a.z ? "south" : "north");
    const temp = d > 40 ? "Freezing cold" : d > 25 ? "Cold" : d > 15 ? "Warm" : d > 8 ? "Hot" : "Burning hot";
    actionBar(player, `${temp}! Try heading ${dir}.`);
    return;
  }
  try { player.sendMessage("§7No hide and seek game is running."); } catch { }
}

// ---------- tag: catch them 3 times ----------
function startTag(buddy, player) {
  const g = { type: "tag", count: 0, cool: 0, start: system.currentTick };
  games.set(buddy.id, g);
  applyMode(buddy, "follow");
  try { buddy.triggerEvent("jjmikey:flee_on"); } catch { }
  speak(buddy, "tag_start", player);
  g.interval = system.runInterval(() => {
    if (!alive(buddy) || !alive(player)) { games.delete(buddy.id); try { system.clearRun(g.interval); } catch { } return; }
    const now = system.currentTick;
    if (now - g.cool > 40 && dist(buddy.location, player.location) <= 1.9) {
      g.cool = now; g.count++;
      heart(buddy);
      actionBar(player, `Tagged! ${g.count}/3`);
      if (g.count >= 3) { speak(buddy, "tag_end", player); gift(buddy, player, true); endGame(buddy, player); return; }
      speak(buddy, "tag_tagged", player);
    }
    if (now - g.start > 20 * 180) { speak(buddy, "tag_end", player); endGame(buddy, player); }
  }, 4);
}

// ---------- Simon Says ----------
const SIMON = { jump: "JUMP", crouch: "CROUCH (sneak)", sprint: "SPRINT", look: "LOOK UP" };
function startSimon(buddy, player) {
  const g = { type: "simon", round: 0, score: 0, rounds: 6 };
  games.set(buddy.id, g);
  speak(buddy, "simon_start", player);
  later(buddy, g, 20 * 4, () => simonRound(buddy, player, g));
}
function simonRound(buddy, player, g) {
  if (!alive(player) || !alive(buddy)) { games.delete(buddy.id); return; }
  if (g.round >= g.rounds) {
    const win = g.score >= 4;
    speak(buddy, win ? "sim_win" : "sim_lose", player);
    if (win) gift(buddy, player, true);
    player.sendMessage(`§eSimon Says score: ${g.score}/${g.rounds}`);
    endGame(buddy, player);
    return;
  }
  g.round++;
  const simon = Math.random() < 0.65, act = pick(Object.keys(SIMON));
  speak(buddy, (simon ? "sim_" : "trap_") + act, player);
  actionBar(player, (simon ? "Simon says: " : "") + SIMON[act]);
  let acted = false, ticks = 0;
  const iv = system.runInterval(() => {
    if (games.get(buddy.id) !== g || !alive(player)) { system.clearRun(iv); return; }
    ticks += 2;
    try {
      if (act === "jump" && player.isJumping) acted = true;
      if (act === "crouch" && player.isSneaking) acted = true;
      if (act === "sprint" && player.isSprinting) acted = true;
      if (act === "look" && player.getRotation().x < -45) acted = true;
    } catch { }
    if (ticks < 100) return;
    system.clearRun(iv);
    if (simon) { if (acted) { g.score++; speak(buddy, "sim_good", player); } else speak(buddy, "sim_miss", player); }
    else { if (acted) speak(buddy, "sim_bad", player); else { g.score++; speak(buddy, "sim_good", player); } }
    later(buddy, g, 50, () => simonRound(buddy, player, g));
  }, 2);
}

// ---------- rock, paper, scissors ----------
async function rpsMenu(player, buddy) {
  if (!alive(buddy)) return;
  const c = LINES[TYPES[buddy.typeId]];
  const form = new ActionFormData().title(`${c.color}${c.name}`).body("Rock, paper, scissors!").button("Rock").button("Paper").button("Scissors");
  let res;
  try { res = await form.show(player); } catch { return; }
  if (res.canceled) return;
  const names = ["Rock", "Paper", "Scissors"], me = Math.floor(Math.random() * 3), you = res.selection;
  speak(buddy, "rps_start", player);
  system.runTimeout(() => {
    if (!alive(buddy)) return;
    player.sendMessage(`§7You: ${names[you]}  |  ${c.name}: ${names[me]}`);
    if (me === you) speak(buddy, "rps_tie", player);
    else if ((you + 1) % 3 === me) speak(buddy, "rps_win", player);
    else { speak(buddy, "rps_lose", player); gift(buddy, player, true); }
  }, 30);
}
