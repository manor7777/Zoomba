# All dialogue. 'when' = context tags that must ALL be true (checked by scripts/main.js). No 'when' = always allowed.
LINES = {
"jj": {
 "name": "JJ", "color": "§c", "voice": {"base": 300, "speed": 1.0},
 "gifts": [["emerald", 3, 1, 3], ["bread", 3, 1, 2], ["iron_ingot", 2, 1, 2], ["golden_apple", 1, 1, 1], ["diamond", 1, 1, 1]],
 "talk": [
  ("hey", "Hey! Wanna go on an adventure?", []),
  ("backup", "Don't worry, I've got your back!", []),
  ("build", "Let's build something awesome today!", []),
  ("wander", "Where did Mikey wander off to this time?", []),
  ("friend", "You're my favorite person to explore with!", []),
  ("chest", "Ooh, a chest! Think there's anything good inside?", ["chest"]),
  ("chest2", "I bet that chest is full of emeralds!", ["chest"]),
  ("bed", "That bed looks so comfy. Nap time?", ["bed"]),
  ("craft", "A crafting table! Let's make something cool.", ["crafting"]),
  ("furnace", "Something smells good. Is that the furnace?", ["furnace"]),
  ("books", "So many books. I only read the pictures.", ["bookshelf"]),
  ("water", "I'm not swimming. Water is wet. I checked.", ["water"]),
  ("lava", "Whoa, lava! Do not poke it, okay?", ["lava"]),
  ("diamond", "Is that a diamond ore?! Mine it, mine it!", ["diamond_ore"]),
  ("night", "It's getting dark. Stay close to me!", ["night"]),
  ("day", "Beautiful day for an adventure!", ["day"]),
  ("rain", "It's raining! Good thing I'm wearing my hoodie.", ["rain"]),
  ("monster", "Monster! Get behind me!", ["monster"]),
  ("hurt", "You're hurt! Eat something, quick!", ["lowhealth"]),
  ("sword", "Nice sword! Can I hold it? Just once?", ["sword"]),
  ("pick", "Let's go mining! Diamonds, here we come!", ["pickaxe"]),
  ("deep", "It's dark down here. I don't like it.", ["underground"]),
  ("high", "Wow, we're really high up!", ["high"]),
  ("buddy", "Mikey, stop following me! ...Okay, you can stay.", ["buddy"]),
  ("buddy2", "Mikey and me make the best team.", ["buddy"]),
 ],
 "gift": [("gift1", "Here, take this!", []), ("gift2", "Found this just for you!", []), ("gift3", "A gift from your best friend!", [])],
 "nogift": [("nogift", "Give me a second, I'm all out right now!", [])],
 "tamed": [("tamed", "Yay! We're best friends now. Let's go!", [])],
 "stay": [("stay", "Okay, I'll wait right here.", [])],
 "go": [("go", "Let's go!", [])],
 "punch": [("punch1", "Hiyah!", []), ("punch2", "Take that!", []), ("punch3", "Smash!", [])],
 "punch_block": [("pblock", "Bam! Gone!", [])],
 "punch_none": [("pnone", "There's nothing to punch over there.", [])],

 "sit": [("sit", "Ahh, a nice sit-down.", [])],
 "notice_diamond": [("n_dia1", "Wait... is that a diamond?! Over there!", []), ("n_dia2", "Diamonds! I see diamonds!", [])],
 "notice_spawner": [("n_spa1", "Uh oh, that looks like a monster spawner. Careful!", []), ("n_spa2", "A spawner! Let's not poke it. Or... maybe we should.", [])],
 "notice_ore": [("n_ore1", "Ooh, shiny ore over there!", []), ("n_ore2", "Do I see gold? I think I see gold!", [])],
 "notice_creeper": [("n_cre1", "Creeper! Back away slowly!", []), ("n_cre2", "Is that a creeper?! Run!", [])],
 "notice_chest": [("n_che1", "Hey, a chest! Let's check it out!", []), ("n_che2", "Treasure chest, right over there!", [])],
 "notice_villager": [("n_vil1", "Hey, a villager! Hmm hmm hmm.", []), ("n_vil2", "Look, a villager. Maybe they want to trade.", [])],
 "notice_flower": [("n_flo1", "Nice flowers! Mikey would eat those.", []), ("n_flo2", "Look at those pretty flowers!", [])],
},
"mikey": {
 "name": "Mikey", "color": "§a", "voice": {"base": 215, "speed": 0.95},
 "gifts": [["gold_ingot", 3, 1, 3], ["cookie", 3, 1, 4], ["cooked_beef", 2, 1, 2], ["golden_apple", 1, 1, 1], ["diamond", 1, 1, 1]],
 "talk": [
  ("hi", "Oh, hi! I was just thinking about snacks.", []),
  ("scared", "I'm not scared. Okay, maybe a little.", []),
  ("cool", "Look at this cool thing I found!", []),
  ("hide", "Wanna play hide and seek?", []),
  ("friend", "You're a really good friend, you know that?", []),
  ("chest", "A chest! Quick, open it before JJ sees!", ["chest"]),
  ("chest2", "I hope there are cookies in that chest.", ["chest"]),
  ("bed", "I could sleep in that bed for a week.", ["bed"]),
  ("craft", "Crafting table time! What are we making?", ["crafting"]),
  ("furnace", "The furnace is cooking! Is it food? Please be food.", ["furnace"]),
  ("books", "Books? I'd rather read a menu.", ["bookshelf"]),
  ("water", "Nope. Not going near the water.", ["water"]),
  ("lava", "Is that lava?! Let's not be near the lava.", ["lava"]),
  ("diamond", "Shiny blue rocks! Diamonds! Get them!", ["diamond_ore"]),
  ("night", "It's dark... and I can hear things. Can we go home?", ["night"]),
  ("day", "Nice and sunny. Perfect for a picnic.", ["day"]),
  ("rain", "Ugh, rain. My hoodie is getting soggy.", ["rain"]),
  ("monster", "Monster! Monster! Do something!", ["monster"]),
  ("hurt", "You don't look so good. Here, sit down for a bit.", ["lowhealth"]),
  ("sword", "That's a sharp sword. Please don't swing it near me.", ["sword"]),
  ("pick", "A pickaxe! Are we going mining? I'll hold the torches.", ["pickaxe"]),
  ("deep", "It's really dark in here. JJ? JJ, are you there?", ["underground"]),
  ("high", "We're way too high up. I don't like heights.", ["high"]),
  ("buddy", "JJ, don't leave me!", ["buddy"]),
  ("buddy2", "JJ, did you eat my snack again?", ["buddy"]),
 ],
 "gift": [("gift1", "Shh, I found this. It's for you.", []), ("gift2", "Here, I saved you some!", []), ("gift3", "Don't tell JJ I gave you this.", [])],
 "nogift": [("nogift", "I'm all out! Try again in a bit.", [])],
 "tamed": [("tamed", "Okay, I'm sticking with you. Don't go too far!", [])],
 "stay": [("stay", "Okay, I'll stay put. Don't forget me!", [])],
 "go": [("go", "Right behind you!", [])],
 "punch": [("punch1", "Hey! Back off!", []), ("punch2", "Boom!", []), ("punch3", "Not today!", [])],
 "punch_block": [("pblock", "Done! That was easy.", [])],
 "punch_none": [("pnone", "I don't see anything to punch.", [])],

 "sit": [("sit", "Finally, a break!", [])],
 "notice_diamond": [("n_dia1", "Shiny! Shiny blue thing! Is that a diamond?", []), ("n_dia2", "JJ would love this. Diamonds over there!", [])],
 "notice_spawner": [("n_spa1", "That's a spawner. I really don't like spawners.", []), ("n_spa2", "Spawner! Nope nope nope.", [])],
 "notice_ore": [("n_ore1", "I see shiny stuff in the wall!", []), ("n_ore2", "Is that gold? Can we get the gold?", [])],
 "notice_creeper": [("n_cre1", "Creeper! Creeper! Everybody run!", []), ("n_cre2", "Please tell me that's not a creeper.", [])],
 "notice_chest": [("n_che1", "A chest! Do you think it has snacks?", []), ("n_che2", "Ooh, a chest. Let's peek inside.", [])],
 "notice_villager": [("n_vil1", "A villager! Do they have any food?", []), ("n_vil2", "Hey, a villager. Hello! ...Hmm.", [])],
 "notice_flower": [("n_flo1", "Flowers! Those smell nice.", []), ("n_flo2", "Pretty flowers. I'm gonna pick one for JJ.", [])],
},
}
CATS = ["talk", "gift", "nogift", "tamed", "stay", "sit", "go", "punch", "punch_block", "punch_none",
        "notice_diamond", "notice_spawner", "notice_ore", "notice_creeper", "notice_chest", "notice_villager", "notice_flower"]

# ---------- v1.5: catchphrases + games ----------
def _one(i, t): return [(i, t, [])]
_COMMON = {  # same words for both, different voices
 "sim_jump": "Simon says jump!", "sim_crouch": "Simon says crouch!", "sim_sprint": "Simon says sprint!", "sim_look": "Simon says look up!",
 "trap_jump": "Jump!", "trap_crouch": "Crouch!", "trap_sprint": "Sprint!", "trap_look": "Look up!",
 "rps_start": "Rock, paper, scissors, shoot!",
}
_PER = {
 "jj": {
  "catch": ["Don't forget to like and subscribe!", "Smash that like button!", "Hit the bell so you don't miss the next one!",
            "Welcome back to the channel, everybody!", "Leave a comment down below!", "Thanks for watching, see you next time!"],
  "hs_start": "Okay! Count to twenty and no peeking. I'm going to hide!",
  "hs_giggle": "Hehe... you'll never find me!", "hs_psst": "Psst! Over here! ...No, not here! Don't look here!",
  "hs_found": "You found me! You're so good at this!", "hs_timeout": "Ha! You couldn't find me. I win!",
  "tag_start": "Okay, try to catch me! Three tags and you win!", "tag_tagged": "Tagged me! Okay, again, catch me!",
  "tag_end": "That was fun! Good game!",
  "simon_start": "Let's play Simon Says! Only do it if Simon says!",
  "sim_good": "Nice moves!", "sim_bad": "Gotcha! Simon didn't say!", "sim_miss": "Too slow!",
  "sim_win": "You win! You're the Simon Says champion!", "sim_lose": "I win this time! Try again!",
  "rps_win": "Ha! I win!", "rps_lose": "Aww, you got me!", "rps_tie": "A tie! Go again!"},
 "mikey": {
  "catch": ["Like and subscribe, okay? Please?", "Don't forget to hit the bell!", "Comment your favorite snack below!",
            "Welcome back, guys!", "Smash the like button for me!", "Subscribe, or JJ eats all your cookies."],
  "hs_start": "Count to twenty! And no peeking, I mean it!",
  "hs_giggle": "Shh... I'm hiding. Hehe.", "hs_psst": "Psst... I can see you. You're getting close.",
  "hs_found": "Aww, you found me already?!", "hs_timeout": "I win! I was hiding so well.",
  "tag_start": "You can't catch me! Nobody can catch me!", "tag_tagged": "Hey! Okay, okay, run again!",
  "tag_end": "Phew, I need a snack break. Good game!",
  "simon_start": "Simon says... we play Simon Says!",
  "sim_good": "Oh, you're good!", "sim_bad": "Ha! Simon didn't say that!", "sim_miss": "Hurry up, hurry up!",
  "sim_win": "You win! How do you do that?", "sim_lose": "I win! Don't be sad.",
  "rps_win": "Yes! I got you!", "rps_lose": "No way! You win.", "rps_tie": "Same thing! Again!"},
}
for _k in ("jj", "mikey"):
    for _cat, _t in _COMMON.items(): LINES[_k][_cat] = _one(_cat, _t)
    for _cat, _t in _PER[_k].items():
        LINES[_k][_cat] = [(f"{_cat}{n}", x, []) for n, x in enumerate(_t)] if isinstance(_t, list) else _one(_cat, _t)
CATS += ["catch", "hs_start", "hs_giggle", "hs_psst", "hs_found", "hs_timeout", "tag_start", "tag_tagged", "tag_end", "simon_start",
         "sim_jump", "sim_crouch", "sim_sprint", "sim_look", "trap_jump", "trap_crouch", "trap_sprint", "trap_look",
         "sim_good", "sim_bad", "sim_miss", "sim_win", "sim_lose", "rps_start", "rps_win", "rps_lose", "rps_tie"]

# ---------- v1.6: chat replies + guiding ----------
_CHAT = {
 "jj": {
  "chat_greet": ["Hey, hey! What's up?", "Hi there! Ready for an adventure?", "Oh hey, it's you! Awesome!"],
  "chat_how": ["I'm doing great! Even better now that you're here.", "Pretty good! Just hanging out and being awesome."],
  "chat_name": ["I'm JJ! Hoodie enthusiast and professional adventurer."],
  "chat_thanks": ["Anytime, friend!", "No problem! That's what friends are for."],
  "chat_love": ["Aww, you're making me blush!", "You're the best! Seriously!"],
  "chat_rude": ["Hey, that's not very nice!", "Ouch. I thought we were friends."],
  "chat_food": ["Food? Now you're talking! Got any bread?", "I'm kind of hungry too. Let's find something to eat."],
  "chat_joke": ["Why did the creeper cross the road? To get to the other ssside!", "What do you call a skeleton who won't work? Lazy bones!",
                "Why don't zombies like fast food? They can't catch it!"],
  "chat_bye": ["See you later! Don't go too far!", "Bye! Come back soon!"],
  "chat_scared": ["Don't be scared. I'm right here with you!", "If anything comes close, I'll punch it. Probably."],
  "chat_help": ["Tap me for a menu, or just tell me to sit, stay, follow, or find diamonds!"],
  "chat_time_day": ["It's daytime! Perfect for exploring."],
  "chat_time_night": ["It's night. Monsters come out, so stay close to me!"],
  "chat_weather_rain": ["It's raining. Good thing I have my hoodie!"],
  "chat_weather_clear": ["The weather's great. Not a cloud in the sky!"],
  "chat_see_none": ["Hmm, nothing special around here right now."],
  "chat_health_low": ["You look hurt! Eat something, quick!"],
  "chat_health_ok": ["You look great! Healthy and ready to go."],
  "chat_where": ["I'm right here, silly!"],
  "chat_tame_no": ["Give me a cookie or a golden apple and we'll be best friends!"],
  "chat_tame_yes": ["We're already best friends, remember?"],
  "chat_games": ["Wanna play? Hide and seek, Simon Says, tag, or rock paper scissors!"],
  "chat_unknown": ["Hmm, I'm not sure about that one.", "Ooh, good question. No idea!", "I don't really get that, but sure!"],
  "find_what": ["Find what? I can look for diamonds, iron, gold, chests, or a village!"],
  "find_start": ["Okay, follow me! I know just where to look.", "Let's go find it! Stay close!"],
  "find_none": ["I can't see any around here. Let's explore a bit and ask me again!"],
  "find_hop": ["This way!", "Keep up!", "Almost there!", "Come on, over here!"],
  "find_arrive": ["Here we are! Look around, it should be close!"],
  "find_stuck": ["I'm stuck. Let's head that way on foot!"],
  "find_cancel": ["Okay, no worries. Never mind!"]},
 "mikey": {
  "chat_greet": ["Oh, hi! I was just thinking about snacks.", "Hey! Good to see you!", "Hi hi hi! What are we doing?"],
  "chat_how": ["I'm okay! A bit hungry. Always a bit hungry.", "Pretty good, as long as nothing explodes."],
  "chat_name": ["I'm Mikey! I like adventures, and snacks, and not exploding."],
  "chat_thanks": ["You're welcome! Friends help friends.", "Sure thing! No problem."],
  "chat_love": ["Aww, thanks! You're a good friend.", "Stop it, you're making me happy!"],
  "chat_rude": ["That wasn't very nice.", "Hey! I have feelings, you know."],
  "chat_food": ["Did somebody say food? Yes please!", "I could definitely eat. Do you have a cookie?"],
  "chat_joke": ["What's a creeper's favorite music? Hiss-hop!", "Why did the skeleton skip the party? He had no body to go with.",
                "Why was the zombie bad at hide and seek? He kept groaning!"],
  "chat_bye": ["Bye! Come back soon, okay?", "See you later! Don't forget me!"],
  "chat_scared": ["It's okay, I'm scared too. We can be scared together.", "Stay behind me. Actually, no, I'll stay behind you."],
  "chat_help": ["Tap me for a menu, or tell me to sit, stay, follow, or find stuff like diamonds!"],
  "chat_time_day": ["It's daytime! Nice and bright, I like it."],
  "chat_time_night": ["It's night. I don't like night. Can we stay close?"],
  "chat_weather_rain": ["It's raining. My hoodie is getting soggy."],
  "chat_weather_clear": ["Beautiful weather! Perfect for a picnic."],
  "chat_see_none": ["I don't see anything interesting right now."],
  "chat_health_low": ["You don't look good! Sit down and eat something."],
  "chat_health_ok": ["You look fine! Great, actually."],
  "chat_where": ["I'm right here! Did you lose me? Did I lose you?"],
  "chat_tame_no": ["Give me a cookie and I'll be your friend forever!"],
  "chat_tame_yes": ["We're already friends. Best friends, I think."],
  "chat_games": ["Games? Yes! Hide and seek, Simon Says, tag, or rock paper scissors!"],
  "chat_unknown": ["Hmm, I don't know about that.", "Good question! I have no clue.", "Uh, sure? I think?"],
  "find_what": ["Find what? Diamonds, iron, gold, chests, or a village?"],
  "find_start": ["Okay, follow me! Don't get lost!", "I know where to look. Stay close!"],
  "find_none": ["I can't find any nearby. Let's explore and ask again."],
  "find_hop": ["Over here!", "Hurry up, hurry up!", "It's just ahead!", "Come on, this way!"],
  "find_arrive": ["We're here! It should be right around here."],
  "find_stuck": ["I'm stuck! Let's walk that way."],
  "find_cancel": ["Okay, okay. We can stop."]},
}
for _k in ("jj", "mikey"):
    for _cat, _t in _CHAT[_k].items():
        LINES[_k][_cat] = [(f"{_cat}{n}", x, []) for n, x in enumerate(_t)]
CATS += list(_CHAT["jj"].keys())

# ---------- v1.7: trapped / rescue / exploring ----------
_V17 = {
 "jj": {
  "trap_together": ["We're trapped! Somebody help us!", "Help! We're stuck and we can't get out!"],
  "trap_alone": ["Help! I'm stuck! Can anybody hear me?", "Hello? I'm trapped over here!"],
  "trap_snow": ["Help! I'm sinking in the snow, it's freezing!"],
  "trap_snow_together": ["Help! We're stuck in the snow, it's so cold!"],
  "trap_explore": ["I went exploring and now I'm stuck! Help!"],
  "trap_hurry": ["We're over this way! Please hurry!"],
  "trap_again": ["Hello? We're still stuck! Please hurry!"],
  "trap_found": ["You found us! Break a block to let us out!"],
  "trap_rescued": ["Thank you for saving us! You're the best!"],
  "explore_start": ["I'm going to go exploring! Back in a bit!", "Time for an adventure! Don't wait up!"],
  "explore_idle": ["Ooh, I wonder what's over there!", "I bet there's treasure out here somewhere."],
  "explore_end": ["That was a great adventure! I wish you'd come along."]},
 "mikey": {
  "trap_together": ["We're trapped, and JJ's here too! Help!", "Help! We can't get out and it's scary!"],
  "trap_alone": ["Help! I'm stuck and nobody's here!", "Hello? Anybody? I'm trapped!"],
  "trap_snow": ["Help! The snow is swallowing me, it's so cold!"],
  "trap_snow_together": ["Help! We're sinking in the snow, and it's freezing!"],
  "trap_explore": ["I shouldn't have gone exploring! Help!"],
  "trap_hurry": ["We're over this way! Hurry, please!"],
  "trap_again": ["Please hurry, it's getting scary!"],
  "trap_found": ["You found us! Break a block and let us out!"],
  "trap_rescued": ["Thank you for saving us! I thought we'd be stuck forever!"],
  "explore_start": ["I'm just going to look around. Maybe find snacks.", "Going exploring! Don't worry about me."],
  "explore_idle": ["Hmm, what's over this hill?", "I hope there's food out here."],
  "explore_end": ["Okay, I'm done exploring. That was tiring."]},
}
for _k in ("jj", "mikey"):
    for _cat, _t in _V17[_k].items():
        LINES[_k][_cat] = [(f"{_cat}{n}", x, []) for n, x in enumerate(_t)]
CATS += list(_V17["jj"].keys())

# ---------- v1.9: other players ----------
_V19 = {
 "jj": {"not_owner": ["Sorry, I'm somebody else's buddy! But I'll play a game with you!"]},
 "mikey": {"not_owner": ["I only do that for my friend. But I'll play a game with you!"]},
}
for _k in ("jj", "mikey"):
    for _cat, _t in _V19[_k].items():
        LINES[_k][_cat] = [(f"{_cat}{n}", x, []) for n, x in enumerate(_t)]
CATS += list(_V19["jj"].keys())

# ---------- v1.11: minecarts ----------
_V111 = {
 "jj": {"mc_in": ["All aboard! Let's ride!"], "mc_none": ["I don't see a minecart around here."],
        "mc_full": ["There's already somebody in that minecart!"], "mc_cant": ["Hmm, I can't get into that minecart. Sorry!"],
        "mc_out": ["Okay, hopping out!"], "mc_ride": ["Wheee, this is awesome!", "Look at me go!"]},
 "mikey": {"mc_in": ["Okay, I'm in! Please don't go too fast."], "mc_none": ["I don't see any minecarts nearby."],
           "mc_full": ["Somebody's already in that one!"], "mc_cant": ["I can't get in that minecart. I tried!"],
           "mc_out": ["Okay, I'm getting out now."], "mc_ride": ["Whoa, whoa, not so fast!", "This is kind of fun!"]},
}
for _k in ("jj", "mikey"):
    for _cat, _t in _V111[_k].items():
        LINES[_k][_cat] = [(f"{_cat}{n}", x, []) for n, x in enumerate(_t)]
CATS += list(_V111["jj"].keys())
