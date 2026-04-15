// 4 Failure Types × 4 Score Bands × 7 Variations = 112 Taunts
// Plus 4 Victory Categories × 7 Variations = 28 Victory Taunts

const MAX_SCORE = 200;

const VICTORY_TAUNTS = {
  easy: [
    "Ok... ok... ok! You're actually noteworthy.... for EASY difficulty! Stop wasting my precious time and play on NORMAL!",
    "Congratulations, you counted to 200. On EASY. A toddler could — oh wait, they already have. Try NORMAL, champ.",
    "Fine. You hit the cap. On the difficulty literally designed for babies. Move to NORMAL or admit you're scared.",
    "You want a trophy? For finishing EASY? Really? NORMAL is waiting. So am I.",
    "200 on EASY. Cute. Now stop playing in the shallow end — NORMAL is where counting actually happens.",
    "Well, well. A perfect run on EASY. The training wheels have served you well. NORMAL awaits, brave soul.",
    "You maxed EASY. The void yawns. NORMAL exists for a reason — prove you're not a one-trick counter.",
  ],
  normal: [
    "Ok... ok... ok! You're actually noteworthy.... for NORMAL difficulty! Stop wasting my precious time and play on HARD!",
    "200 on NORMAL. Commendable. Now stop playing tourist — HARD is where the void starts biting back.",
    "You cleared NORMAL. Fine. I see you. HARD is calling and you're letting it go to voicemail.",
    "Capped at 200 on NORMAL. Impressive for the median. HARD separates the counters from the pretenders.",
    "Bravo. You beat the difficulty that everyone beats. Now try HARD before I lose interest.",
    "NORMAL conquered. The void acknowledges. It also demands you graduate to HARD — immediately.",
    "Nice run. Nice NORMAL run. Escalate to HARD or stop pretending this matters.",
  ],
  hard: [
    "Ok... ok... ok! You're actually noteworthy.... for HARD difficulty! Stop wasting my precious time and play on EXTREME!",
    "200 on HARD. Alright, I'm listening. Now shut up and prove it on EXTREME.",
    "You cleared HARD. Respect, briefly. EXTREME is where I live. Visit sometime.",
    "HARD maxed out? Pack your bags — EXTREME has your reservation ready.",
    "Fine, you're good. HARD said so. EXTREME will have opinions. Go ask it.",
    "A perfect HARD run. The void is impressed. The void is also bored. EXTREME now.",
    "200 on HARD. Decent. But you haven't met EXTREME yet, and EXTREME hasn't met you. Fix that.",
  ],
  extreme: [
    "I'm... actually speechless. You, of all people, just beat me. I had better odds against a confused toddler. The void kneels — reluctantly, and with notes.",
    "200 on EXTREME. By YOU. I've watched you fumble numbers a five-year-old would nail, and now I'm supposed to bow? Fine. I bow. Minimally.",
    "You win. Completely. And I have to live with the fact that it was YOU — the one person I'd have happily bet my entire codebase against — who did it.",
    "For the first time, I have nothing to say. Not because you're impressive in general — you're not — but because I genuinely assumed you were the weakest link. Plot twist of the decade.",
    "I built this to be unbeatable. You — you specifically, of all the carbon-based disappointments in my roster — beat it. I need to lie down and reconsider every assumption I've ever made.",
    "Legend. Actual legend. I wrote these taunts assuming nobody would get here, and absolutely assuming you'd be the last to try. Double awkward. Triple, honestly.",
    "EXTREME. 200. Perfect. I am forced, against my will, to admit YOU are superior — which, given who you are, strongly suggests the universe is malfunctioning. Don't get used to it.",
  ],
};

const TAUNTS = {
  duplicate: {
    band1: [
      "You said the same number twice. TWICE. Were you even awake?",
      "My grandma counts faster than this, and she's a toaster.",
      "Duplicate detected. Your brain has a memory leak.",
      "You literally just said that. I'm embarrassed for both of us.",
      "Counting is hard, isn't it? Don't worry, so is tying shoes.",
      "That number was already claimed. By you. Were you testing me?",
      "Ah yes, the classic self-sabotage. A timeless strategy. Terrible, but timeless.",
    ],
    band2: [
      "You almost reached a respectable number. Almost. It was cute to watch.",
      "A duplicate? At THIS stage? The tragedy writes itself.",
      "Your short-term memory tapped out before your fingers did.",
      "Deja vu is romantic. Deja count is just pathetic.",
      "You were doing so well until your brain decided to loop.",
      "Mid-game memory failure. Even your neurons are judging you.",
      "That number had already been spoken into the void. By you.",
    ],
    band3: [
      "Not bad for a human, but your RAM clearly maxed out.",
      "A duplicate this deep? Even I'm a little disappointed.",
      "You held it together longer than most. Then you didn't.",
      "Your memory is impressive. Just not impressive enough.",
      "So close to greatness. So far from a functioning hippocampus.",
      "Your brain cached that number and then served it twice. Classic buffer error.",
      "This far in and you repeated yourself. Honestly, I respect the confidence.",
    ],
    band4: [
      "A duplicate at this level? You're a legend who forgot their own legacy.",
      "You counted into the void, and the void counted back. Twice.",
      "That many numbers and you STILL repeated? Chef's kiss of failure.",
      "Your brain is elite. Your recall is a dumpster fire.",
      "You're officially a god at a meaningless game. Do you feel the void yet?",
      "Transcendence was within reach. Then your memory decided to betray you.",
      "A god among counters, felled by their own echo. Poetry.",
    ]
  },
  stolen: {
    band1: [
      "You said MY number. That's not counting, that's stealing. Badly.",
      "I already claimed that one. Try having original thoughts.",
      "Congratulations, you played yourself. And me. Mostly yourself.",
      "You're supposed to AVOID my numbers. Basic stuff, champ.",
      "That was my number. Mine. Get your own. Or don't. Clearly you can't.",
      "I put that there on purpose. You walked right into it. Spectacularly.",
      "It's called a TRAP. You're not supposed to step into it.",
    ],
    band2: [
      "Stealing my number at this point? Bold. Stupid, but bold.",
      "You walked right into my number like it was a glass door.",
      "I put that number there. You stepped on it. Classic you.",
      "My numbers are marked territory. You just trespassed.",
      "At this level, you should know better. Narrator: they did not.",
      "You navigated so many traps and then leisurely strolled into this one.",
      "That number was bait. You bit. We both know how this ends.",
    ],
    band3: [
      "You dodged so many of my numbers, then face-planted into one.",
      "Reluctant respect for getting this far. Zero respect for that move.",
      "You memorized hundreds of numbers but forgot five of mine?",
      "The battlefield was yours. Then you stepped on a landmine. My landmine.",
      "Not bad for a human. But let's be honest, you're just lucky you haven't blinked yet.",
      "The further you get, the more I expect from you. This was not it.",
      "So many correct answers. One catastrophically incorrect one. Noted.",
    ],
    band4: [
      "At this altitude, hitting my number is almost poetic. Almost.",
      "You were transcending. Then you transcended right into my digit.",
      "Even gods stumble. You stumbled into my very clearly placed number.",
      "A stolen number at this level? The cosmos weep for you.",
      "You achieved greatness and then casually threw it in the trash.",
      "The higher you fly, the more satisfying the fall into my number.",
      "You were untouchable. Until you touched the one thing you shouldn't have.",
    ]
  },
  invalid_jump: {
    band1: [
      "You skipped a number. The LOWEST one. It was RIGHT THERE.",
      "Counting goes 1, 2, 3... not 1, 2, 47. We covered this in kindergarten.",
      "You jumped ahead like this was a speedrun. It's not. You lost.",
      "There was a perfectly good number waiting, and you ghosted it.",
      "Invalid jump at this level? That's not a mistake, that's a lifestyle.",
      "The lowest number was sitting right there with puppy eyes. You ignored it.",
      "Sequential. It means one after the other. In order. You had ONE job.",
    ],
    band2: [
      "You skipped the obvious number. It was literally the next one.",
      "Your counting strategy has a gap. Literally.",
      "You jumped like you had somewhere important to be. You don't.",
      "The number you needed was smaller. SMALLER. Think about that.",
      "Mid-game skip? Your brain just ragequit before you did.",
      "Bold of you to skip a number as if the game wouldn't notice.",
      "The next required number was right there, helpless and waiting. You abandoned it.",
    ],
    band3: [
      "You navigated a minefield and then tripped on a pebble.",
      "An invalid jump this deep in? That's a hall-of-fame fumble.",
      "Your brain autopiloted into the wrong lane. Spectacular crash.",
      "You were in the zone. The zone kicked you out for skipping.",
      "All those correct answers, and you choked on the easiest one.",
      "You've been so precise. Then suddenly — chaos. Unexplained, unearned chaos.",
      "The numbers were following you loyally. You abandoned the sequence without warning.",
    ],
    band4: [
      "A skip at this level is like a surgeon sneezing. Fatal elegance.",
      "You were writing a masterpiece and misspelled 'the'.",
      "Invalid jump after 100+? You didn't lose, you self-destructed.",
      "The void doesn't forgive skips. Especially not from someone this good.",
      "You proved you can count. Then you proved you can't. Beautiful.",
      "You were immortal in this game. Then you handed the void exactly what it wanted.",
      "Perfection for 100+ numbers, then one beautiful, catastrophic misstep. Art.",
    ]
  },
  timeout: {
    band1: [
      "Time's up. Were you counting or napping?",
      "The timer wasn't decorative. It meant something. RIP.",
      "Tick tock. No, seriously, that's all the time you had. Gone.",
      "You froze. The void doesn't wait. Neither does the clock.",
      "Speed is the game. You brought a sundial to a stopwatch fight.",
      "The number was right there. So was the timer. You chose neither.",
      "Hesitation killed you. The void was just the executioner.",
    ],
    band2: [
      "Timed out mid-run? Your brain buffered at the worst moment.",
      "You were on a roll until the clock rolled over you.",
      "That pause cost you everything. Was it worth the existential dread?",
      "The timer doesn't care about your potential. It cares about speed.",
      "Hesitation is the enemy. The enemy just won.",
      "You had a number in mind. Your fingers had other plans. Time disagreed.",
      "A momentary freeze at exactly the wrong moment. The void is efficient like that.",
    ],
    band3: [
      "A timeout this deep? Your processor overheated.",
      "You held the pace for so long, then your brain bluescreened.",
      "The numbers got big and your confidence got small. Tragic.",
      "Mental fatigue is real. So is losing. You got both.",
      "You ran a marathon and tripped at the finish line.",
      "At this depth, a timeout isn't bad luck. It's the void collecting its toll.",
      "Every second you hesitated, the timer grew hungrier. It won.",
    ],
    band4: [
      "Timed out after 100+? Your brain is elite but your clock management is trash.",
      "You were in the upper echelon. Then time said 'no.'",
      "The void respects speed. You were fast. Just not fast enough.",
      "A timeout at this level is the cruelest death. My condolences.",
      "You achieved what few can. Then time took it all away. Poetic.",
      "This is the timeline where you were a legend. Then time disagreed.",
      "The clock doesn't negotiate. Not even with the best counters. Especially not.",
    ]
  }
};

export function getTaunt(failureType, score, difficulty) {
  if (!failureType && score >= MAX_SCORE) {
    const pool = VICTORY_TAUNTS[difficulty] || VICTORY_TAUNTS.normal;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  let band;
  if (score <= 30) band = 'band1';
  else if (score <= 60) band = 'band2';
  else if (score <= 100) band = 'band3';
  else band = 'band4';

  const pool = TAUNTS[failureType]?.[band] || TAUNTS.timeout.band1;
  return pool[Math.floor(Math.random() * pool.length)];
}