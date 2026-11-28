# /play/ prototype: asset and license register

No paid services, no accounts, no runtime CDNs. Everything below is vendored in this folder. There are no brand names or logos on any model or sign.

| Asset | Source / author | License / use |
|---|---|---|
| `vendor/three.module.min.js` | Three.js 0.170.0, npm `three@0.170.0` (https://threejs.org/) | MIT. Notice: `vendor/THREE-LICENSE.txt` |
| `vendor/GLTFLoader.js`, `vendor/BufferGeometryUtils.js`, `vendor/SkeletonUtils.js` | Three.js 0.170.0 `examples/jsm` from npm `three@0.170.0`. The only change is that the import paths are relative (`./three.module.min.js`), because the page CSP blocks import maps | MIT (same Three.js notice) |
| `vendor/cannon-es.js` | cannon-es 0.20.0, npm `cannon-es@0.20.0` (https://github.com/pmndrs/cannon-es), unmodified `dist/cannon-es.js` | MIT. Notice: `vendor/CANNON-LICENSE.txt` |
| `assets/kenney/cars/*.glb` + `Textures/colormap.png`: `truck`, `truck-flat`, `delivery`, `box`, `cone` | Kenney "Car Kit" 3.1 (https://kenney.nl/assets/car-kit), downloaded Nov 27 2026 | CC0 1.0. `assets/kenney/LICENSE-car-kit.txt` |
| `assets/kenney/chars/*.glb` + texture: `character-raider` (the pirate base), `character-male-d` (Big Earl base) | Kenney "Mini Characters" (https://kenney.nl/assets/mini-characters), downloaded Nov 27 2026 | CC0 1.0. `assets/kenney/LICENSE-mini-characters.txt` |
| `assets/kenney/city/*.glb` + texture: `building-a/c/e/g/k`, `low-detail-building-a/d/g` | Kenney "City Kit (Commercial)" (https://kenney.nl/assets/city-kit-commercial), downloaded Nov 27 2026 | CC0 1.0. `assets/kenney/LICENSE-city-kit-commercial.txt` |
| `assets/kenney/furniture/*.glb` (sofa, TV, lamp, chair, bookcase, dryer, fridge, plant, speaker, coffee table, bench, cardboard boxes) | Kenney "Furniture Kit" (https://kenney.nl/assets/furniture-kit), downloaded Nov 27 2026 | CC0 1.0. `assets/kenney/LICENSE-furniture-kit.txt` |
| Pirate tricorne hat, Big Earl's hat, PAWN signs, board tiles, storage rows, flea stall stages, locker room, die faces | Original procedural meshes and canvas textures in `scene.js` | Original game-owned work |
| Match-3 piece art | Existing Storage Rush art, read-only from `../assets/pieces/*.png`, `../assets/specials/*.png`, `../assets/finds/tarp.png` | Project-owned; not copied or changed |
| UI and item icons | Unicode emoji from the device's system font | No bundled emoji font |
| Sound | Oscillator tones synthesized in `app.js` (Web Audio) | Original; no recordings |
| Shared game logic (Engine, ECON, ITEMS, LEVELS, RHYTHM) | The live Storage Rush game, read-only from `../js/` | Project-owned; unmodified |

Crediting Kenney is optional under CC0, but we credit it here anyway.
