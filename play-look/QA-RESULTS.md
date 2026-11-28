# /play-look/ — Checkpoint 1 QA (Nov 28, 2026)

Scope: steps 1 (original UI kit), 2 (golden-hour relight, no teal) + the restored painted title screen. **No gameplay, economy, difficulty or progression change.** `app.js` diff vs `/play/` is only: save key `storageRush.playlook.v1`, title overlay hook (`titleOn` class), grid board colours, a font-load wait, and the "LOCKER EMPTY!" font. `clearout.js`, `dice.js`, `models.js`, `PE` economy and `../js/*` are byte-identical to `/play/`.

QA script: `test/play-look-qa.js` (the same checks as `/play/` Milestone A, pointed at `/play-look/`). Raw results: `docs/shots/play-look-checkpoint1/qa/qa-*.json`.

| Check | 390x844 (4x CPU, mobile, DPR 3) | 375x667 (4x CPU, mobile, DPR 3) | 1280x800 |
|---|---|---|---|
| Console errors / HTTP 4xx | 0 / 0 | 0 / 0 | 0 / 0 |
| Paid locker survives reload | ✓ | ✓ | ✓ |
| Only save key written | `storageRush.playlook.v1` | same | same |
| First 3D frame (ms) | 614 | 994 | 702 |
| Board idle FPS avg (software GL, no GPU) | 16.6 | 19.8 | 6.1 |
| Session FPS avg | 17.9 | 23.8 | 5.8 |
| JS heap (MB) | 30 | 31 | 34 |

Caveat: no GPU on this box (SwiftShader). `/play/` measured 19.8 / 22.5 / 5.0 idle on the same box; play-look is a little lower on phones because of the ~12 palms and ~10 flower bushes added. Per-frame JS cost is the same (cpu median 2.6–6 ms). Real-phone FPS still needs a real phone.

Visual-only fix found: the road ribbon in `/play/` was single-sided and culled from above (invisible). In play-look it renders double-sided, so the tan winding road is now visible on the green lot.
