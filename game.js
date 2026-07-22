'use strict';

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const COLORS = [
  null,
  '#4dd0e1', // I - cyan
  '#ffd54f', // O - yellow
  '#ba68c8', // T - purple
  '#81c784', // S - green
  '#e57373', // Z - red
  '#90caf9', // J - pale blue
  '#ffb74d', // L - orange
  '#b0bec5', // 8 - tuerca / nut (gris acero)
];

const PIECES = [
  null,
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
  [[2,2],[2,2]],                               // O
  [[0,3,0],[3,3,3],[0,0,0]],                  // T
  [[0,4,4],[4,4,0],[0,0,0]],                  // S
  [[5,5,0],[0,5,5],[0,0,0]],                  // Z
  [[6,0,0],[6,6,6],[0,0,0]],                  // J
  [[0,0,7],[7,7,7],[0,0,0]],                  // L
  [[8,8,8],[8,0,8],[8,8,8]],                  // Tuerca (nut) - hueco central
];

const LINE_SCORES = [0, 100, 300, 500, 800];

// Paletas de skins visuales, indexadas igual que COLORS (1-8 tipos de pieza).
const NEON_COLORS = [
  null,
  '#00fff2', // I
  '#faff00', // O
  '#ff00f7', // T
  '#00ff6a', // S
  '#ff2050', // Z
  '#00aaff', // J
  '#ff8800', // L
  '#ffffff', // Tuerca
];

const PASTEL_COLORS = [
  null,
  '#a8dadc', // I
  '#ffe8a3', // O
  '#d9b8e8', // T
  '#b8e6c1', // S
  '#f3b8c1', // Z
  '#b8d4f0', // J
  '#f5cba7', // L
  '#d6d9dd', // Tuerca
];

const SKINS = ['retro', 'neon', 'pastel', 'pixel'];

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('overlay');
const overlayGameOver = document.getElementById('overlay-gameover');
const overlayTitle = document.getElementById('overlay-title');
const overlayScore = document.getElementById('overlay-score');
const restartBtn = document.getElementById('restart-btn');
const themeToggleBtn = document.getElementById('theme-toggle');
const themeToggleIcon = document.getElementById('theme-toggle-icon');
const skinSelect = document.getElementById('skin-select');

const startScreen = document.getElementById('start-screen');
const playBtn = document.getElementById('play-btn');
const startTableBody = document.querySelector('#start-table tbody');
const startBestComboEl = document.getElementById('start-best-combo');
const startMaxLinesEl = document.getElementById('start-max-lines');
const resetRecordsBtnStart = document.getElementById('reset-records-btn-start');

const recordsSection = document.getElementById('records-section');
const scoreNameForm = document.getElementById('score-name-form');
const playerNameInput = document.getElementById('player-name');
const gameOverTableBody = document.querySelector('#game-over-table tbody');
const gameOverBestComboEl = document.getElementById('game-over-best-combo');
const gameOverMaxLinesEl = document.getElementById('game-over-max-lines');
const resetRecordsBtnGameOver = document.getElementById('reset-records-btn-gameover');

const pauseMenu = document.getElementById('pause-menu');
const resumeBtn = document.getElementById('resume-btn');
const pauseRestartBtn = document.getElementById('pause-restart-btn');
const toggleControlsBtn = document.getElementById('toggle-controls-btn');
const pauseControls = document.getElementById('pause-controls');
const startLevelSelect = document.getElementById('start-level-select');

const THEME_KEY = 'tetris-theme';
const SKIN_KEY = 'tetris-skin';
const RECORDS_KEY = 'tetris-records';
const START_LEVEL_KEY = 'tetris-start-level';
const MAX_START_LEVEL = 15;

function readStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

function writeStoredTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Almacenamiento no disponible (file://, navegación privada, etc.)
  }
}

function readStoredSkin() {
  try {
    return localStorage.getItem(SKIN_KEY);
  } catch {
    return null;
  }
}

function writeStoredSkin(skin) {
  try {
    localStorage.setItem(SKIN_KEY, skin);
  } catch {
    // Almacenamiento no disponible (file://, navegación privada, etc.)
  }
}

function readStoredStartLevel() {
  try {
    const value = parseInt(localStorage.getItem(START_LEVEL_KEY), 10);
    if (Number.isInteger(value) && value >= 1 && value <= MAX_START_LEVEL) return value;
    return 1;
  } catch {
    return 1;
  }
}

function writeStoredStartLevel(level) {
  try {
    localStorage.setItem(START_LEVEL_KEY, String(level));
  } catch {
    // Almacenamiento no disponible (file://, navegación privada, etc.)
  }
}

function readStoredRecords() {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredRecords(data) {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(data));
  } catch {
    // Almacenamiento no disponible (file://, navegación privada, etc.)
  }
}

function getRecordsData() {
  const stored = readStoredRecords();
  if (stored && Array.isArray(stored.list)) {
    return {
      list: stored.list,
      bestCombo: stored.bestCombo || 0,
      maxLines: stored.maxLines || 0,
    };
  }
  return { list: [], bestCombo: 0, maxLines: 0 };
}

function resetRecords() {
  writeStoredRecords({ list: [], bestCombo: 0, maxLines: 0 });
  renderAllRecords();
}

function renderRecordsInto(tbody, list, highlightIndex) {
  tbody.innerHTML = '';
  if (!list.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 3;
    td.className = 'records-empty';
    td.textContent = 'Sin records aún';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  list.forEach((entry, i) => {
    const tr = document.createElement('tr');
    if (i === highlightIndex) tr.classList.add('highlight');
    const posTd = document.createElement('td');
    posTd.textContent = String(i + 1);
    const nameTd = document.createElement('td');
    nameTd.textContent = entry.name;
    const scoreTd = document.createElement('td');
    scoreTd.textContent = entry.score.toLocaleString();
    tr.append(posTd, nameTd, scoreTd);
    tbody.appendChild(tr);
  });
}

function renderAllRecords(highlightIndex) {
  const data = getRecordsData();
  renderRecordsInto(startTableBody, data.list);
  renderRecordsInto(gameOverTableBody, data.list, highlightIndex);
  startBestComboEl.textContent = data.bestCombo;
  startMaxLinesEl.textContent = data.maxLines;
  gameOverBestComboEl.textContent = data.bestCombo;
  gameOverMaxLinesEl.textContent = data.maxLines;
}

let board, current, next, score, lines, level, paused, gameOver, lastTime, dropAccum, dropInterval, animId;
let started = false;
let comboStreak = 0;
let bestComboThisGame = 0;
let gridLineColor = '#22222e';
let currentSkin = 'retro';

function createBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function randomPiece() {
  const type = Math.floor(Math.random() * 8) + 1;
  const shape = PIECES[type].map(row => [...row]);
  return { type, shape, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 };
}

function collide(shape, ox, oy) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function rotateCW(shape) {
  const rows = shape.length, cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[c][rows - 1 - r] = shape[r][c];
  return result;
}

function tryRotate() {
  const rotated = rotateCW(current.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collide(rotated, current.x + kick, current.y)) {
      current.shape = rotated;
      current.x += kick;
      return;
    }
  }
}

function merge() {
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        board[current.y + r][current.x + c] = current.shape[r][c];
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(v => v !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  if (cleared) {
    lines += cleared;
    score += (LINE_SCORES[cleared] || 0) * level;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 1000 - (level - 1) * 90);
    comboStreak++;
    bestComboThisGame = Math.max(bestComboThisGame, comboStreak);
    updateHUD();
  } else {
    comboStreak = 0;
  }
  return cleared;
}

function ghostY() {
  let gy = current.y;
  while (!collide(current.shape, current.x, gy + 1)) gy++;
  return gy;
}

function hardDrop() {
  const gy = ghostY();
  score += (gy - current.y) * 2;
  current.y = gy;
  lockPiece();
}

function softDrop() {
  if (!collide(current.shape, current.x, current.y + 1)) {
    current.y++;
    score += 1;
    updateHUD();
  } else {
    lockPiece();
  }
}

function lockPiece() {
  merge();
  clearLines();
  spawn();
}

function spawn() {
  current = next;
  next = randomPiece();
  if (collide(current.shape, current.x, current.y)) {
    endGame();
  }
  drawNext();
}

function updateHUD() {
  scoreEl.textContent = score.toLocaleString();
  linesEl.textContent = lines;
  levelEl.textContent = level;
}

function roundedRectPath(context, x, y, w, h, r) {
  if (typeof context.roundRect === 'function') {
    context.beginPath();
    context.roundRect(x, y, w, h, r);
    return;
  }
  // Fallback manual para entornos sin ctx.roundRect().
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + w - r, y);
  context.quadraticCurveTo(x + w, y, x + w, y + r);
  context.lineTo(x + w, y + h - r);
  context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  context.lineTo(x + r, y + h);
  context.quadraticCurveTo(x, y + h, x, y + h - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function drawBlockRetro(context, x, y, colorIndex, size, alpha) {
  const color = COLORS[colorIndex];
  context.save();
  context.globalAlpha = alpha ?? 1;
  context.fillStyle = color;
  context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  // highlight
  context.fillStyle = 'rgba(255,255,255,0.12)';
  context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
  context.restore();
}

function drawBlockNeon(context, x, y, colorIndex, size, alpha) {
  const color = NEON_COLORS[colorIndex];
  const px = x * size;
  const py = y * size;
  context.save();
  context.globalAlpha = alpha ?? 1;
  context.shadowBlur = 14;
  context.shadowColor = color;
  context.fillStyle = color;
  context.fillRect(px + 3, py + 3, size - 6, size - 6);
  context.shadowBlur = 0;
  context.strokeStyle = color;
  context.lineWidth = 1;
  context.strokeRect(px + 1.5, py + 1.5, size - 3, size - 3);
  context.restore();
}

function drawBlockPastel(context, x, y, colorIndex, size, alpha) {
  const color = PASTEL_COLORS[colorIndex];
  const px = x * size + 2;
  const py = y * size + 2;
  const w = size - 4;
  const h = size - 4;
  const radius = Math.min(6, w / 2, h / 2);
  context.save();
  context.globalAlpha = alpha ?? 1;
  context.fillStyle = color;
  roundedRectPath(context, px, py, w, h, radius);
  context.fill();
  // highlight suave en la parte superior
  context.fillStyle = 'rgba(255,255,255,0.35)';
  context.fillRect(px + radius, py + 1, Math.max(0, w - radius * 2), 4);
  context.restore();
}

function drawBlockPixel(context, x, y, colorIndex, size, alpha) {
  const color = COLORS[colorIndex];
  const px = x * size + 1;
  const py = y * size + 1;
  const s = size - 2;
  context.save();
  context.globalAlpha = alpha ?? 1;
  context.fillStyle = color;
  context.fillRect(px, py, s, s);
  // patrón de dither/textura pixel-art
  const cell = Math.max(2, Math.floor(s / 4));
  for (let ry = 0; ry < s; ry += cell) {
    for (let rx = 0; rx < s; rx += cell) {
      const dark = ((rx / cell) + (ry / cell)) % 2 === 0;
      context.fillStyle = dark ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.18)';
      context.fillRect(px + rx, py + ry, Math.min(cell, s - rx), Math.min(cell, s - ry));
    }
  }
  context.strokeStyle = 'rgba(0,0,0,0.35)';
  context.lineWidth = 1;
  context.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);
  context.restore();
}

function drawBlock(context, x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  switch (currentSkin) {
    case 'neon':
      drawBlockNeon(context, x, y, colorIndex, size, alpha);
      break;
    case 'pastel':
      drawBlockPastel(context, x, y, colorIndex, size, alpha);
      break;
    case 'pixel':
      drawBlockPixel(context, x, y, colorIndex, size, alpha);
      break;
    default:
      drawBlockRetro(context, x, y, colorIndex, size, alpha);
  }
}

function drawGrid() {
  ctx.strokeStyle = gridLineColor;
  ctx.lineWidth = 0.5;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * BLOCK, 0);
    ctx.lineTo(c * BLOCK, ROWS * BLOCK);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * BLOCK);
    ctx.lineTo(COLS * BLOCK, r * BLOCK);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  // board
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      drawBlock(ctx, c, r, board[r][c], BLOCK);

  // ghost
  const gy = ghostY();
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        drawBlock(ctx, current.x + c, gy + r, current.shape[r][c], BLOCK, 0.2);

  // current piece
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      drawBlock(ctx, current.x + c, current.y + r, current.shape[r][c], BLOCK);
}

function drawNext() {
  const NB = 30;
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const shape = next.shape;
  const offX = Math.floor((4 - shape[0].length) / 2);
  const offY = Math.floor((4 - shape.length) / 2);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB);
}

function showOverlay(mode) {
  overlayGameOver.classList.toggle('hidden', mode !== 'gameover');
  pauseMenu.classList.toggle('hidden', mode !== 'pause');
  overlay.classList.remove('hidden');
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

function endGame() {
  gameOver = true;
  cancelAnimationFrame(animId);
  overlayTitle.textContent = 'GAME OVER';
  overlayScore.textContent = `Puntuación: ${score.toLocaleString()}`;

  const data = getRecordsData();
  data.bestCombo = Math.max(data.bestCombo, bestComboThisGame);
  data.maxLines = Math.max(data.maxLines, lines);
  writeStoredRecords(data);

  const qualifies = data.list.length < 5 || score > data.list[data.list.length - 1].score;
  playerNameInput.value = '';
  scoreNameForm.classList.toggle('hidden', !qualifies);
  recordsSection.classList.remove('hidden');
  renderAllRecords();

  showOverlay('gameover');
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  if (!paused) {
    lastTime = performance.now();
    loop(lastTime);
    hideOverlay();
  } else {
    cancelAnimationFrame(animId);
    showOverlay('pause');
  }
}

function loop(ts) {
  const dt = ts - lastTime;
  lastTime = ts;
  dropAccum += dt;
  if (dropAccum >= dropInterval) {
    dropAccum = 0;
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
    } else {
      lockPiece();
    }
  }
  draw();
  animId = requestAnimationFrame(loop);
}

function init() {
  board = createBoard();
  score = 0;
  lines = 0;
  level = readStoredStartLevel();
  paused = false;
  gameOver = false;
  comboStreak = 0;
  bestComboThisGame = 0;
  dropInterval = Math.max(100, 1000 - (level - 1) * 90);
  dropAccum = 0;
  lastTime = performance.now();
  next = randomPiece();
  spawn();
  updateHUD();
  started = true;
  startScreen.classList.add('hidden');
  hideOverlay();
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

document.addEventListener('keydown', e => {
  if (!started) return;
  if (e.code === 'KeyP' || e.code === 'Escape') { togglePause(); return; }
  if (paused || gameOver) return;
  switch (e.code) {
    case 'ArrowLeft':
      if (!collide(current.shape, current.x - 1, current.y)) current.x--;
      break;
    case 'ArrowRight':
      if (!collide(current.shape, current.x + 1, current.y)) current.x++;
      break;
    case 'ArrowDown':
      softDrop();
      break;
    case 'ArrowUp':
    case 'KeyX':
      tryRotate();
      break;
    case 'Space':
      e.preventDefault();
      hardDrop();
      break;
  }
  updateHUD();
});

restartBtn.addEventListener('click', init);
playBtn.addEventListener('click', init);
resetRecordsBtnStart.addEventListener('click', resetRecords);
resetRecordsBtnGameOver.addEventListener('click', resetRecords);

scoreNameForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = playerNameInput.value.trim().slice(0, 12) || 'Jugador';
  const data = getRecordsData();
  const entry = { name, score };
  data.list.push(entry);
  data.list.sort((a, b) => b.score - a.score);
  data.list = data.list.slice(0, 5);
  const highlightIndex = data.list.indexOf(entry);
  writeStoredRecords(data);
  scoreNameForm.classList.add('hidden');
  renderAllRecords(highlightIndex);
});

pauseRestartBtn.addEventListener('click', init);
resumeBtn.addEventListener('click', togglePause);

toggleControlsBtn.addEventListener('click', () => {
  const willShow = pauseControls.classList.contains('hidden');
  pauseControls.classList.toggle('hidden', !willShow);
  toggleControlsBtn.setAttribute('aria-expanded', String(willShow));
});

for (let lvl = 1; lvl <= MAX_START_LEVEL; lvl++) {
  const option = document.createElement('option');
  option.value = String(lvl);
  option.textContent = String(lvl);
  startLevelSelect.appendChild(option);
}
startLevelSelect.value = String(readStoredStartLevel());
startLevelSelect.addEventListener('change', () => {
  writeStoredStartLevel(parseInt(startLevelSelect.value, 10));
});

function applyTheme(theme) {
  document.body.classList.toggle('light-theme', theme === 'light');
  themeToggleIcon.textContent = theme === 'light' ? '☀️' : '🌙';
  themeToggleBtn.setAttribute('aria-pressed', String(theme === 'light'));
  themeToggleBtn.setAttribute('aria-label', theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
  gridLineColor = getComputedStyle(document.body).getPropertyValue('--grid-line').trim();
}

themeToggleBtn.addEventListener('click', () => {
  const theme = document.body.classList.contains('light-theme') ? 'dark' : 'light';
  writeStoredTheme(theme);
  applyTheme(theme);
});

function applySkin(skin) {
  currentSkin = SKINS.includes(skin) ? skin : 'retro';
  document.body.classList.remove('skin-neon', 'skin-pastel', 'skin-pixel');
  if (currentSkin !== 'retro') document.body.classList.add(`skin-${currentSkin}`);
  if (skinSelect) skinSelect.value = currentSkin;
  // Redibuja de inmediato para que el cambio se vea aunque el juego esté en pausa.
  if (board) {
    draw();
    drawNext();
  }
}

if (skinSelect) {
  skinSelect.addEventListener('change', () => {
    const skin = skinSelect.value;
    writeStoredSkin(skin);
    applySkin(skin);
  });
}

applyTheme(readStoredTheme() === 'light' ? 'light' : 'dark');
applySkin(readStoredSkin() || 'retro');
renderAllRecords();
