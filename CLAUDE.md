# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Vanilla JavaScript Tetris. Three files, no dependencies, no build step, no package.json:

- `index.html` — DOM structure: main `#board` canvas (300×600), `#next-canvas` preview (120×120), HUD panel (score/lines/level), and a shared `#overlay` used for both pause and game-over states.
- `style.css` — dark/retro theme.
- `game.js` — all game logic (~300 lines, single file, no modules).

## Running / testing

No build or package manager. Open `index.html` directly, or serve it statically:

```bash
python3 -m http.server 8000   # or: npx serve .
```

There is no test suite, linter, or CI config in this repo. Verify changes by opening the game in a browser and playing (see the Controls table in README.md).

## Architecture (game.js)

Everything lives in module-level `let` state (`board`, `current`, `next`, `score`, `lines`, `level`, `paused`, `gameOver`, `dropInterval`, etc.) mutated in place by top-level functions — there are no classes and no state container. Key pieces:

- **Board**: `ROWS × COLS` matrix; each cell is `0` (empty) or a color index `1–7` identifying which piece type locked there. `COLORS[]` and `PIECES[]` are parallel arrays indexed by piece type.
- **Piece rotation**: `rotateCW` transposes + reverses rows on the shape's own square matrix (no separate rotation-state tables). `tryRotate` applies this then attempts wall kicks via a fixed offset list `[0, -1, 1, -2, 2]`, using `collide()` to test each.
- **Collision** (`collide`): the single source of truth for legality — checks board bounds and overlap with locked cells. Used for movement, rotation, soft drop, and ghost-piece projection.
- **Game loop** (`loop`, driven by `requestAnimationFrame`): accumulates elapsed time in `dropAccum`; when it exceeds `dropInterval`, advances the piece one row or locks it. Pausing/resuming works by cancelling/re-requesting the animation frame (`animId`) and resetting `lastTime` — there's no separate "paused" branch inside `loop` itself.
- **Locking a piece** (`lockPiece`): `merge()` writes the shape into `board`, `clearLines()` removes full rows (shifting from the bottom up, re-checking the same row index after a splice), then `spawn()` promotes `next` to `current` and generates a new `next`. If the new `current` immediately collides at spawn, `endGame()` fires.
- **Scoring**: `LINE_SCORES = [0, 100, 300, 500, 800]` indexed by lines-cleared-at-once, multiplied by `level`. Hard drop adds 2 pts/row dropped; soft drop adds 1 pt/row. `level` increases every 10 lines, and `dropInterval` is recalculated as `max(100, 1000 - (level-1)*90)`.
- **Rendering** (`draw`): clears and redraws every frame — grid lines, locked board cells, the ghost piece (computed via `ghostY()`, drawn at `globalAlpha = 0.2`), then the current piece on top. `drawNext` renders the preview canvas the same way, centered in a 4×4 cell.
- **Input**: a single `keydown` listener switches on `e.code`; `KeyP` toggles pause even while paused/game-over, all other keys are ignored when `paused || gameOver` is true.

## Tunable constants (top of game.js)

`COLS`, `ROWS`, `BLOCK`, `COLORS`, `LINE_SCORES`, `dropInterval` (initial value). If `COLS`/`ROWS`/`BLOCK` change, also update the `#board` canvas `width`/`height` in `index.html` to match (`COLS × BLOCK` and `ROWS × BLOCK`).
