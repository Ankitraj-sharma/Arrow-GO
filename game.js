// ==========================================
// ARROWSGO - PUZZLE ENGINE & SVG RENDERER
// ==========================================

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playWhoosh() {
    if (this.isMuted) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.22);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  playBlocked() {
    if (this.isMuted) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.setValueAtTime(110, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playVictory() {
    if (this.isMuted) return;
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime + (i * 0.09);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.42);
    });
  }

  playClick() {
    if (this.isMuted) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }
}

class ArrowsGoGame {
  constructor() {
    this.audio = new AudioEngine();
    this.currentMode = 'main'; // 'main' | 'random' | 'challenge'
    this.currentLevelIndex = 2; // Default to Level 3 (the iconic screenshot level!)
    this.currentLevel = null;
    this.activeArrows = [];
    this.moveHistory = [];
    this.moveCount = 0;
    this.score = 0;
    this.challengeTimeLeft = 60;
    this.challengeTimer = null;
    this.isAnimating = false;

    // Elements
    this.svgBoard = document.getElementById('puzzle-svg');
    this.boardContainer = document.getElementById('board-container');
    this.levelTitleEl = document.getElementById('level-title');
    this.levelBadgeEl = document.getElementById('level-badge');
    this.movesEl = document.getElementById('stat-moves');
    this.scoreEl = document.getElementById('stat-score');
    this.timerContainer = document.getElementById('timer-container');
    this.timerValEl = document.getElementById('timer-val');

    this.initEvents();
  }

  init() {
    this.loadLevel(this.currentLevelIndex);
  }

  initEvents() {
    // Mode Buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.audio.playClick();
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setMode(btn.dataset.mode);
      });
    });

    // Action Controls
    document.getElementById('btn-hint')?.addEventListener('click', () => this.showHint());
    document.getElementById('btn-undo')?.addEventListener('click', () => this.undoMove());
    document.getElementById('btn-reset')?.addEventListener('click', () => {
      this.audio.playClick();
      this.loadLevel(this.currentLevelIndex);
    });
    document.getElementById('btn-next-level')?.addEventListener('click', () => {
      this.audio.playClick();
      this.closeModal('victory-modal');
      this.nextLevel();
    });

    // Share Button
    document.getElementById('btn-share')?.addEventListener('click', () => {
      this.audio.playClick();
      navigator.clipboard.writeText(window.location.href);
      const toast = document.getElementById('share-toast');
      if (toast) {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
      }
    });

    // Sound Toggle
    document.getElementById('btn-sound-toggle')?.addEventListener('click', (e) => {
      this.audio.isMuted = !this.audio.isMuted;
      e.currentTarget.textContent = this.audio.isMuted ? '🔇' : '🔊';
    });

    // Leaderboard Modal
    document.getElementById('btn-leaderboard')?.addEventListener('click', () => this.openLeaderboard());
    document.getElementById('btn-close-leaderboard')?.addEventListener('click', () => this.closeModal('leaderboard-modal'));
  }

  setMode(mode) {
    this.currentMode = mode;
    if (this.challengeTimer) clearInterval(this.challengeTimer);

    if (mode === 'main') {
      this.timerContainer.style.display = 'none';
      this.currentLevelIndex = 2; // Level 3 default
      this.loadLevel(this.currentLevelIndex);
    } else if (mode === 'random') {
      this.timerContainer.style.display = 'none';
      this.loadRandomLevel();
    } else if (mode === 'challenge') {
      this.timerContainer.style.display = 'flex';
      this.challengeTimeLeft = 60;
      this.startChallengeTimer();
      this.loadRandomLevel();
    }
  }

  startChallengeTimer() {
    this.timerValEl.textContent = `${this.challengeTimeLeft}s`;
    this.challengeTimer = setInterval(() => {
      this.challengeTimeLeft--;
      this.timerValEl.textContent = `${this.challengeTimeLeft}s`;
      if (this.challengeTimeLeft <= 0) {
        clearInterval(this.challengeTimer);
        this.endChallenge();
      }
    }, 1000);
  }

  endChallenge() {
    this.audio.playVictory();
    alert(`Challenge Complete! Your final score: ${this.score}`);
    if (window.cloudBackend) {
      window.cloudBackend.submitScore(this.score, true, 100);
    }
    this.setMode('main');
  }

  loadLevel(index) {
    if (index >= LEVELS_DATA.length) index = 0;
    this.currentLevelIndex = index;
    const data = LEVELS_DATA[index];
    this.currentLevel = JSON.parse(JSON.stringify(data));
    this.activeArrows = [...this.currentLevel.arrows];
    this.moveHistory = [];
    this.moveCount = 0;
    this.updateStats();

    if (this.levelTitleEl) this.levelTitleEl.textContent = data.title;
    if (this.levelBadgeEl) this.levelBadgeEl.textContent = `LEVEL ${data.id}`;

    this.renderBoard();
  }

  loadRandomLevel() {
    const data = generateProceduralLevel(this.currentLevelIndex + 1, 8, 7);
    this.currentLevel = data;
    this.activeArrows = [...data.arrows];
    this.moveHistory = [];
    this.moveCount = 0;
    this.updateStats();

    if (this.levelTitleEl) this.levelTitleEl.textContent = data.title;
    if (this.levelBadgeEl) this.levelBadgeEl.textContent = `RANDOM`;

    this.renderBoard();
  }

  renderBoard() {
    if (!this.svgBoard) return;
    this.svgBoard.innerHTML = '';

    const boardWidth = 520;
    const boardHeight = 520;
    const gridSize = this.currentLevel.gridSize || 8;
    const padding = 36;
    const step = (boardWidth - padding * 2) / (gridSize - 1);

    // 1. Draw Dot Grid
    const dotsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    dotsGroup.setAttribute('class', 'grid-dots');
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cx = padding + col * step;
        const cy = padding + row * step;
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', cx);
        dot.setAttribute('cy', cy);
        dot.setAttribute('r', '3.5');
        dot.setAttribute('fill', '#93c5fd');
        dot.setAttribute('opacity', '0.65');
        dotsGroup.appendChild(dot);
      }
    }
    this.svgBoard.appendChild(dotsGroup);

    // 2. Draw Arrows
    const arrowsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    arrowsGroup.setAttribute('class', 'arrows-layer');

    this.activeArrows.forEach(arrow => {
      const g = this.createArrowSVG(arrow, padding, step);
      arrowsGroup.appendChild(g);
    });

    this.svgBoard.appendChild(arrowsGroup);
  }

  createArrowSVG(arrow, padding, step) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'arrow-item');
    g.setAttribute('data-id', arrow.id);
    g.style.cursor = 'pointer';

    // Build SVG Path
    let d = '';
    arrow.points.forEach((pt, i) => {
      const x = padding + pt.x * step;
      const y = padding + pt.y * step;
      d += (i === 0 ? `M ${x} ${y} ` : `L ${x} ${y} `);
    });

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', '#0f172a');
    path.setAttribute('stroke-width', '4.5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('fill', 'none');
    g.appendChild(path);

    // Arrowhead at the last point
    const headPt = arrow.points[arrow.points.length - 1];
    const prevPt = arrow.points[arrow.points.length - 2] || arrow.points[0];
    const hx = padding + headPt.x * step;
    const hy = padding + headPt.y * step;

    const headSVG = this.createArrowHead(hx, hy, arrow.direction);
    g.appendChild(headSVG);

    // Optional Yellow Token / Circle node (like in screenshot)
    if (arrow.hasNode && arrow.nodePos) {
      const nx = padding + arrow.nodePos.x * step;
      const ny = padding + arrow.nodePos.y * step;
      const token = this.createNodeToken(nx, ny);
      g.appendChild(token);
    }

    // Click handler
    g.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleArrowClick(arrow, g);
    });

    return g;
  }

  createArrowHead(x, y, dir) {
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const size = 9;

    let points = '';
    if (dir === 'right') {
      points = `${x},${y} ${x - size * 1.5},${y - size} ${x - size},${y} ${x - size * 1.5},${y + size}`;
    } else if (dir === 'left') {
      points = `${x},${y} ${x + size * 1.5},${y - size} ${x + size},${y} ${x + size * 1.5},${y + size}`;
    } else if (dir === 'down') {
      points = `${x},${y} ${x - size},${y - size * 1.5} ${x},${y - size} ${x + size},${y - size * 1.5}`;
    } else { // 'up'
      points = `${x},${y} ${x - size},${y + size * 1.5} ${x},${y + size} ${x + size},${y + size * 1.5}`;
    }

    poly.setAttribute('points', points);
    poly.setAttribute('fill', '#0f172a');
    return poly;
  }

  createNodeToken(x, y) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'node-token');

    // Outer glow / circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', '13');
    circle.setAttribute('fill', '#fef08a');
    circle.setAttribute('stroke', '#eab308');
    circle.setAttribute('stroke-width', '2.8');

    // Inner eyes/dots (cute token styling)
    const eye1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    eye1.setAttribute('cx', x - 4);
    eye1.setAttribute('cy', y);
    eye1.setAttribute('r', '1.8');
    eye1.setAttribute('fill', '#854d0e');

    const eye2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    eye2.setAttribute('cx', x + 4);
    eye2.setAttribute('cy', y);
    eye2.setAttribute('r', '1.8');
    eye2.setAttribute('fill', '#854d0e');

    g.appendChild(circle);
    g.appendChild(eye1);
    g.appendChild(eye2);
    return g;
  }

  // ==========================================
  // COLLISION DETECTION & RAYCASTING
  // ==========================================
  isArrowBlocked(arrow) {
    const head = arrow.points[arrow.points.length - 1];
    const dir = arrow.direction;
    const eps = 0.05;

    for (const other of this.activeArrows) {
      if (other.id === arrow.id) continue;

      // Check all line segments of 'other' arrow
      for (let i = 0; i < other.points.length - 1; i++) {
        const p1 = other.points[i];
        const p2 = other.points[i + 1];

        if (this.rayIntersectsSegment(head, dir, p1, p2, eps)) {
          return true; // BLOCKED!
        }
      }
    }
    return false; // FREE TO ESCAPE!
  }

  rayIntersectsSegment(head, dir, p1, p2, eps) {
    const minX = Math.min(p1.x, p2.x) - eps;
    const maxX = Math.max(p1.x, p2.x) + eps;
    const minY = Math.min(p1.y, p2.y) - eps;
    const maxY = Math.max(p1.y, p2.y) + eps;

    const isVertical = Math.abs(p1.x - p2.x) < 0.1;
    const isHorizontal = Math.abs(p1.y - p2.y) < 0.1;

    if (dir === 'right') {
      if (isVertical && p1.x > head.x + eps && head.y >= minY && head.y <= maxY) return true;
      if (isHorizontal && Math.abs(p1.y - head.y) < 0.2 && maxX > head.x + eps) return true;
    } else if (dir === 'left') {
      if (isVertical && p1.x < head.x - eps && head.y >= minY && head.y <= maxY) return true;
      if (isHorizontal && Math.abs(p1.y - head.y) < 0.2 && minX < head.x - eps) return true;
    } else if (dir === 'down') {
      if (isHorizontal && p1.y > head.y + eps && head.x >= minX && head.x <= maxX) return true;
      if (isVertical && Math.abs(p1.x - head.x) < 0.2 && maxY > head.y + eps) return true;
    } else if (dir === 'up') {
      if (isHorizontal && p1.y < head.y - eps && head.x >= minX && head.x <= maxX) return true;
      if (isVertical && Math.abs(p1.x - head.x) < 0.2 && minY < head.y - eps) return true;
    }
    return false;
  }

  handleArrowClick(arrow, gElement) {
    if (this.isAnimating) return;

    if (this.isArrowBlocked(arrow)) {
      // Blocked Feedback
      this.audio.playBlocked();
      gElement.classList.add('shake-error');
      setTimeout(() => gElement.classList.remove('shake-error'), 450);
      return;
    }

    // Unblocked: Fly off the board!
    this.isAnimating = true;
    this.audio.playWhoosh();
    this.moveCount++;
    this.score += 25;
    this.updateStats();

    // Store for Undo
    this.moveHistory.push({ arrow, element: gElement });

    // Animate exit
    let deltaX = 0, deltaY = 0;
    const distance = 580;
    if (arrow.direction === 'right') deltaX = distance;
    else if (arrow.direction === 'left') deltaX = -distance;
    else if (arrow.direction === 'down') deltaY = distance;
    else if (arrow.direction === 'up') deltaY = -distance;

    gElement.style.transition = 'transform 0.38s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.38s ease-out';
    gElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    gElement.style.opacity = '0';

    setTimeout(() => {
      gElement.remove();
      this.activeArrows = this.activeArrows.filter(a => a.id !== arrow.id);
      this.isAnimating = false;

      // Check Victory
      if (this.activeArrows.length === 0) {
        this.handleLevelWin();
      }
    }, 390);
  }

  handleLevelWin() {
    this.audio.playVictory();
    this.score += 150;
    this.updateStats();

    // Supabase Cloud Sync
    if (window.cloudBackend) {
      window.cloudBackend.submitScore(this.score, true, 80);
    }

    // Show Victory Modal
    const modal = document.getElementById('victory-modal');
    if (modal) {
      document.getElementById('modal-win-score').textContent = this.score;
      document.getElementById('modal-win-moves').textContent = this.moveCount;
      modal.classList.add('show');
    }
  }

  nextLevel() {
    if (this.currentMode === 'main') {
      this.currentLevelIndex++;
      this.loadLevel(this.currentLevelIndex);
    } else {
      this.loadRandomLevel();
    }
  }

  showHint() {
    this.audio.playClick();
    const readyArrow = this.activeArrows.find(a => !this.isArrowBlocked(a));
    if (readyArrow) {
      const g = this.svgBoard.querySelector(`[data-id="${readyArrow.id}"]`);
      if (g) {
        g.classList.add('hint-glow');
        setTimeout(() => g.classList.remove('hint-glow'), 1200);
      }
    }
  }

  undoMove() {
    if (this.moveHistory.length === 0 || this.isAnimating) return;
    this.audio.playClick();
    const last = this.moveHistory.pop();
    this.activeArrows.push(last.arrow);
    this.moveCount = Math.max(0, this.moveCount - 1);
    this.score = Math.max(0, this.score - 25);
    this.updateStats();
    this.renderBoard();
  }

  updateStats() {
    if (this.movesEl) this.movesEl.textContent = this.moveCount;
    if (this.scoreEl) this.scoreEl.textContent = this.score;
  }

  openLeaderboard() {
    this.audio.playClick();
    const modal = document.getElementById('leaderboard-modal');
    const listEl = document.getElementById('leaderboard-list');
    if (!modal || !listEl) return;

    modal.classList.add('show');
    listEl.innerHTML = '<div class="loading-spinner">Loading global rankings...</div>';

    if (window.cloudBackend) {
      window.cloudBackend.getLeaderboard(25).then(players => {
        if (!players || players.length === 0) {
          listEl.innerHTML = '<div class="empty-state">No rankings yet. Play a round to rank #1!</div>';
          return;
        }

        listEl.innerHTML = players.map((p, idx) => `
          <div class="leaderboard-row ${idx === 0 ? 'rank-1' : ''}">
            <div class="row-rank">#${idx + 1}</div>
            <div class="row-name">${p.username || 'Archer'}</div>
            <div class="row-tier tier-${(p.rank_tier || 'bronze').toLowerCase()}">${p.rank_tier || 'Bronze'}</div>
            <div class="row-score">${(p.high_score || 0).toLocaleString()} PTS</div>
          </div>
        `).join('');
      });
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', async () => {
  if (window.cloudBackend) {
    const prof = await window.cloudBackend.init();
    if (prof) {
      const userEl = document.getElementById('player-username-display');
      if (userEl) userEl.textContent = prof.username;
    }
  }
  window.game = new ArrowsGoGame();
  window.game.init();
});
