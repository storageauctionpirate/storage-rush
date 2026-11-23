# Board prototype — asset and license register

No paid services, accounts, external runtime CDNs or downloaded character packs.

| Asset | Source / author | License / use |
|---|---|---|
| `vendor/three.module.min.js` | Three.js 0.170.0, npm `three@0.170.0` (https://threejs.org/), downloaded Nov 22 2026 | MIT. Full notice: `vendor/THREE-LICENSE.txt` |
| All 3D scenery, buildings, winding road, props, pirate, Big Earl, truck, dice, case models and animations | Original procedural meshes written for this prototype in `scene.js` | Original game-owned work; no third-party model assets |
| All board signage textures | Canvas-drawn text and shapes, `scene.js` | Original game-owned work; browser sans-serif fonts |
| Board UI and puzzle icons | CSS shapes and Unicode emoji from the device's system font | No bundled emoji font or artwork; appearance varies by device |
| Sound | Synthesized oscillator tones generated in `app.js` using Web Audio | Original; no audio recordings or third-party samples |
| Shared game logic (Engine, ECON, ITEMS, LEVELS, RHYTHM) | Existing Storage Rush game, loaded read-only from `../js/` | Existing project-owned code; unmodified |

Art direction: warm ochre dust and coral roof colors, deep teal workwear, brass trim, cream signage, purple rival. The pirate is a bespoke mesh assembled from primitives (broad hat, skull motif, beard, long coat, boots), not a stock model. This is a stylized 3D blockout, not a finished premium character model.
