# Board prototype — QA results (Nov 22, 2026, PT)

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
