# Storage Rush (test build)

A phone-first storage-unit matching game prototype for Storage Auction Pirate.

**Play:** https://storageauctionpirate.github.io/storage-rush/

## What's in it
- **Title yard:** orange roll-up doors and a fence sign that says "You can't hit a home run unless you swing the bat."
- **Life ladder board:** a winding 3D board-game path with 7 spaces (No Home, Storage Rental, Apartment, Home, Warehouse, Own Facilities, Castles & Mansions). Each cleared unit hops your pirate piece forward, and the next building goes up with scaffolding, dust and hammer sounds. It shows between units.
- **Unit open:** tap the lock, it snaps off, and the orange door rattles up to reveal the board.
- **Match-3 cleanout:** 7x7 board with 6 shaded 3D items (blue tote, cardboard box, wooden crate, red toolbox, paint can, tire). Swipe or tap two neighbors to line up 3 or more. Gravity drops new items in, and chains count.
- **Buried finds:** dusty tarps (some chained and locked, needing 2 or 3 hits) hide a guitar, jewelry box, safe or vintage camera. Match next to a tarp to wear it down. A gold glint marks the tarps with a find under them. Tap an uncovered find to put it on the cart.
- **Scrappers:** leave a find sitting for 3 moves and a red countdown plus a Scrapper's glove show up. At 6 moves the Scrapper snatches it.
- **3 free units:** Unit 12 (Clean Indoor Unit), Unit 27 (Greasy Garage) and Lot 9 (Outdoor Auction Yard). Each has its own lighting and background, a limited number of moves, and a goal of pulling 3 finds.
- **Flip table:** after each unit, the finds and a cart of everything else sell with SOLD stamps, and the cash goes in your bank.
- **Locked door:** after unit 3, a closed orange door with the lock still on sits next to a "Scared money don't make money" sign. Tapping it shows "Unlock coming soon." There are no payments.
- Web Audio sound effects (no audio files), a sound toggle, Home, Replay and Play again. Progress, bank and the sound setting are saved on the device.

No ads, analytics, accounts or network requests. A Content-Security-Policy blocks all outside connections.

## Tech
Plain HTML/CSS/JS with no build step or dependencies. All art is drawn live on canvas with gradients, lighting and bevels.
- `js/art.js`: pieces, finds, scenes, doors, ladder buildings
- `js/audio.js`: synthesized sound effects
- `js/game.js`: game logic
- `test/run.js`: headless Puppeteer playthrough at 390x844 and 375x667 (`python3 -m http.server 8872 --bind 127.0.0.1`, then `NODE_PATH=/workspace/pirate-apps/launch/node_modules node test/run.js`)
