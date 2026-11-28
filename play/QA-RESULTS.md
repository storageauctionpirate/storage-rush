# /play/ Milestone A: QA results (Nov 27–28, 2026, PT)

Script: `test/play-milestone-a.js` (puppeteer-core + system Chrome). Run: `ONLY=390x844 node test/play-milestone-a.js`. Screenshots: `docs/shots/play-milestone-a/`.
Economy sim: `node test/play-econ-sim.mjs 80 60` (real match-3 engine, real items, real money curve).

**Caveat: this box has no GPU.** WebGL runs on SwiftShader (software). FPS is bound by that and is about the same as `/board/` was on this box. The game's own per-frame JS cost is the meaningful number. Real-phone FPS still needs a real phone.

| Check | 390x844 (4x CPU, mobile, DPR 3) | 375x667 (4x CPU, mobile, DPR 3) | 1280x800 |
|---|---|---|---|
| Page errors / console errors / HTTP 4xx | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| CC0 models loaded (pirate, rival, trucks, furniture, buildings) | all (1/1/3/13/16) | all | all |
| Physics die: rolled value = spaces moved | 2 = 2 ✓ (settled 2.6 s, 305 steps, no nudge, not forced) | 2 = 2 ✓ (1.9 s) | 4 = 4 ✓ (3.1 s) |
| Day Off changes nothing (cash, rolls, spins, truck, cap, stall, truck level, locker level, perks, cleans) | ✓ no diff | ✓ | ✓ |
| Pawn lists only pawn items (tinrobot, hammer, radio of a 6-item mixed truck) | ✓ | ✓ | ✓ |
| Flea lists only flea items (mug, teddy, books); pawn items stay in the truck | ✓ | ✓ | ✓ |
| Pawn refuses an all-flea truck ("Not my kind of stuff.") | ✓ | ✓ | ✓ |
| 12-case match: 6 distinct pairs, a true pair wins, slot spin is a prize | ✓ | ✓ | ✓ |
| Lucky slot: landing gives +1 earned spin, 2 spins played, spins left 1 | ✓ | ✓ | ✓ |
| Flea stall upgraded twice (3 visible stages) | ✓ | ✓ | ✓ |
| Truck upgraded twice (pickup → flatbed → box truck), +4 capacity each time (QA truck started at 10, so 10 → 14 → 18) | ✓ | ✓ | ✓ |
| Pacing panel: "skip ahead" adds 1 free roll; timer set to 1 min | ✓ 1 → 2 | ✓ | ✓ |
| Paid locker survives reload (same moves, left, cash) | ✓ | ✓ | ✓ |
| Real-touch cleanout of first locker | cleared, 2 moves to spare | cleared | cleared |
| Big Earl rival + his locker | ✓ | ✓ | ✓ |
| 0 rolls → free Curb Pile shown | ✓ | ✓ | ✓ |
| Only save key written | `storageRush.play.v1` | same | same |
| First 3D frame / load (ms) | 741 / 1621 | 935 / 1837 | 470 / 1839 |
| Board idle FPS avg / 1% low | 19.8 / 9.8 | 22.5 / 7.5 | 5.0 / 2.6 |
| Match-3 FPS avg / 1% low | 21.9 / 6.7 | 23.3 / 5.5 | 4.8 / 2.6 |
| Frame JS median / p99 (ms) | 4.1 / 29.5 | 4.7 / 22.5 | 1.7 / 26.4 |
| Tap → next frame median / p95 (ms) | 118 / 172 | 113 / 197 | 106 / 202 |
| JS heap (MB) | 30 | 31 | 29 |

Heap is about 30 MB, up from about 11 MB on `/board/`, because of the GLB models.

## Economy (test/play-econ-sim.mjs, 80 sessions, average player, refill 0.5 roll per turn)

Cash is measured in "lockers' worth": cash divided by the current locker price.

| | Old /board/ numbers | /play/ Milestone A |
|---|---|---|
| Cash at turn 30, median / p90 | 19.3 / 36.3 | 4.3 / 7.7 |
| Cash at turn 60, median / p90 | 26.1 / 52.8 | 4.3 / 9.0 |
| First upgrade (median turn) | 22 | 5 |
| Upgrades bought by turn 60 (median, of 4) | 2 | 3 (all 4 by turn 120 in 35% of sessions) |

The tuning lowered Payday, salvage, item value (`itemK` 0.3, play page only), case and slot prizes. Upgrades now cost 4×/8× (stall) and 5×/9× (truck) of the locker price instead of 20–55×. All the knobs are in one `PE` object at the top of `play/app.js`, mirrored in the sim.
