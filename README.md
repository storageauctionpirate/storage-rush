# Storage Rush (test build, v2)

A phone-first, portrait storage-unit matching game prototype for Storage Auction Pirate.

**Play:** https://storageauctionpirate.github.io/storage-rush/

## What's in v2
- **You start with The Pickup:** a beat-up orange pickup with a folding table in the bed. The ladder opens with "You just won your first unit. Bank $0." The ladder goes The Pickup → First Yard → The Apartment → Starter Home → The Warehouse → Own Facilities → Castles & Mansions. Locked rungs show as faded ghosts with a lock.
- **Slower ladder:** each cleared unit hops the pirate one stepping stone. It takes 10 units to reach First Yard. After 3 flips you get Pickup fix-up jobs ($200–$1,200: wash the truck, patch the fender, Pirate sun visor, trailer hitch, sturdier table). Buying one plays a scaffold, hammer and dust build, then shows a polaroid.
- **Cartoon art pass:** thick brown outlines, cel shading, squash and stretch, the bundled Luckiest Guy display font, a pirate-hustler mascot, star-burst particles, tarp rip shards, finds flying to the cart, and coins flying to the bank.
- **Framed board:** the board sits in the unit mouth with a light floor, door tracks, the rolled-up door drum and a tube light. The crate is now a yellow milk crate, and the tire has a bright rim.
- **Specials:** match 4 for a Dolly (clears a row or column), an L or T for Bubble Wrap (3x3 pop), or 5 for the Auction Gavel (clears every item of one kind). Specials combo when swapped together. Blasts chip tarps.
- **12 hand-built units (21 boards) in Pirate's First Yard,** with tutorials: swap, tarps, layers, dummy tarps, Dolly (board 4), Bubble Wrap (board 7), the Scrapper near-miss (board 9) and the Gavel (board 11).
- **Booster dock:** Bolt Cutters (cut one tarp layer), Flashlight (5-second x-ray) and Free Swap. A new save gets 2/1/0. Out of moves offers one free +5 (not on the first 3 units).
- **Flip table:** a dressed sale table. Items slide on, prices pop, SOLD slams, coins fly to the bank and the haul total shows.
- **Daily Auction** (3 boards seeded by local date, a 7-day punch card, a glove-box booster) and **Endless Auction**.
- **Next Yard:** the Yard 2 door with the lock on, a neon-sign find preview and the "Scared money don't make money" sign. The only call to action is **Unlock coming soon.** There are no payments, prices or ads. `?debug=1` shows the flagged store design note (suggested, not for sale).
- A music bed sits under the sound effects, and one toggle mutes both. Saves move from `storageRush.v1` to `storageRush.v2` and keep your bank. "Start over" sits on the title screen and asks you to confirm.

No ads, analytics, accounts or network requests. A Content-Security-Policy blocks all outside connections. The font is served from this site.

## Tech
Plain HTML/CSS/JS with no build step.
- `js/engine.js`: board rules (pure, also runs in Node)
- `js/levels.js`: Yard 1 boards + tutorial lines
- `js/art.js`: cartoon canvas art
- `js/audio.js`: synthesized SFX + music
- `js/game.js`: flow, rendering, juice
- `test/run.js`: headless Puppeteer playthrough (full campaign at 390x844; opening, final unit, Next Yard, daily and endless at 375x667)
- `test/sim.js`: win-rate check for each board (`N=60 node test/sim.js`)

Font: Luckiest Guy by Astigmatic (Apache License 2.0, `fonts/LICENSE.txt`).
