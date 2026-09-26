# CubeClash

CubeClash is a responsive 2×2 / 3×3 speedcubing timer with local solve history, installable PWA support, 3D scramble visualization, and a beta WebRTC peer-to-peer room flow.

## Scrambles
The beta uses cubing.js random-state scramble generation and its TwistyPlayer visualization. The same scramble string is passed to the visualization, so the displayed cube is generated from that exact scramble rather than being a decorative image.

For official WCA competition scrambling, always use the current official WCA scramble program; CubeClash is intended for practice and online play.

## Run

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

For GitHub Pages, upload the project and enable Pages. HTTPS is required for normal WebRTC/PWA behavior.

## PWA
Supported browsers can install CubeClash to the home screen/desktop. iOS Safari can use Share → Add to Home Screen.

## 1v1
The beta's actual match connection uses WebRTC DataChannel. Signaling is manual: Player 1 creates an offer link, Player 2 creates an answer link, and Player 1 applies the answer. Production deployment should add a small signaling service and TURN fallback for difficult NATs while keeping match traffic P2P.


## Multiplayer beta signaling

CubeClash uses WebRTC DataChannel for match traffic. GitHub Pages is static hosting, so the beta still needs a manual signaling exchange: Player 1 creates an offer link, Player 2 opens/pastes it and creates an answer link, then Player 1 pastes the answer link back into the original room. The offer/answer is only signaling data; gameplay traffic is sent peer-to-peer after connection. A production version should add a small signaling service and TURN support for networks where direct WebRTC connectivity fails.

## 3D scramble viewer

The 3D viewer uses `cubing.js` TwistyPlayer. The generated scramble is passed as `experimentalSetupAlg` so the cube is initialized to the exact scrambled state instead of relying on an animation to establish the display. `cubing.js` documents `TwistyPlayer` and its setup-alg parameter for this use case.
