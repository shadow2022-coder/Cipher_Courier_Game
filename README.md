
# Cipher Courier — Prototype

A lightweight, browser-first endless runner with cryptography-flavored progression and optional Sudoku-style lock-puzzles designed to run smoothly on low-end Linux laptops with minimal assets and no frameworks.

### Overview

Cipher Courier blends quick-run arcade traversal with shard collection, relay banking, and between-run upgrades, plus compact 4×4 lock-puzzles for permanent bonuses using a simple validation engine.[4]
Persistence is handled entirely client-side using the Web Storage API (localStorage), so progress survives refreshes and offline sessions in typical browser configurations.[3][4]

### Quick start (local)

- Option 1: Open index.html directly in a modern browser for a zero-setup preview suitable for quick iteration on low-spec machines.
- Option 2: Serve the folder with any lightweight static server (Python/Node/PHP) and open the local address shown by the server for consistent asset and storage behavior across browsers.[4]

Example (Python 3):
```bash
cd cipher-courier
python3 -m http.server 8000
# open the local server address in the browser
```

### Controls

- Jump: Space or Up Arrow or Click.
- Slide: Down Arrow.
- Restart: R (on game over).
- Safehouse: S (menu).
- Pause/Menu: Esc.

### Project structure

- index.html — main entrypoint, canvas setup, HUD, safehouse and puzzle tabs.
- game.js — core runner loop, physics, spawners, collisions, relay banking, persistence.
- puzzle.js — 4×4 Sudoku-style lock puzzle engine with validation and reward callback.
- README.md — usage, deployment, testing, performance, and contribution notes.

### Features implemented

- Core runner: auto-move, jump/slide, delta-timed loop using browser animation callbacks for smooth frame pacing.[5][6]
- Obstacles and collectibles: firewalls, drones, barriers; key-shard pickups with simple particles and counters.
- Relay banking and persistence: bank shards mid-run and save upgrades/progress in localStorage keys bound to origin.[7][3]
- Upgrades: double jump, coyote time, slide cancel, encryption tier behavior for minor hazards.
- Puzzles: three 4×4 grids with row/column/region constraints and unlock rewards via a solve callback.
- Accessibility: high-contrast toggle, keyboard-friendly menus, reduced motion-friendly visuals by design.

### Data persistence

- Storage: uses window.localStorage for banked shards, unlocked upgrades, district progress, and settings, which persist across sessions for the same origin and protocol.[3][7]
- Notes: some browsers restrict persistence in certain privacy modes or non-http(s) origins, which can raise SecurityError for storage; serving via a local server avoids origin edge cases.[8][3]

### Performance

- Rendering: requestAnimationFrame loop with delta timing, which pauses in inactive tabs for better battery life and CPU usage.[6][5]
- Asset discipline: minimal vector-like drawing and tiny audio placeholders recommended to keep initial load responsive on low-end systems.
- Storage events: optional syncing across tabs can listen to the storage event if needed for future multi-tab coordination.[9][4]

### Deployment — GitHub Pages

- Simple path: push the repository with index.html at the root, then in Settings → Pages select “Deploy from a branch” and choose main with root folder for automatic static hosting.[1][2]
- Workflow path: alternatively, configure a GitHub Actions workflow to publish to a gh-pages branch and set Pages to deploy from that branch in Settings → Pages if continuous deploys are preferred.[10][2]

Recommended minimal workflow (if using a gh-pages branch):
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
permissions:
  contents: write
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

- After enabling Pages, the public site address is shown in the repository’s Pages settings, and it may take a few minutes to propagate after a push.[2][1]

### Testing checklist

- Functional: jump/slide responsiveness, obstacle collision, shard pickup, relay banking, game over and restart flow.
- Persistence: upgrades and banked shards remain after refresh and between sessions within the same origin.[3][4]
- Puzzle: 4×4 puzzles validate only on correct solutions and trigger solveCallback to grant the expected reward.
- Performance: holds smooth animation pacing at typical refresh rates or degrades gracefully on lower-end systems with limited CPU/GPU.[6]
- Accessibility: high-contrast toggle clarity, keyboard-only navigation through menus, and legible HUD at small viewport widths.

### Development notes

- Tech stack: vanilla JS + HTML5 Canvas with an animation loop using requestAnimationFrame and no bundler or framework, easing maintenance and fast iteration.[5][6]
- Modularity: separate files for runner and puzzles with minimal shared state, enabling incremental sprints and easy CI deployment from a branch.[2]
- Determinism: add a seeded RNG for weekly routes later, enabling reproducible community challenges without servers as a follow-on task.

### Contributing

- Keep assets small and vector-friendly, prefer tiny OGG clips for SFX in later sprints, and commit with clear messages mapped to sprint tasks for traceability in Pages deployments.[2]
- Validate on a low-end VM or Lubuntu machine early to catch performance regressions before publishing updates to Pages.

### License

- MIT recommended for rapid prototype sharing; place the license file at the repository root and reference it in this README for clarity.[11][2]

### Troubleshooting

- If persistence fails locally, avoid file:// origins and run a lightweight server so localStorage and relative paths behave consistently in all browsers.[8][3]
- If Pages shows 404, verify that Pages source is set to the intended branch and folder in Settings → Pages and wait a short time for the deploy to complete.[12][1]
