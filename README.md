# Storage Rush (test build, v3 — Sunnyvale)

A phone-first, portrait storage-unit matching game for Storage Auction Pirate.

**Play:** https://storageauctionpirate.github.io/storage-rush/

## What's in v3 (Sunnyvale world)
- **World map:** the Sunnyvale yard art with stepping stones numbered 1–20 in order. The bandana hustler token stands on your next unit, walks a stone after each clear, and dust drifts over the yard. The Desert Gold gate at the top shimmers with a NEXT WORLD lock.
- **20 units** of match-3. Swap pieces, rip tarps, tap finds before the Scrappers grab them. Scrappers show up after the first few units. A swap that makes no match snaps back free.
- **Glossy pieces:** box, green milk crate, tote, red lamp, toy, treasure, plus the Dolly, Bubble Wrap and Gavel specials.
- **Wooden HUD:** unit sign, MOVES ticket, FIND n OF m goals with black silhouettes for buried finds, the hustler portrait, and wooden Cutters / Light / Swap boosters.
- **Safe Cracking bonus:** earned only, it can show up after a cleared unit (never Units 1–2). Three reel dials spin and stop, the door swings open, and game cash pays out. Common steel, Rare teal + brass, Legendary gold (777). Never sold. No real money.
- **Flea market flip:** the hustler behind the table, your finds bounce onto it, then SOLD, coins and an itemized haul receipt.
- **Truck upgrade:** a free milestone after 3 flips plays the beat-up pickup turning into the fixed-up truck. Upgrades on the map shows the Pickup jobs paid with game cash.
- **Desert Gold:** the next world is teased after Unit 20. No store, no prices.
- Saves move to `storageRush.v3` and keep your bank.

No ads, analytics, accounts or network requests. A Content-Security-Policy blocks all outside connections. The font is served from this site.

## Tech
Plain HTML/CSS/JS with no build step.
- `js/engine.js`: board rules (pure, also runs in Node)
- `js/levels.js`: Sunnyvale 20 units, tutorial lines, map path
- `js/images.js`: game art loader (`assets/`)
- `js/art.js`: canvas fallbacks + signs
- `js/audio.js`: synthesized SFX + music
- `js/game.js`: flow, rendering, juice
- `test/run.js`: headless Puppeteer playthrough (full 20-unit campaign at 390x844; opening, safe, flea, truck, final unit, Desert Gold, daily and endless at 375x667). Shots go to `shots/sunnyvale/`.
- `test/snap.js`: phone-size stills of each scene (`node test/snap.js /tmp/out 390x844,375x667`)
- `test/sim.js`: win-rate check for each board (`N=60 node test/sim.js`)

Font: Luckiest Guy by Astigmatic (Apache License 2.0, `fonts/LICENSE.txt`).
