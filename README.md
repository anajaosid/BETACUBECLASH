# CubeClash

CubeClash is a responsive 2×2 / 3×3 speedcubing timer with local solve history, installable PWA support, 3D scramble visualization, and browser-to-browser 1v1 rooms.

## Scrambles

The beta generates practice scrambles locally. The 3D visualization uses the exact same scramble string to build the displayed cube state.

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

The multiplayer beta now uses PeerJS as the signaling/brokering layer and WebRTC for the actual peer connection. Player 1 clicks **CREATE ROOM** and receives a short room code. Player 2 enters that code and clicks **JOIN ROOM**. No offer/answer copy-and-paste is required.

After both browsers connect, CubeClash shows a camera permission dialog. Video is sent peer-to-peer through WebRTC after permission is granted. Microphone access is not requested.

PeerJS provides the signaling service needed to discover the other browser; the application match data and camera stream use the peer connection. A TURN service may still be needed on some restrictive networks.

## 3D scramble viewer

The v6 local 3D cube renderer is intentionally retained. It does not depend on the TwistyPlayer CDN and builds the visible cube from the generated scramble state.

## Reset after an update

Open **Settings → Export + Wipe App Data** when an update appears stuck on an older cached version. CubeClash downloads a JSON backup of the local solve history first, then clears IndexedDB, local settings, Cache Storage, and the service worker before reloading.

## Multiplayer single-page match

After a host creates a room or a guest joins, CubeClash opens a separate same-origin match tab. The main CubeClash tab owns the PeerJS/WebRTC connection and camera streams; the match tab mirrors the local and opponent video, scramble, and match state. If the browser blocks the new tab, use **OPEN MATCH WINDOW** from the room status before entering the match.
