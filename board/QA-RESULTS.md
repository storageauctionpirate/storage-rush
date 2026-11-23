# Board prototype — QA results (Nov 22, 2026, PT)

## Re-run 10:40 PM PT after Mike's 10:25 PM change: no-refill clear-out
Matched items now leave for good; nothing refills. The grid starts as sets of 3 (48 objects: 45 items + tarps) with 18 moves. If no move exists, a free shove packs the leftovers together. Stragglers that can't make a set get hauled out automatically. An empty grid is a cleared locker and earns the roll, with a "LOCKER EMPTY!" celebration. The 3D locker empties in step: progress = 1 − objects left / starting objects. Simulation: 300/300 grids cleared by a random-move player, in 12–14 moves.
In QA the first locker was cleared by real taps at all 3 sizes, with 7 moves to spare and 4 free shoves.

| Size | First 3D frame ms | Load ms | Board FPS avg/1% | Match-3 FPS avg/1% | Frame JS median/p99 ms | Tap→frame median/p95 ms | Heap MB |
|---|---|---|---|---|---|---|---|
| 390x844 (4× CPU) | 951 | 1907 | 23.4 / 10.1 | 23.0 / 6.3 | 2.1 / 19.1 | 91 / 150 | 12.6 |
| 375x667 (4× CPU) | 606 | 1450 | 30.1 / 13.9 | 29.4 / 7.0 | 2.1 / 13.9 | 84 / 159 | 12.9 |
| 1280x800 | 667 | 1819 | 7.8 / 4.1 | 6.9 / 2.7 | 1.3 / 19.3 | 105 / 274 | 10.8 |
0 errors, 0 failed requests; only the `storageRush.board.v1` key is used. Same software-GL caveat as below.

## First run (with refill, superseded)

Script: `test/board-proto.js` (puppeteer-core, headless Chrome). It plays the real loop on each size: intro → $1 locker → 10 real match-3 moves by touch/mouse → locker unloaded (earned rolls) → roll + hop → Pawn (offer, push) → Flea (sell best) → Upgrade ×2 (building transforms twice) → 12-case match → Big Earl rival (raise until he folds) → his locker → Curb Pile at 0 rolls. Debug helpers only finish a cleanout early and jump to a space; every screen is the real one.

Phones: mobile emulation, touch, DPR 3, **CDP CPU throttle 4×**. Desktop: no throttle, DPR 1.

**Important caveat: this box has no GPU.** WebGL runs on SwiftShader (software rasterizing on the CPU). FPS and tap→frame numbers below are bound by that software renderer, not by the game. The game's own per-frame JavaScript cost (`cpu` column) is the meaningful number: about 2–4 ms median even with 4× CPU throttle, so real phones with a GPU should be far smoother. Real-device FPS still has to be measured on an actual phone.

| Size | Throttle | First 3D frame (ms) | Load event (ms) | Board idle FPS avg / 1% low | Match-3 play FPS avg / 1% low | Frame JS cost median / p99 (ms) | Tap → next frame median / p95 (ms) | JS heap (MB) | Draw calls (start → after adaptive low) | Quality picked |
|---|---|---|---|---|---|---|---|---|---|---|
| 390x844 | 4× CPU, mobile, DPR 3 | 731 | 1773 | 19.1 / 5.1 | 17.3 / 3.9 | 2.6 / 16.4 | 124 / 218 | 11.4 | 170 → 95 | low (auto) |
| 375x667 | 4× CPU, mobile, DPR 3 | 776 | 1814 | 22.5 / 7.9 | 21.0 / 5.5 | 2.7 / 17.9 | 104 / 210 | 12.4 | 178 → 97 | low (auto) |
| 1280x800 | none, DPR 1 | 757 | 2394 | 6.4 / 2.4 | 5.7 / 1.9 | 1.2 / 20.3 | 112 / 275 | 10.3 | 219 → 62 | low (auto) |

Desktop is slowest here only because it pushes the most pixels through the software renderer.

Other checks, all 3 sizes:
- 0 page errors, 0 console errors, 0 failed requests (favicon fixed).
- Only localStorage key written: `storageRush.board.v1`. The live game's `storageRush.v3` is never read or written.
- Big Earl folded on raises; Pawn push worked (accepted or dropped, item never lost); flea stall reached stage 2 ("Pirate Flea"); Curb Pile shown at 0 rolls.
- Adaptive quality: after 2 s, if frames average over 25 ms, it drops to pixel ratio 1 with no shadows. Shadow maps update every 3rd frame. `?q=high` forces full quality, `?q=low` forces low.

Screenshots: `docs/shots/board-proto-nov22/` (all 18 steps at 390x844; key steps at 375x667 and 1280x800; the rest moved to `/workspace/storage-rush/board-shots-archive-nov22/`).

## Existing suite (live game unchanged)
Re-run 9:35–9:58 PM PT Nov 22. Main-game files (`js/`, `index.html`, `assets/`) are byte-identical to base d91e97e.
- `test/run.js`: 390x844 **143/143**, 375x667 **142/142**, 1280x800 **51/51** (logs in `test/last-run-*.txt`).
- `test/group-version-nov22.js`: 85/86 on the first run. The one failure was a 390x844 timing check ("hook ends on its own"). A re-run at 390x844 passed **36/36**, so it was a timing flake while the machine was busy, not a regression.

Live-game suite re-run 10:54 PM PT, after the no-refill change: 390x844 141/141, 375x667 141/141, 1280x800 51/51. The test count varies with random bonus safes. Game files are identical to d91e97e.
