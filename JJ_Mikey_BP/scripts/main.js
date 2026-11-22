// JJ & Mikey buddies: tap-to-talk menu, context-aware chatter, gifts, stay/follow, punching.
import { world, system, ItemStack, BlockVolume } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
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
  speakLine(entity, chooseLine(entity, player, category), player);
}
function speakLine(entity, line, player) {
  if (!alive(entity)) return;
  const c = LINES[TYPES[entity.typeId]];
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
  add(`Talk to ${c.name} (type)`, () => talkForm(player, buddy));
  add("Find something...", () => findMenu(player, buddy));
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
  if (cmd === "say") { respondTo(ev.sourceEntity, ev.message, false); return; }
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
    if (g.type === "hide" || g.type === "simon" || g.type === "find") applyMode(buddy, "follow");
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
  applyMode(buddy, "stay");
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
  if (simon) buddyDo(buddy, player, act);
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

// =====================================================================
// SIMON SAYS: the buddy does the action too
// =====================================================================
function buddyDo(buddy, player, act) {
  try { buddy.teleport(buddy.location, { facingLocation: player.location }); } catch { }
  try {
    if (act === "jump") {
      buddy.applyImpulse({ x: 0, y: 0.55, z: 0 });
    } else if (act === "crouch") {
      buddy.triggerEvent("jjmikey:crouch_on");
      system.runTimeout(() => { try { buddy.triggerEvent("jjmikey:crouch_off"); } catch { } }, 50);
    } else if (act === "sprint") {
      let n = 0;
      const iv = system.runInterval(() => {
        if (!alive(buddy) || ++n > 14) { system.clearRun(iv); return; }
        const d = buddy.getViewDirection();
        buddy.applyImpulse({ x: d.x * 0.16, y: 0, z: d.z * 0.16 });
      }, 2);
    } else if (act === "look") {
      const r = buddy.getRotation();
      buddy.setRotation({ x: -70, y: r.y });
      system.runTimeout(() => { try { buddy.setRotation({ x: 0, y: buddy.getRotation().y }); } catch { } }, 50);
    }
  } catch { }
}

// =====================================================================
// FIND SOMETHING: the buddy searches the loaded world, then leads you there in hops
// =====================================================================
const FIND = {
  diamond: { label: "Diamonds", types: ["minecraft:diamond_ore", "minecraft:deepslate_diamond_ore"] },
  iron: { label: "Iron", types: ["minecraft:iron_ore", "minecraft:deepslate_iron_ore"] },
  gold: { label: "Gold", types: ["minecraft:gold_ore", "minecraft:deepslate_gold_ore", "minecraft:nether_gold_ore"] },
  coal: { label: "Coal", types: ["minecraft:coal_ore", "minecraft:deepslate_coal_ore"] },
  emerald: { label: "Emeralds", types: ["minecraft:emerald_ore", "minecraft:deepslate_emerald_ore"] },
  lapis: { label: "Lapis", types: ["minecraft:lapis_ore", "minecraft:deepslate_lapis_ore"] },
  redstone: { label: "Redstone", types: ["minecraft:redstone_ore", "minecraft:deepslate_redstone_ore", "minecraft:lit_redstone_ore"] },
  copper: { label: "Copper", types: ["minecraft:copper_ore", "minecraft:deepslate_copper_ore"] },
  debris: { label: "Ancient debris", types: ["minecraft:ancient_debris"] },
  chest: { label: "A chest", types: ["minecraft:chest", "minecraft:trapped_chest"] },
  village: { label: "A village", types: ["minecraft:bell"] },
};
const FIND_WORDS = [["diamond", "diamond"], ["iron", "iron"], ["gold", "gold"], ["coal", "coal"], ["emerald", "emerald"], ["lapis", "lapis"],
  ["redstone", "redstone"], ["copper", "copper"], ["debris", "debris|netherite"], ["chest", "chest|treasure|loot"], ["village", "village|villager|bell|town"]];
function findKey(t) {
  for (const [k, w] of FIND_WORDS) if (new RegExp("\\b(" + w + ")").test(t)) return k;
  return null;
}

const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
function compass(a, b) {
  const ang = (Math.atan2(b.z - a.z, b.x - a.x) * 180) / Math.PI;
  return ["east", "southeast", "south", "southwest", "west", "northwest", "north", "northeast"][Math.round(((ang + 360) % 360) / 45) % 8];
}

function standAt(dim, bx, bz, refY) {
  const bad = /lava|cactus|magma|fire|leaves|water|ice/;
  const good = (b, u1, u2) => b && u1 && u2 && !b.isAir && !b.isLiquid && u1.isAir && u2.isAir && !bad.test(b.typeId);
  for (let by = Math.floor(refY) + 8; by >= Math.floor(refY) - 12; by--) {
    try {
      const b = dim.getBlock({ x: bx, y: by, z: bz }), u1 = dim.getBlock({ x: bx, y: by + 1, z: bz }), u2 = dim.getBlock({ x: bx, y: by + 2, z: bz });
      if (good(b, u1, u2)) return { x: bx + 0.5, y: by + 1, z: bz + 0.5 };
    } catch { return null; }
  }
  try {
    const top = dim.getTopmostBlock({ x: bx, z: bz });
    if (top) {
      const y = top.location.y;
      const u1 = dim.getBlock({ x: bx, y: y + 1, z: bz }), u2 = dim.getBlock({ x: bx, y: y + 2, z: bz });
      if (good(top, u1, u2)) return { x: bx + 0.5, y: y + 1, z: bz + 0.5 };
    }
  } catch { }
  return null;
}

function searchChunk(dim, c, minY, maxY, types, from) {
  try {
    const vol = new BlockVolume({ x: c.cx * 16, y: minY, z: c.cz * 16 }, { x: c.cx * 16 + 15, y: maxY, z: c.cz * 16 + 15 });
    const res = dim.getBlocks(vol, { includeTypes: types }, true);
    let best = null, bd = Infinity;
    for (const loc of res.getBlockLocationIterator()) {
      const d = Math.hypot(loc.x - from.x, loc.y - from.y, loc.z - from.z);
      if (d < bd) { bd = d; best = loc; }
    }
    return best;
  } catch { return null; }
}

function nearestVillager(dim, from) {
  try {
    const list = dim.getEntities({ type: "minecraft:villager_v2" });
    let best = null, bd = Infinity;
    for (const v of list) { const d = dist(v.location, from); if (d < bd) { bd = d; best = v.location; } }
    return best;
  } catch { return null; }
}

function puff(entity) { try { entity.runCommand("particle minecraft:villager_happy ~ ~1 ~"); } catch { } }

function hop(buddy, g, step, from) {
  const o = from ?? buddy.location, t = g.target;
  const dx = t.x - o.x, dz = t.z - o.z, d = Math.hypot(dx, dz) || 1;
  for (const sz of [step, step * 0.7, step * 0.45, 3]) {
    const L = Math.min(Math.max(sz, 2), d);
    const spot = standAt(buddy.dimension, Math.floor(o.x + (dx / d) * L), Math.floor(o.z + (dz / d) * L), o.y);
    if (spot) {
      try { buddy.teleport(spot, { facingLocation: { x: t.x, y: spot.y + 1.5, z: t.z } }); } catch { return false; }
      puff(buddy);
      return true;
    }
  }
  return false;
}

function beginLead(buddy, player, g, t) {
  const f = FIND[g.key];
  g.phase = "lead"; g.target = t; g.lastProgress = system.currentTick;
  player.sendMessage(`§aFound ${f.label.toLowerCase()} about ${Math.floor(dist2(t, player.location))} blocks away (${compass(player.location, t)}). Follow ${LINES[TYPES[buddy.typeId]].name}!`);
  hop(buddy, g, 4, player.location);
}

function arrive(buddy, player, g) {
  const t = g.target, f = FIND[g.key];
  const spot = standAt(buddy.dimension, Math.floor(t.x), Math.floor(t.z), t.y);
  if (spot) { try { buddy.teleport(spot, { facingLocation: t }); } catch { } }
  const dy = Math.round(t.y - (spot ? spot.y : buddy.location.y));
  const where = dy < -3 ? `about ${-dy} blocks below us. Dig down!` : dy > 3 ? `about ${dy} blocks above us.` : "right around here.";
  player.sendMessage(`§a${f.label} at ${Math.floor(t.x)}, ${Math.floor(t.y)}, ${Math.floor(t.z)}: ${where}`);
  try { buddy.dimension.runCommand(`particle minecraft:totem_particle ${t.x + 0.5} ${t.y + 1} ${t.z + 0.5}`); } catch { }
  heart(buddy);
  speak(buddy, "find_arrive", player);
  endGame(buddy, player);
}

function leadTick(buddy, player, g) {
  const now = system.currentTick, t = g.target, f = FIND[g.key];
  const remain = dist2(buddy.location, t), pd = dist(buddy.location, player.location);
  if (now - g.lastBar > 20) { g.lastBar = now; actionBar(player, `${f.label}: ${Math.floor(dist2(player.location, t))} blocks ${compass(player.location, t)}`); }
  if (remain <= 4) { arrive(buddy, player, g); return; }
  if (pd <= 7 && now - g.lastHop > 30) {
    g.lastHop = now;
    if (hop(buddy, g, Math.min(14, Math.max(3, remain - 2)))) {
      g.hops++; g.lastProgress = now; g.fails = 0;
      if (g.hops % 3 === 1) speak(buddy, "find_hop", player);
    } else if (++g.fails >= 3) {
      speak(buddy, "find_stuck", player);
      player.sendMessage(`§7Head ${compass(buddy.location, t)} for about ${Math.floor(remain)} blocks.`);
      endGame(buddy, player);
    }
  } else if (pd > 7 && now - g.lastCall > 20 * 10) {
    g.lastCall = now; speak(buddy, "find_hop", player);
  }
  if (now - g.lastProgress > 20 * 120) { speak(buddy, "find_cancel", player); endGame(buddy, player); }
}

function startFind(buddy, player, key) {
  if (!alive(buddy) || !alive(player)) return;
  if (games.has(buddy.id)) endGame(buddy, player);
  const f = FIND[key];
  const g = { type: "find", key, buddy, player, phase: "search", target: null, hops: 0, fails: 0, lastHop: 0, lastCall: 0, lastBar: 0, ticks: 0, lastProgress: system.currentTick };
  games.set(buddy.id, g);
  applyMode(buddy, "stay");
  speak(buddy, "find_start", player);
  player.sendMessage(`§7Searching for ${f.label.toLowerCase()}...`);
  const dim = player.dimension, p = player.location;
  let minY = Math.floor(p.y) - 64, maxY = Math.floor(p.y) + 64;
  try { minY = Math.max(dim.heightRange.min, minY); maxY = Math.min(dim.heightRange.max - 1, maxY); } catch { }
  const cx0 = Math.floor(p.x / 16), cz0 = Math.floor(p.z / 16), R = 8, chunks = [];
  for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) chunks.push({ cx: cx0 + dx, cz: cz0 + dz, d: dx * dx + dz * dz });
  chunks.sort((a, b) => a.d - b.d);
  let i = 0;
  g.interval = system.runInterval(() => {
    if (games.get(buddy.id) !== g) { try { system.clearRun(g.interval); } catch { } return; }
    if (!alive(buddy) || !alive(player)) { endGame(buddy, player); return; }
    if (g.phase === "search") {
      for (let n = 0; n < 6 && i < chunks.length && g.phase === "search"; n++, i++) {
        const t = searchChunk(dim, chunks[i], minY, maxY, f.types, p);
        if (t) beginLead(buddy, player, g, t);
      }
      if (g.phase === "search" && i >= chunks.length) {
        const t = key === "village" ? nearestVillager(dim, p) : null;
        if (t) beginLead(buddy, player, g, t);
        else { speak(buddy, "find_none", player); endGame(buddy, player); }
      }
      return;
    }
    if (++g.ticks % 3 === 0) leadTick(buddy, player, g);
  }, 4);
}

async function findMenu(player, buddy) {
  if (!alive(buddy)) return;
  const c = LINES[TYPES[buddy.typeId]];
  const keys = Object.keys(FIND);
  const form = new ActionFormData().title(`${c.color}${c.name}: find`).body("What should we look for? (Only works in loaded areas near you.)");
  for (const k of keys) form.button(FIND[k].label);
  form.button("Back");
  let res;
  try { res = await form.show(player); } catch { return; }
  if (res.canceled) return;
  if (res.selection < keys.length) startFind(buddy, player, keys[res.selection]); else showMenu(player, buddy);
}

// =====================================================================
// TALKING: type to them and get a contextual reply
// =====================================================================
function nearbyBuddies(player, r = 24) {
  const out = [];
  for (const type of Object.keys(TYPES)) {
    try { for (const b of player.dimension.getEntities({ type, location: player.location, maxDistance: r })) out.push(b); } catch { }
  }
  out.sort((a, b) => dist(a.location, player.location) - dist(b.location, player.location));
  return out;
}

function respondTo(player, raw, native) {
  if (!player || !raw) return;
  const list = nearbyBuddies(player);
  if (list.length === 0) { try { player.sendMessage("§7No JJ or Mikey close enough to hear you."); } catch { } return; }
  let text = String(raw).toLowerCase().trim();
  let buddy = list[0];
  const named = /\bjj\b/.test(text) ? "jjmikey:jj" : /\bmikey\b/.test(text) ? "jjmikey:mikey" : null;
  if (named) { const m = list.find((b) => b.typeId === named); if (m) buddy = m; }
  if (native && !named && dist(buddy.location, player.location) > 8) return; // don't answer ordinary chat from afar
  text = text.replace(/\b(jj|mikey)\b[,:!]?/g, " ").replace(/\s+/g, " ").trim();
  if (!native) { try { player.sendMessage(`§7You: ${raw}`); } catch { } }
  system.runTimeout(() => { if (alive(buddy) && alive(player)) reply(buddy, player, text); }, 12);
}

function speakContext(buddy, player) {
  const c = LINES[TYPES[buddy.typeId]];
  const ctx = context(buddy, player);
  const ok = c.talk.filter((l) => l.when && l.when.length > 0 && l.when.every((t) => ctx.has(t)));
  if (ok.length > 0) speakLine(buddy, pick(ok), player); else speak(buddy, "chat_see_none", player);
}

function reply(buddy, player, t) {
  const has = (re) => re.test(t);
  const tamed = buddy.hasTag("jjmikey_tamed");
  const g = games.get(buddy.id);
  const key = findKey(t);
  if (has(/\b(stop|cancel|never ?mind|quit)\b/)) { if (g) { speak(buddy, "find_cancel", player); endGame(buddy, player); } else speak(buddy, "chat_unknown", player); return; }
  if (has(/where( are| r)? (you|u)\b|^where( is|'s)?$|where did you go/)) return speak(buddy, "chat_where", player);
  if (has(/\b(find|show me|lead|take me|where|locate|search|look for|get me|bring me|guide|any)\b/) && key) return startFind(buddy, player, key);
  if (has(/\b(find|show me|lead me|take me|locate|search|look for)\b/)) return speak(buddy, "find_what", player);
  if (has(/\bsit\b/)) return setMode(buddy, player, "sit");
  if (has(/\b(stay|wait|stand|freeze)\b/)) return setMode(buddy, player, "stay");
  if (has(/\b(follow|come|with me|let'?s go|walk with)\b/)) return setMode(buddy, player, "follow");
  if (has(/\b(punch|attack|hit|smash|fight)\b/)) return tamed ? punch(buddy, player) : speak(buddy, "chat_tame_no", player);
  if (has(/\b(gift|give me|present|reward)\b/)) return gift(buddy, player);
  if (has(/hide( and|n)? ?seek|\bhide\b/)) return startHide(buddy, player);
  if (has(/simon/)) return startSimon(buddy, player);
  if (has(/rock.?paper|\brps\b/)) return rpsMenu(player, buddy);
  if (has(/\btag\b/)) return tamed ? startTag(buddy, player) : speak(buddy, "chat_tame_no", player);
  if (has(/\b(game|games|play|bored)\b/)) return speak(buddy, "chat_games", player);
  if (has(/what do you see|what'?s (around|nearby|there|here)|look around|see anything|anything (nearby|interesting)|notice/)) return speakContext(buddy, player);
  if (has(/\btime\b|what (day|night)|is it (day|night)|morning|evening|bed ?time/)) {
    let night = false; try { const tod = world.getTimeOfDay(); night = tod >= 13000 && tod < 23000; } catch { }
    return speak(buddy, night ? "chat_time_night" : "chat_time_day", player);
  }
  if (has(/weather|rain|storm|sunny|cloud/)) {
    let rain = false; try { rain = buddy.dimension.getWeather() !== "Clear"; } catch { }
    return speak(buddy, rain ? "chat_weather_rain" : "chat_weather_clear", player);
  }
  if (has(/am i (ok|okay|hurt|dying|alive)|my health|how am i|how do i look/)) {
    let low = false; try { const hp = player.getComponent("minecraft:health"); low = hp && hp.currentValue <= 8; } catch { }
    return speak(buddy, low ? "chat_health_low" : "chat_health_ok", player);
  }
  if (has(/\b(tame|be my friend|friends?|pet)\b/)) return speak(buddy, tamed ? "chat_tame_yes" : "chat_tame_no", player);
  if (has(/who are you|your name|what are you/)) return speak(buddy, "chat_name", player);
  if (has(/how (are|r) (you|u)|how'?s it going|you (ok|okay|good)|what'?s up|\bsup\b/)) return speak(buddy, "chat_how", player);
  if (has(/thank|thx|cheers/)) return speak(buddy, "chat_thanks", player);
  if (has(/love you|you('?re| are) (the )?(best|awesome|great|cool|amazing)|good (job|boy)|well done|nice one/)) return speak(buddy, "chat_love", player);
  if (has(/stupid|dumb|idiot|hate you|shut up|ugly|useless/)) return speak(buddy, "chat_rude", player);
  if (has(/hungry|food|snack|cookie|\beat\b/)) return speak(buddy, "chat_food", player);
  if (has(/joke|funny|make me laugh/)) return speak(buddy, "chat_joke", player);
  if (has(/\bbye\b|goodbye|see you|gtg|cya|good ?night/)) return speak(buddy, "chat_bye", player);
  if (has(/scared|afraid|spooky|creeper|monster|zombie/)) return speak(buddy, "chat_scared", player);
  if (has(/\bhelp\b|what can you do|commands|how do i/)) return speak(buddy, "chat_help", player);
  if (has(/subscribe|like and|youtube|channel|views|vlog/)) return speak(buddy, "catch", player);
  if (has(/\b(hi|hello|hey|yo|howdy|hiya|heya)\b|good (morning|evening|afternoon)/)) return speak(buddy, "chat_greet", player);
  if (t.includes("?")) return speak(buddy, "chat_unknown", player);
  if (Math.random() < 0.5) return speakContext(buddy, player);
  speak(buddy, "chat_unknown", player);
}

async function talkForm(player, buddy, tries = 0) {
  if (!alive(buddy)) return;
  const c = LINES[TYPES[buddy.typeId]];
  const form = new ModalFormData().title(`Talk to ${c.name}`)
    .textField("Say something (try: find me diamonds, tell me a joke, play hide and seek, how am I doing?)", "Type here...");
  let res;
  try { res = await form.show(player); } catch { return; }
  if (res.canceled) {
    if (res.cancelationReason === "UserBusy" && tries < 6) system.runTimeout(() => talkForm(player, buddy, tries + 1), 10);
    return;
  }
  const text = String((res.formValues && res.formValues[0]) || "").trim();
  if (!text) return;
  try { player.sendMessage(`§7You: ${text}`); } catch { }
  system.runTimeout(() => { if (alive(buddy) && alive(player)) reply(buddy, player, text.toLowerCase().replace(/\b(jj|mikey)\b[,:!]?/g, " ").replace(/\s+/g, " ").trim()); }, 12);
}

// Real in-game chat: only available if this Minecraft version exposes the (pre-release) chat event.
try {
  if (world.afterEvents && world.afterEvents.chatSend) {
    world.afterEvents.chatSend.subscribe((ev) => respondTo(ev.sender, ev.message, true));
  }
} catch { }
