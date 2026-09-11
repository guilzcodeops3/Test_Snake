// ---- Setup ----
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRID_SIZE = 20;
const TILE_COUNT = canvas.width / GRID_SIZE; // 20x20 grid

const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlayText');

let snake, direction, nextDirection, food, score, highScore;
let gameRunning = false;
let gamePaused = false;
let gameLoopId = null;
let speed = 120; // ms per tick, gets faster as score rises

function loadHighScore() {
  const stored = window.localStorage ? localStorage.getItem('snakeHighScore') : null;
  return stored ? parseInt(stored, 10) : 0;
}

function saveHighScore(value) {
  try {
    localStorage.setItem('snakeHighScore', value);
  } catch (e) {
    // localStorage unavailable — ignore silently
  }
}

function resetState() {
  snake = [
    { x: 9, y: 10 },
    { x: 8, y: 10 },
    { x: 7, y: 10 }
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  speed = 120;
  scoreEl.textContent = score;
  placeFood();
}

function placeFood() {
  let valid = false;
  let newFood;
  while (!valid) {
    newFood = {
      x: Math.floor(Math.random() * TILE_COUNT),
      y: Math.floor(Math.random() * TILE_COUNT)
    };
    valid = !snake.some(seg => seg.x === newFood.x && seg.y === newFood.y);
  }
  food = newFood;
}

function startGame() {
  resetState();
  gameRunning = true;
  gamePaused = false;
  overlay.classList.add('hidden');
  if (gameLoopId) clearTimeout(gameLoopId);
  tick();
}

function endGame() {
  gameRunning = false;
  if (score > highScore) {
    highScore = score;
    highScoreEl.textContent = highScore;
    saveHighScore(highScore);
  }
  overlayText.innerHTML = `Game Over!<br>Score: ${score}<br><br>Press Space or Tap to Restart`;
  overlay.classList.remove('hidden');
}

function togglePause() {
  if (!gameRunning) return;
  gamePaused = !gamePaused;
  if (gamePaused) {
    overlayText.textContent = 'Paused — Press Space to Resume';
    overlay.classList.remove('hidden');
  } else {
    overlay.classList.add('hidden');
    tick();
  }
}

function tick() {
  if (!gameRunning || gamePaused) return;

  update();
  draw();

  gameLoopId = setTimeout(tick, speed);
}

function update() {
  direction = nextDirection;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  // Wall collision
  if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
    endGame();
    return;
  }

  // Self collision
  if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
    endGame();
    return;
  }

  snake.unshift(head);

  // Food collision
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.textContent = score;
    if (speed > 60) speed -= 2; // ramp difficulty slightly
    placeFood();
  } else {
    snake.pop();
  }
}

function draw() {
  // Background
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle grid
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  for (let i = 0; i <= TILE_COUNT; i++) {
    ctx.beginPath();
    ctx.moveTo(i * GRID_SIZE, 0);
    ctx.lineTo(i * GRID_SIZE, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * GRID_SIZE);
    ctx.lineTo(canvas.width, i * GRID_SIZE);
    ctx.stroke();
  }

  // Food
  ctx.fillStyle = '#f87171';
  roundRect(food.x * GRID_SIZE + 2, food.y * GRID_SIZE + 2, GRID_SIZE - 4, GRID_SIZE - 4, 4);

  // Snake
  snake.forEach((seg, index) => {
    ctx.fillStyle = index === 0 ? '#4ade80' : '#22c55e';
    roundRect(seg.x * GRID_SIZE + 1, seg.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2, 5);
  });
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

// ---- Input handling ----
function setDirection(dx, dy) {
  // Prevent reversing directly into itself
  if (snake.length > 1 && dx === -direction.x && dy === -direction.y) return;
  nextDirection = { x: dx, y: dy };
}

document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      e.preventDefault();
      if (!gameRunning) startGame(); else setDirection(0, -1);
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      e.preventDefault();
      if (!gameRunning) startGame(); else setDirection(0, 1);
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      e.preventDefault();
      if (!gameRunning) startGame(); else setDirection(-1, 0);
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      e.preventDefault();
      if (!gameRunning) startGame(); else setDirection(1, 0);
      break;
    case ' ':
      e.preventDefault();
      if (!gameRunning) startGame(); else togglePause();
      break;
  }
});

overlay.addEventListener('click', () => {
  if (!gameRunning) startGame();
  else if (gamePaused) togglePause();
});

// Touch controls
document.getElementById('btnUp').addEventListener('click', () => { if (!gameRunning) startGame(); else setDirection(0, -1); });
document.getElementById('btnDown').addEventListener('click', () => { if (!gameRunning) startGame(); else setDirection(0, 1); });
document.getElementById('btnLeft').addEventListener('click', () => { if (!gameRunning) startGame(); else setDirection(-1, 0); });
document.getElementById('btnRight').addEventListener('click', () => { if (!gameRunning) startGame(); else setDirection(1, 0); });

// Basic swipe support on the canvas itself
let touchStartX = 0;
let touchStartY = 0;
canvas.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].clientX;
  touchStartY = e.changedTouches[0].clientY;
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
  if (!gameRunning) { startGame(); return; }
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy)) {
    setDirection(dx > 0 ? 1 : -1, 0);
  } else {
    setDirection(0, dy > 0 ? 1 : -1);
  }
}, { passive: true });

// ---- Init ----
highScore = loadHighScore();
highScoreEl.textContent = highScore;
resetState();
draw();
