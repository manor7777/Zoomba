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

function gift(buddy, player) {
  const c = LINES[TYPES[buddy.typeId]];
  const s = st(buddy);
  const now = system.currentTick;
  if (now - s.lastGift < 20 * 45) { speak(buddy, "nogift", player); return; }
  s.lastGift = now;
  const total = c.gifts.reduce((a, g) => a + g[1], 0);
  let roll = Math.random() * total, g = c.gifts[0];
  for (const cand of c.gifts) { roll -= cand[1]; if (roll <= 0) { g = cand; break; } }
  const count = Math.floor(rand(g[2], g[3] + 0.999));
  try {
    player.dimension.spawnItem(new ItemStack(`minecraft:${g[0]}`, count), player.location);
  } catch { }
  heart(buddy);
  speak(buddy, "gift", player);
}

function setMode(buddy, player, mode) {
  buddy.removeTag("jjmikey_stay");
  buddy.removeTag("jjmikey_sit");
  try { buddy.triggerEvent("jjmikey:go"); } catch { }
  if (mode === "stay") {
    buddy.addTag("jjmikey_stay");
    try { buddy.triggerEvent("jjmikey:stay"); } catch { }
    speak(buddy, "stay", player);
  } else if (mode === "sit") {
    buddy.addTag("jjmikey_sit");
    try { buddy.triggerEvent("jjmikey:sit"); } catch { }
    speak(buddy, "sit", player);
  } else {
    speak(buddy, "go", player);
  }
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

// ---------- tap to open the menu ----------
world.afterEvents.playerInteractWithEntity.subscribe((ev) => {
  const buddy = ev.target;
  if (!(buddy.typeId in TYPES)) return;
  const held = ev.itemStack?.typeId;
  if (!buddy.hasTag("jjmikey_tamed") && (held === "minecraft:cookie" || held === "minecraft:golden_apple")) return; // let taming happen
  system.run(() => showMenu(ev.player, buddy));
});
