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
