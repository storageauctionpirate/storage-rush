# Storage Rush (test build, v3 — Sunnyvale)

A phone-first, portrait storage-unit matching game for Storage Auction Pirate.

**Play:** https://storageauctionpirate.github.io/storage-rush/

## What's in v3 (Sunnyvale world)
- **World map:** the Sunnyvale yard art with 10 stepping stones in order, each showing its locker bid. The bandana hustler token stands on your next unit, walks a stone after each clear, and dust drifts over the yard. The Desert Gold gate at the top shimmers with a NEXT WORLD lock.
- **The $1 auction hook (first launch only, about 18 s, Skip any time):** the auctioneer sells an abandoned locker for ONE DOLLAR, the door rolls up on dusty boxes and a half-buried safe, a flash tease, then a WHAT'S INSIDE? freeze and straight into Unit 1. The safe pays off in Unit 1 (a $40 Tin Robot).
- **10 units** in World 1, a mini arc (the $1 locker, learn layers, a lockbox surprise, Scrappers, a harder back row, then THE BIG ONE). Units are match-3. Swap pieces, rip tarps, tap finds before the Scrappers grab them. Scrappers show up after the first few units. A swap that makes no match snaps back free.
- **Glossy pieces:** box, green milk crate, tote, red lamp, toy, treasure, plus the Dolly, Bubble Wrap and Gavel specials.
- **Wooden HUD:** unit sign, MOVES ticket, FIND n OF m goals with black silhouettes for buried finds, the hustler portrait, and wooden Cutters / Light / Swap boosters.
- **Safe Cracking bonus:** earned only, it can show up after a cleared unit (Unit 1's old safe is the hook payoff; the random ones start at Unit 3). Three reel dials spin and stop, the door swings open, and game cash pays out. Common steel, Rare teal + brass, Legendary gold (777). Never sold. No real money.
- **Flea market flip:** the hustler behind the table, your finds bounce onto it, then SOLD, coins and an itemized haul receipt.
- **Truck upgrade:** a free milestone after 3 flips plays the beat-up pickup turning into the fixed-up truck. Upgrades on the map shows the Pickup jobs paid with game cash.
- **Desert Gold:** the next world is teased after Unit 10. No store, no prices.
- **Locker bids:** each unit's locker is paid once, out of that unit's haul, when you clear it. Failing and retrying never costs anything.
- Saves stay on `storageRush.v3`; older saves are rescaled to the new money (bank ÷ 50) and capped to the 10-unit world.

No ads, analytics, accounts or network requests. A Content-Security-Policy blocks all outside connections. The font is served from this site.

## Tech
Plain HTML/CSS/JS with no build step.
- `js/engine.js`: board rules (pure, also runs in Node)
- `js/economy.js`: the money curve (lockers $1 at L1, about 10x every 20 levels to L100, then a soft cap; $99M at L500), payouts, money format
- `js/items.js`: the item ladder (114 items, 7 tiers to L500, rarity, 15 collections)
- `js/build-costs.js`: Sunnyvale build list ($267 total)
- `js/levels.js`: Sunnyvale 10 units (built from the 20 source boards), tutorial lines, map path
- `js/images.js`: game art loader (`assets/`)
- `js/art.js`: canvas fallbacks + signs
- `js/audio.js`: synthesized SFX + music
- `js/game.js`: flow, rendering, juice
- `test/run.js`: headless Puppeteer playthrough (full 10-unit campaign at 390x844 and 375x667; opening, safe, flea, truck, final unit, Desert Gold, daily and endless at 375x667). Shots go to `shots/sunnyvale/`.
- `test/snap.js`: phone-size stills of each scene (`node test/snap.js /tmp/out 390x844,375x667`)
- `test/sim.js`: win-rate check for each board (`N=60 node test/sim.js`)
- `test/econ.js`: World 1 money sim plus the L1–500 locker curve and per-world free-finish table
- `test/group-version-nov22.js`: hook, $1 locker, Unit 1 safe payoff, bid-once, item ladder and finale checks (shots in `docs/shots/group-version-nov22/`)

Font: Luckiest Guy by Astigmatic (Apache License 2.0, `fonts/LICENSE.txt`).
