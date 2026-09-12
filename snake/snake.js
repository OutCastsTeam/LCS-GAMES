const GRID = 20;
const START_SPEED = 180;
const MIN_SPEED = 70;
const SPEED_STEP = 6;

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const overlay = document.getElementById('overlay');
const ovEmoji = document.getElementById('ov-emoji');
const ovTitle = document.getElementById('ov-title');
const ovText = document.getElementById('ov-text');
const ovBtn = document.getElementById('ov-btn');

let snake, dir, nextDir, food, score, speed, timer, running, cellSize;
let best = parseInt(localStorage.getItem('snake_best') || '0', 10);
bestEl.textContent = best;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cellSize = rect.width / GRID;
  draw();
}
window.addEventListener('resize', resizeCanvas);

function startGame() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score = 0;
  speed = START_SPEED;
  running = true;
  scoreEl.textContent = 0;
  spawnFood();
  overlay.classList.add('hidden');
  clearInterval(timer);
  timer = setInterval(tick, speed);
}

function spawnFood() {
  while (true) {
    const f = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    if (!snake.some(s => s.x === f.x && s.y === f.y)) { food = f; return; }
  }
}

function tick() {
  if (!running) return;
  if (nextDir.x !== -dir.x || nextDir.y !== -dir.y) dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID ||
      snake.some(s => s.x === head.x && s.y === head.y)) {
    gameOver();
    return;
  }
  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = score;
    if (score > best) {
      best = score;
      bestEl.textContent = best;
      localStorage.setItem('snake_best', best);
    }
    spawnFood();
    if (speed > MIN_SPEED) {
      speed -= SPEED_STEP;
      clearInterval(timer);
      timer = setInterval(tick, speed);
    }
  } else snake.pop();
  draw();
}

function draw() {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  if (!cellSize) return;
  ctx.fillStyle = '#1b2838';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(42, 71, 94, 0.3)';
  ctx.lineWidth = 1;
  for (let i = 1; i < GRID; i++) {
    ctx.beginPath(); ctx.moveTo(i * cellSize, 0); ctx.lineTo(i * cellSize, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * cellSize); ctx.lineTo(w, i * cellSize); ctx.stroke();
  }
  if (!snake) return;
  if (food) {
    ctx.fillStyle = '#ef4444';
    const pad = cellSize * 0.15;
    roundRect(food.x * cellSize + pad, food.y * cellSize + pad, cellSize - pad * 2, cellSize - pad * 2, cellSize * 0.25);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(food.x * cellSize + cellSize * 0.35, food.y * cellSize + cellSize * 0.35, cellSize * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  snake.forEach((s, i) => {
    if (i === 0) ctx.fillStyle = '#22c55e';
    else {
      const alpha = Math.max(0.45, 1 - i * 0.03);
      ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
    }
    const pad = cellSize * 0.08;
    roundRect(s.x * cellSize + pad, s.y * cellSize + pad, cellSize - pad * 2, cellSize - pad * 2, cellSize * 0.22);
    ctx.fill();
  });
  if (snake.length > 0) {
    const head = snake[0];
    const cx = head.x * cellSize + cellSize / 2;
    const cy = head.y * cellSize + cellSize / 2;
    const eyeOff = cellSize * 0.16;
    const eyeR = cellSize * 0.09;
    let ex = 0, ey = 0;
    if (dir.x === 1) ex = eyeOff;
    else if (dir.x === -1) ex = -eyeOff;
    else if (dir.y === 1) ey = eyeOff;
    else if (dir.y === -1) ey = -eyeOff;
    ctx.fillStyle = '#0b1220';
    ctx.beginPath();
    ctx.arc(cx + ex + (dir.x !== 0 ? 0 : -eyeOff), cy + ey + (dir.y !== 0 ? 0 : -eyeOff), eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + ex + (dir.x !== 0 ? 0 : eyeOff), cy + ey + (dir.y !== 0 ? 0 : eyeOff), eyeR, 0, Math.PI * 2);
    ctx.fill();
  }
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function gameOver() {
  running = false;
  clearInterval(timer);
  ovEmoji.textContent = '💀';
  ovTitle.textContent = 'Игра окончена';
  ovText.innerHTML = `Счёт: <b style="color:#22c55e">${score}</b><br>Рекорд: <b style="color:#fbbf24">${best}</b>`;
  ovBtn.textContent = '🔄 Заново';
  overlay.classList.remove('hidden');
}

function setDir(dx, dy) {
  if (!running) return;
  if (dx === -dir.x && dy === -dir.y) return;
  nextDir = { x: dx, y: dy };
}
document.querySelectorAll('.ctrl-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const d = btn.dataset.dir;
    if (d === 'up') setDir(0, -1);
    else if (d === 'down') setDir(0, 1);
    else if (d === 'left') setDir(-1, 0);
    else if (d === 'right') setDir(1, 0);
  });
});
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp' || e.key === 'w') setDir(0, -1);
  else if (e.key === 'ArrowDown' || e.key === 's') setDir(0, 1);
  else if (e.key === 'ArrowLeft' || e.key === 'a') setDir(-1, 0);
  else if (e.key === 'ArrowRight' || e.key === 'd') setDir(1, 0);
});

let touchStart = null;
canvas.addEventListener('touchstart', e => {
  const t = e.touches[0];
  touchStart = { x: t.clientX, y: t.clientY };
}, { passive: true });
canvas.addEventListener('touchmove', e => {
  if (!touchStart) return;
  const t = e.touches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  const THRESHOLD = 24;
  if (Math.abs(dx) < THRESHOLD && Math.abs(dy) < THRESHOLD) return;
  if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 1 : -1, 0);
  else setDir(0, dy > 0 ? 1 : -1);
  touchStart = null;
}, { passive: true });
canvas.addEventListener('touchend', () => { touchStart = null; });

ovBtn.addEventListener('click', startGame);
resizeCanvas();
setTimeout(resizeCanvas, 100);
