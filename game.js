// =========================================================================
// ARROWS PUZZLE - GAME ENGINE (EASYBRAIN STYLE)
// Features: Circuit Board SVG, 4 Tiers, 3 Hearts/Mistakes, Stars, Auth, Sound
// =========================================================================

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
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(820, now + 0.24);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  playBlocked() {
    if (this.isMuted) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.setValueAtTime(110, now + 0.08);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  playVictory() {
    if (this.isMuted) return;
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime + (i * 0.08);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.48);
    });
  }

  playClick() {
    if (this.isMuted) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }
}

class ArrowPuzzleGame {
  constructor() {
    this.audio = new AudioEngine();
    this.currentTier = 'medium'; // 'easy' | 'medium' | 'hard' | 'complex'
    this.currentLevelNum = 1;
    this.currentLevel = null;
    this.activeArrows = [];
    this.moveHistory = [];
    this.moveCount = 0;
    this.score = 0;
    this.lives = 3;
    this.maxLives = 3;
    this.isAnimating = false;

    // DOM Elements
    this.svgBoard = document.getElementById('puzzle-svg');
    this.levelBadge = document.getElementById('current-level-badge');
    this.tierBadge = document.getElementById('current-tier-badge');
    this.movesEl = document.getElementById('stat-moves');
    this.scoreEl = document.getElementById('stat-score');
    this.heartsEl = document.getElementById('hearts-container');

    this.initEvents();
  }

  init() {
    this.loadLevel(this.currentTier, this.currentLevelNum);
    this.updateUserNavbar();
  }

  initEvents() {
    // Mode Selection Buttons (Main Route, Random, Challenge)
    document.querySelectorAll('.mode-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.audio.playClick();
        document.querySelectorAll('.mode-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        if (mode === 'main') {
          this.loadLevel(this.currentTier, 1);
        } else if (mode === 'random') {
          this.loadLevel(this.currentTier, Math.floor(Math.random() * 20) + 1);
        } else if (mode === 'challenge') {
          this.loadLevel('hard', 1);
        }
      });
    });

    // Tier Selection Buttons
    document.querySelectorAll('.tier-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.audio.playClick();
        document.querySelectorAll('.tier-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTier = btn.dataset.tier;
        this.currentLevelNum = 1;
        this.loadLevel(this.currentTier, this.currentLevelNum);
      });
    });

    // Action Controls
    document.getElementById('btn-hint')?.addEventListener('click', () => this.showHint());
    document.getElementById('btn-undo')?.addEventListener('click', () => this.undoMove());
    document.getElementById('btn-reset')?.addEventListener('click', () => {
      this.audio.playClick();
      this.loadLevel(this.currentTier, this.currentLevelNum);
    });

    // Modals Triggers
    document.getElementById('btn-open-levels')?.addEventListener('click', () => this.openLevelSelectModal());
    document.getElementById('btn-close-levels')?.addEventListener('click', () => this.closeModal('levels-modal'));

    document.getElementById('btn-open-leaderboard')?.addEventListener('click', () => this.openLeaderboardModal());
    document.getElementById('btn-close-leaderboard')?.addEventListener('click', () => this.closeModal('leaderboard-modal'));

    document.getElementById('btn-open-auth')?.addEventListener('click', () => this.openAuthModal());
    document.getElementById('btn-close-auth')?.addEventListener('click', () => this.closeModal('auth-modal'));

    document.getElementById('btn-next-level')?.addEventListener('click', () => {
      this.audio.playClick();
      this.closeModal('victory-modal');
      this.nextLevel();
    });

    document.getElementById('btn-retry-level')?.addEventListener('click', () => {
      this.audio.playClick();
      this.closeModal('gameover-modal');
      this.loadLevel(this.currentTier, this.currentLevelNum);
    });

    // Auth Actions
    document.getElementById('btn-google-login')?.addEventListener('click', () => {
      window.supabaseService.signInWithGoogle();
    });

    document.getElementById('btn-submit-email-auth')?.addEventListener('click', async () => {
      const email = document.getElementById('auth-email').value;
      const pwd = document.getElementById('auth-password').value;
      const uname = document.getElementById('auth-username').value;
      const isSignup = document.getElementById('auth-tab-signup').classList.contains('active');

      if (!email || !pwd) {
        alert("Please enter email and password");
        return;
      }

      if (isSignup) {
        const res = await window.supabaseService.signUpWithEmail(email, pwd, uname);
        if (res.success) {
          alert("Account created successfully!");
          this.closeModal('auth-modal');
          this.updateUserNavbar();
        } else {
          alert("Sign up error: " + res.error);
        }
      } else {
        const res = await window.supabaseService.signInWithEmail(email, pwd);
        if (res.success) {
          this.closeModal('auth-modal');
          this.updateUserNavbar();
        } else {
          alert("Login error: " + res.error);
        }
      }
    });

    // Switch Sign In / Sign Up tabs
    document.getElementById('auth-tab-signin')?.addEventListener('click', (e) => {
      e.target.classList.add('active');
      document.getElementById('auth-tab-signup').classList.remove('active');
      document.getElementById('auth-username-group').style.display = 'none';
      document.getElementById('btn-submit-email-auth').textContent = 'Sign In';
    });

    document.getElementById('auth-tab-signup')?.addEventListener('click', (e) => {
      e.target.classList.add('active');
      document.getElementById('auth-tab-signin').classList.remove('active');
      document.getElementById('auth-username-group').style.display = 'block';
      document.getElementById('btn-submit-email-auth').textContent = 'Create Account';
    });

    // Sign Out
    document.getElementById('btn-signout')?.addEventListener('click', async () => {
      await window.supabaseService.signOut();
      this.updateUserNavbar();
    });

    // Sound toggle
    document.getElementById('btn-sound-toggle')?.addEventListener('click', (e) => {
      this.audio.isMuted = !this.audio.isMuted;
      e.currentTarget.textContent = this.audio.isMuted ? '🔇' : '🔊';
    });

    // Share button
    document.getElementById('btn-share')?.addEventListener('click', () => {
      this.audio.playClick();
      navigator.clipboard.writeText(window.location.href);
      const toast = document.getElementById('share-toast');
      if (toast) {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
      }
    });
  }

  loadLevel(tier, levelNum) {
    this.currentTier = tier;
    this.currentLevelNum = levelNum;
    this.currentLevel = getLevel(tier, levelNum);
    this.activeArrows = [...this.currentLevel.arrows];
    this.moveHistory = [];
    this.moveCount = 0;
    this.lives = this.maxLives;

    if (this.levelBadge) this.levelBadge.textContent = `LEVEL ${levelNum}`;
    if (this.tierBadge) {
      this.tierBadge.textContent = tier.toUpperCase();
      this.tierBadge.className = `tier-badge badge-${tier}`;
    }

    this.updateStats();
    this.renderBoard();
  }

  renderBoard() {
    if (!this.svgBoard) return;
    this.svgBoard.innerHTML = '';

    const boardWidth = 520;
    const boardHeight = 520;
    const gridSize = this.currentLevel.gridSize || 8;
    const padding = 34;
    const step = (boardWidth - padding * 2) / (gridSize - 1);

    // 1. Draw Subtle Dot Matrix (arrowsgo.io exact style)
    const dotsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    dotsGroup.setAttribute('class', 'grid-dots');
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', padding + c * step);
        dot.setAttribute('cy', padding + r * step);
        dot.setAttribute('r', '2.6');
        dot.setAttribute('fill', '#7a9bd0');
        dot.setAttribute('opacity', '0.55');
        dotsGroup.appendChild(dot);
      }
    }
    this.svgBoard.appendChild(dotsGroup);

    // 2. Draw Circuit Arrows
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

    // Build Path
    let d = '';
    arrow.points.forEach((pt, i) => {
      const x = padding + pt.x * step;
      const y = padding + pt.y * step;
      d += (i === 0 ? `M ${x} ${y} ` : `L ${x} ${y} `);
    });

    // Path Line
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', '#0f172a');
    path.setAttribute('stroke-width', '4.5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('fill', 'none');
    g.appendChild(path);

    // Tail Circle Node (Easybrain signature circuit look)
    const startPt = arrow.points[0];
    const tailDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    tailDot.setAttribute('cx', padding + startPt.x * step);
    tailDot.setAttribute('cy', padding + startPt.y * step);
    tailDot.setAttribute('r', '5');
    tailDot.setAttribute('fill', '#0f172a');
    g.appendChild(tailDot);

    // Arrowhead at Head
    const headPt = arrow.points[arrow.points.length - 1];
    const hx = padding + headPt.x * step;
    const hy = padding + headPt.y * step;
    const head = this.createArrowHead(hx, hy, arrow.direction);
    g.appendChild(head);

    // Optional Node Marker
    if (arrow.hasNode && arrow.nodePos) {
      const nx = padding + arrow.nodePos.x * step;
      const ny = padding + arrow.nodePos.y * step;
      const token = this.createNodeToken(nx, ny);
      g.appendChild(token);
    }

    // Tap Event
    g.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleArrowTap(arrow, g);
    });

    return g;
  }

  createArrowHead(x, y, dir) {
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const size = 9;
    let pts = '';

    if (dir === 'right') {
      pts = `${x},${y} ${x - size * 1.5},${y - size} ${x - size},${y} ${x - size * 1.5},${y + size}`;
    } else if (dir === 'left') {
      pts = `${x},${y} ${x + size * 1.5},${y - size} ${x + size},${y} ${x + size * 1.5},${y + size}`;
    } else if (dir === 'down') {
      pts = `${x},${y} ${x - size},${y - size * 1.5} ${x},${y - size} ${x + size},${y - size * 1.5}`;
    } else { // 'up'
      pts = `${x},${y} ${x - size},${y + size * 1.5} ${x},${y + size} ${x + size},${y + size * 1.5}`;
    }

    poly.setAttribute('points', pts);
    poly.setAttribute('fill', '#0f172a');
    return poly;
  }

  createNodeToken(x, y) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'node-token');

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', '12');
    circle.setAttribute('fill', '#fef08a');
    circle.setAttribute('stroke', '#eab308');
    circle.setAttribute('stroke-width', '2.5');

    const dot1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot1.setAttribute('cx', x - 3.5);
    dot1.setAttribute('cy', y);
    dot1.setAttribute('r', '1.6');
    dot1.setAttribute('fill', '#854d0e');

    const dot2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot2.setAttribute('cx', x + 3.5);
    dot2.setAttribute('cy', y);
    dot2.setAttribute('r', '1.6');
    dot2.setAttribute('fill', '#854d0e');

    g.appendChild(circle);
    g.appendChild(dot1);
    g.appendChild(dot2);
    return g;
  }

  // --- COLLISION RAYCASTER ---
  isArrowBlocked(arrow) {
    const head = arrow.points[arrow.points.length - 1];
    const dir = arrow.direction;
    const eps = 0.05;

    for (const other of this.activeArrows) {
      if (other.id === arrow.id) continue;

      for (let i = 0; i < other.points.length - 1; i++) {
        const p1 = other.points[i];
        const p2 = other.points[i + 1];

        if (this.rayIntersectsSegment(head, dir, p1, p2, eps)) {
          return true; // Blocked!
        }
      }
    }
    return false; // Free!
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

  handleArrowTap(arrow, gElement) {
    if (this.isAnimating) return;

    if (this.isArrowBlocked(arrow)) {
      // Mistake! Lose a life
      this.audio.playBlocked();
      this.lives = Math.max(0, this.lives - 1);
      this.updateStats();

      // Shake animation
      gElement.classList.add('shake-error');
      setTimeout(() => gElement.classList.remove('shake-error'), 450);

      // Check Game Over
      if (this.lives <= 0) {
        setTimeout(() => this.handleGameOver(), 500);
      }
      return;
    }

    // Success! Smooth exit
    this.isAnimating = true;
    this.audio.playWhoosh();
    this.moveCount++;
    this.score += 30;
    this.updateStats();

    this.moveHistory.push({ arrow, element: gElement });

    let deltaX = 0, deltaY = 0;
    const dist = 600;
    if (arrow.direction === 'right') deltaX = dist;
    else if (arrow.direction === 'left') deltaX = -dist;
    else if (arrow.direction === 'down') deltaY = dist;
    else if (arrow.direction === 'up') deltaY = -dist;

    gElement.style.transition = 'transform 0.38s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.38s ease-out';
    gElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    gElement.style.opacity = '0';

    setTimeout(() => {
      gElement.remove();
      this.activeArrows = this.activeArrows.filter(a => a.id !== arrow.id);
      this.isAnimating = false;

      // Check Victory
      if (this.activeArrows.length === 0) {
        this.handleVictory();
      }
    }, 390);
  }

  handleVictory() {
    this.audio.playVictory();

    // Calculate Stars
    let stars = 3;
    if (this.lives === 2) stars = 2;
    if (this.lives === 1) stars = 1;

    // Bonus based on tier
    let tierBonus = { easy: 50, medium: 120, hard: 250, complex: 500 }[this.currentTier] || 100;
    this.score += tierBonus;
    this.updateStats();

    // Save Stars
    window.supabaseService.saveLevelStars(this.currentTier, this.currentLevelNum, stars);

    // Cloud Sync
    window.supabaseService.submitScore(this.score, true, tierBonus);

    // Show Victory Modal
    const modal = document.getElementById('victory-modal');
    if (modal) {
      document.getElementById('modal-win-score').textContent = this.score;
      document.getElementById('modal-win-moves').textContent = this.moveCount;
      document.getElementById('modal-win-stars').textContent = '⭐'.repeat(stars);
      modal.classList.add('show');
    }
  }

  handleGameOver() {
    const modal = document.getElementById('gameover-modal');
    if (modal) modal.classList.add('show');
  }

  nextLevel() {
    this.currentLevelNum++;
    this.loadLevel(this.currentTier, this.currentLevelNum);
  }

  showHint() {
    this.audio.playClick();
    const ready = this.activeArrows.find(a => !this.isArrowBlocked(a));
    if (ready) {
      const g = this.svgBoard.querySelector(`[data-id="${ready.id}"]`);
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
    this.score = Math.max(0, this.score - 30);
    this.updateStats();
    this.renderBoard();
  }

  updateStats() {
    if (this.movesEl) this.movesEl.textContent = this.moveCount;
    if (this.scoreEl) this.scoreEl.textContent = this.score;

    // Hearts display
    if (this.heartsEl) {
      let heartsHtml = '';
      for (let i = 0; i < this.maxLives; i++) {
        heartsHtml += (i < this.lives) ? '<span class="heart active">❤️</span>' : '<span class="heart lost">🖤</span>';
      }
      this.heartsEl.innerHTML = heartsHtml;
    }
  }

  updateUserNavbar() {
    const prof = window.supabaseService.profile;
    const user = window.supabaseService.currentUser;

    const nameEl = document.getElementById('nav-username');
    const tierEl = document.getElementById('nav-user-tier');
    const authBtn = document.getElementById('btn-open-auth');
    const signoutBtn = document.getElementById('btn-signout');

    if (prof) {
      if (nameEl) nameEl.textContent = prof.username || 'Archer';
      if (tierEl) {
        tierEl.textContent = prof.rank_tier || 'Bronze';
        tierEl.className = `user-tier-pill tier-${(prof.rank_tier || 'bronze').toLowerCase()}`;
      }
    }

    if (user) {
      if (authBtn) authBtn.style.display = 'none';
      if (signoutBtn) signoutBtn.style.display = 'block';
    } else {
      if (authBtn) authBtn.style.display = 'block';
      if (signoutBtn) signoutBtn.style.display = 'none';
    }
  }

  // --- MODALS ---
  openLevelSelectModal() {
    this.audio.playClick();
    const modal = document.getElementById('levels-modal');
    const grid = document.getElementById('levels-grid');
    if (!modal || !grid) return;

    modal.classList.add('show');
    grid.innerHTML = '';

    // Render 12 levels for current tier
    for (let i = 1; i <= 12; i++) {
      const stars = window.supabaseService.getLevelStars(this.currentTier, i);
      const isCurrent = (i === this.currentLevelNum);

      const card = document.createElement('div');
      card.className = `level-card ${isCurrent ? 'current' : ''} ${stars > 0 ? 'cleared' : ''}`;
      card.innerHTML = `
        <div class="lvl-num">Level ${i}</div>
        <div class="lvl-stars">${stars > 0 ? '⭐'.repeat(stars) : '☆☆☆'}</div>
      `;
      card.addEventListener('click', () => {
        this.audio.playClick();
        this.closeModal('levels-modal');
        this.loadLevel(this.currentTier, i);
      });
      grid.appendChild(card);
    }
  }

  openLeaderboardModal() {
    this.audio.playClick();
    const modal = document.getElementById('leaderboard-modal');
    const list = document.getElementById('leaderboard-list');
    if (!modal || !list) return;

    modal.classList.add('show');
    list.innerHTML = '<div class="loading-spinner">Loading global rankings...</div>';

    window.supabaseService.getLeaderboard(25).then(players => {
      if (!players || players.length === 0) {
        list.innerHTML = '<div class="empty-state">No rankings yet. Play a level to rank #1!</div>';
        return;
      }

      list.innerHTML = players.map((p, idx) => `
        <div class="leaderboard-row ${idx === 0 ? 'rank-1' : ''}">
          <div class="row-rank">#${idx + 1}</div>
          <div class="row-name">${p.username || 'Archer'}</div>
          <div class="row-tier tier-${(p.rank_tier || 'bronze').toLowerCase()}">${p.rank_tier || 'Bronze'}</div>
          <div class="row-score">${(p.high_score || 0).toLocaleString()} PTS</div>
        </div>
      `).join('');
    });
  }

  openAuthModal() {
    this.audio.playClick();
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('show');
  }

  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('show');
  }
}

// Global Startup
window.addEventListener('DOMContentLoaded', async () => {
  await window.supabaseService.init();
  window.game = new ArrowPuzzleGame();
  window.game.init();

  window.addEventListener('auth-state-changed', () => {
    if (window.game) window.game.updateUserNavbar();
  });
});
