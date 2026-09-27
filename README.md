# CubeClash

CubeClash is a browser-based speedcubing timer made for practicing 2×2 and 3×3 solves and playing simple 1v1 matches with another player.

## What it can do

- 2×2 and 3×3 speedcubing timer
- Scrambles generated directly in the browser
- 3D scramble visualization for solo solving
- Local solve history and statistics
- Custom inspection time
- Dark and white themes
- Player display name for 1v1 matches
- 1v1 rooms using a short room code
- Live opponent timer during a match
- Camera and microphone support for players
- Connection quality indicator
- Microphone mute/unmute
- Multiple rounds with round results and scores
- +2 and DNF options
- Installable as a PWA on supported devices
- JSON export and import for solve data

## What it is for

CubeClash is designed for speedcubers who want a simple timer for solo practice and a lightweight way to race a friend online. The multiplayer mode lets two players join the same room, see each other, follow the same scramble, and compare their solve results round by round.

CubeClash is still a beta project, so some features may change as it continues to be improved.

## Running it

CubeClash is a static web app, so it can be hosted on GitHub Pages or another static website host.

For normal camera, microphone, PWA, and WebRTC features, use an HTTPS site such as GitHub Pages.

## Creator

Created and developed by **Sid Anajao**.


## v41 changes
- Prevented Space/Enter from scrolling the solo page, including repeated keydown events while holding Space.
- Added DELETE button beside each recent solo solve.
- Deleting a solve removes it from IndexedDB and refreshes solo statistics/history.

## v48 changes
- Fixed the cube turn engine mutating live cubies while iterating, which could rotate a cubie more than once during a single move.
- Corrected standard face-turn directions for F and B while preserving the standard R/L/U/D conventions.
- `2` turns now apply exactly two quarter-turns to the same affected layer.
- Added internal cube-state validation and standard corner-cycle audits.
- 3D and 2D scramble views continue to derive from the same cube state.
