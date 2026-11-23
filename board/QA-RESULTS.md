# Board prototype — QA results (Nov 22, 2026, PT)

## Round 3, ~1:30 AM PT Nov 23: playtest fixes (3 reviewers, each 6/10)
1. **Moves now come from one place:** `LOCKER_TIERS` in `board/clearout.js`, which throws an error if a locker has no move count. The old LEVELS counts (28 and so on) no longer reach the board. Tiers:
   - **Starter:** 5 types, 14 moves. First $1 locker and the Curb Pile.
   - **Normal:** 6 types, 14 moves. Locker levels 2–4.
   - **Tough:** 5 types, 13 moves. Level 5 and up.
   - Big lockers and Big Earl's lockers count one tier higher.
2. **You can now fail.** Out of moves with pieces left means the locker is not cleared. Choose "Keep what you got" (your finds + half salvage, **no roll**) or "Retry free" (fresh layout; the bid is never charged again). A warning shows at 5 and 3 moves left (red pulsing badge + tip).
3. **Simulated players** (`node test/board-sim.js 500`, 500 grids per tier). "Average" = best move half the time, a random legal move the other half.

| Tier | Random player clear | Average clear | Skilled clear | Average: moves left when cleared | Average: share finishing with 0–3 left |
|---|---|---|---|---|---|
| Starter (5 types / 14) | 88% | 90% | 96% | 0:42 1:148 2:141 3:80 4:27 5:10 6:2 | 91% |
| Normal (6 / 14) | 76% | 84% | 89% | 0:79 1:194 2:105 3:27 4:11 5:2 | 97% |
| Tough (5 / 13) | 58% | 73% | 84% | 0:103 1:134 2:85 3:32 4:11 5:1 | 97% |

A failed attempt leaves about 3–5 pieces. Starter is kept a bit easier on purpose, since it is the first locker.

4. **Paid locker survives a reload:** the grid, moves, finds and salvage are saved in `storageRush.board.v1` after every move. QA made a move, reloaded and came back to the same locker (13 moves, 45 left, cash unchanged) at all 3 sizes.
5. **Full truck:** a find is reported as "truck full: sold at curb price +$X", both in the on-grid message and in the summary. QA filled the truck to 6/6: "Tin Robot … truck full: sold at curb price +$5".
6. **Case Match:** six different prizes (🪙 $, 💵 $, 💰 $, item, 🎲 +1 roll, ⭐ +1 move), each showing its icon plus a label. Matching uses that same icon and label, so cases that look alike always match. QA confirmed exactly 2 of each and that a real pair matches.
7. **Shove and haul are explained** the first time each happens (one line in the grid tip + a message).
   - **Locker perks, earned only:**
     - Day Off: +2 moves on the next locker.
     - Truck upgrade: +1 move in every locker, per level.
     - Case Match ⭐: +1 move on the next locker.
     - Rested-crew moves cap at +3.
     - Flea stall level 1 and up: regulars tell you which finds are under the tarps, and the tarps show a faint icon.
   - Still exactly 1 roll per fully cleared locker. The old fast-clear bonus roll was removed.
   - QA: after Day Off, Big Earl's Tough locker showed "15 moves (+2 rested crew)", or 16 with the ⭐.

| Size | First 3D frame ms | Load ms | Board FPS avg/1% | Match-3 FPS avg/1% | Frame JS median/p99 ms | Tap→frame median/p95 ms | Heap MB | First locker |
|---|---|---|---|---|---|---|---|---|
| 390x844 (4× CPU) | 717 | 1619 | 23.6 / 7.2 | 21.1 / 5.7 | 2.7 / 23.6 | 123 / 210 | 16.7 | cleared by taps, 2 moves to spare |
| 375x667 (4× CPU) | 648 | 1485 | 28.4 / 9.3 | 28.4 / 9.2 | 2.3 / 14.7 | 79 / 153 | 17.5 | cleared by taps, 2 to spare |
| 1280x800 | 714 | 1727 | 6.6 / 3.6 | 6.6 / 2.8 | 1.5 / 16.0 | 123 / 265 | 17.4 | cleared by taps, 2 to spare |

0 errors and 0 failed requests; only `storageRush.board.v1` is used. Same no-GPU caveat as below: this box draws 3D in software.


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

Round 3 follow-up: a saved paid locker that reloads with 0 moves now opens the out-of-moves choice instead of hanging. `board/qa-round3.cjs` checks: exact resume, an exhausted locker resumes as a failure, retry is free and resets moves, keep gives finds + half salvage with no roll. All pass.
