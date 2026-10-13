// =========================================================================
// ARROWS PUZZLE - HTML5 CANVAS ENGINE (AUTHENTIC ARROWSGO.IO REPLICA)
// Features: High-DPI Canvas, Manhattan Raycast Grid, Slithering Runouts,
//           Precision Chevrons, 4 Tiers, 3 Hearts, Synthesizer Audio, Supabase
// =========================================================================

const DESIGN_WIDTH = 750;
const DESIGN_HEIGHT = 1334;

const VISUAL_THEME = {
  gridDot: '#6f94d0',
  mono: '#0f172a',
  arrows: [
    '#1ba784', '#ed5126', '#2A52BE', '#96c24e', '#f9595c', '#fc8c23', 
    '#4A7856', '#C77DFF', '#577590', '#F9C74F', '#43AA8B', '#E63946', 
    '#4CC9F0', '#194B96', '#FFD166', '#7209B7', '#F72585'
  ]
};

// --- AUDIO SYNTHESIZER ENGINE (Web Audio API) ---
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.streak = 0;
    this.lastSuccessTime = 0;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playTone(config) {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const startAt = ctx.currentTime + 0.002;
      const duration = Math.max(config.duration || 0.045, 0.02);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = config.type || 'square';
      osc.frequency.setValueAtTime(Math.max(config.frequency || 440, 80), startAt);
      if (config.endFrequency) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(config.endFrequency, 80), startAt + duration);
      }

      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(config.gain || 0.03, startAt + Math.min(config.attack || 0.004, duration * 0.35));
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + duration + 0.01);
    } catch (_) {}
  }

  playSuccessSound() {
    const now = Date.now();
    if (now - this.lastSuccessTime > 1200) this.streak = 0;
    this.streak = Math.min(this.streak + 1, 8);
    this.lastSuccessTime = now;

    this.playTone({
      type: 'square',
      frequency: 540 + this.streak * 42,
      endFrequency: 560 + this.streak * 44,
      duration: 0.052,
      attack: 0.003,
      gain: 0.028
    });
  }

  playErrorSound() {
    this.streak = 0;
    this.lastSuccessTime = 0;
    this.playTone({
      type: 'sawtooth',
      frequency: 260,
      endFrequency: 178,
      duration: 0.088,
      attack: 0.003,
      gain: 0.036
    });
  }

  playVictorySound() {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone({
          type: 'sine',
          frequency: freq,
          duration: 0.35,
          gain: 0.04
        });
      }, i * 90);
    });
  }

  playClick() {
    this.playTone({
      type: 'sine',
      frequency: 720,
      duration: 0.025,
      gain: 0.015
    });
  }
}

// --- OFFICIAL PUZZLE MAP (Manhattan Grid Matrix) ---
class PuzzleMap {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.currentDataString = '';
    this.user_data = [];
    this.arrowDataArray = [];
    this.max_life = 3;
    this.current_life = 3;
  }

  static CreateMapByStr(value) {
    if (!value || !value.length) return null;
    const parts = value.split(';');
    if (parts.length !== 3) return null;
    const map = new PuzzleMap();
    map.currentDataString = value;
    map.width = parseInt(parts[0], 10);
    map.height = parseInt(parts[1], 10);
    map.loadData();
    return map;
  }

  getDirection(from, to) {
    const fx = from[0], fy = from[1], tx = to[0], ty = to[1];
    return fx === tx ? (fy > ty ? 0 : 2) : fy === ty ? (fx > tx ? 3 : 1) : -1;
  }

  loadData() {
    this.user_data = [];
    this.arrowDataArray = [];
    for (let row = 0; row < this.height; row++) {
      this.user_data.push(new Int32Array(this.width));
    }
    const parts = this.currentDataString.split(';');
    if (parts.length === 3) {
      const width = parseInt(parts[0], 10);
      const pathStrings = parts[2].split('|');
      for (let i = 0; i < pathStrings.length; i++) {
        const pathCells = pathStrings[i].split(',');
        if (!pathCells.length) continue;
        const path = [];
        for (let j = 0; j < pathCells.length; j++) {
          const encoded = parseInt(pathCells[j], 10);
          const x = Math.floor(encoded % width);
          const y = Math.floor(encoded / width);
          path.push([x, y]);
        }
        if (path.length >= 2) {
          this.arrowDataArray.push({
            path: path,
            direction: this.getDirection(path[path.length - 2], path[path.length - 1]),
            has_runout: false,
            animation_index: 0
          });
        }
      }
    }
    this.updateUserDataFromArrowData();
    this.current_life = this.max_life;
  }

  updateUserDataFromArrowData() {
    for (let row = 0; row < this.height; row++) {
      this.user_data[row].fill(0);
    }
    for (let i = 0; i < this.arrowDataArray.length; i++) {
      const arrow = this.arrowDataArray[i];
      if (arrow.has_runout) continue;
      for (let j = 0; j < arrow.path.length; j++) {
        const point = arrow.path[j];
        this.user_data[point[1]][point[0]] = 10000 + i;
      }
    }
  }

  isViablePosition(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  getUserData(x, y) {
    return this.isViablePosition(x, y) ? this.user_data[y][x] : 0;
  }

  canRunOut(point, direction, data) {
    if (!point || point.length !== 2) return false;
    const x = point[0], y = point[1];
    if (direction === 0) { // UP
      if (y === 0) return true;
      for (let row = y - 1; row >= 0; row--) {
        if (data[row][x] > 0) return false;
      }
    } else if (direction === 1) { // RIGHT
      if (x === this.width - 1) return true;
      for (let col = x + 1; col < this.width; col++) {
        if (data[y][col] > 0) return false;
      }
    } else if (direction === 2) { // DOWN
      if (y === this.height - 1) return true;
      for (let down = y + 1; down < this.height; down++) {
        if (data[down][x] > 0) return false;
      }
    } else if (direction === 3) { // LEFT
      if (x === 0) return true;
      for (let left = x - 1; left >= 0; left--) {
        if (data[y][left] > 0) return false;
      }
    }
    return true;
  }

  userAction(index) {
    const x = Math.floor(index % this.width);
    const y = Math.floor(index / this.width);
    if (!this.isViablePosition(x, y)) return -1;
    const arrowIndex = this.user_data[y][x] - 10000;
    if (arrowIndex >= 0 && arrowIndex < this.arrowDataArray.length) {
      const arrow = this.arrowDataArray[arrowIndex];
      if (arrow.has_runout) return -1;
      const last = arrow.path[arrow.path.length - 1];
      if (this.canRunOut(last, arrow.direction, this.user_data)) {
        return arrowIndex;
      } else {
        this.current_life--;
        return -99; // Blocked error
      }
    }
    return -1;
  }

  arrowRunOut(index) {
    if (index < 0 || index >= this.arrowDataArray.length) return null;
    const arrow = this.arrowDataArray[index];
    arrow.has_runout = true;
    arrow.animation_index = 0;
    this.updateUserDataFromArrowData();
    return arrow;
  }

  hasFinished() {
    for (let i = 0; i < this.arrowDataArray.length; i++) {
      if (!this.arrowDataArray[i].has_runout) return false;
    }
    return true;
  }

  hasFailed() {
    return this.current_life <= 0;
  }
}

// --- CANVAS 2D RENDERER (arrowsgo.io exact visual representation) ---
class CanvasGameRenderer {
  constructor(canvas, container, gameApp) {
    this.canvas = canvas;
    this.container = container;
    this.gameApp = gameApp;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.map = null;
    this.runoutArray = [];
    this.animateGridLen = 3;
    this.animateDuration = 0.008;
    this.totalDt = 0;
    this.lastWidth = 0;
    this.lastHeight = 0;
    this.dpr = 1;
    this.errorHighlightIndex = -1;
    this.errorHighlightUntil = 0;
    this.hintHighlightIndex = -1;
    this.hintHighlightUntil = 0;

    this.bindEvents();
    this.resize();
  }

  bindEvents() {
    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const pt = this.getCanvasPoint(e);
      const gridIndex = this.getGridIndexWithTolerance(pt);
      if (gridIndex >= 0) {
        this.gameApp.handleCellTap(gridIndex);
      }
    });

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    const width = Math.max(260, Math.round(this.container.clientWidth || rect.width || 480));
    const height = Math.max(260, Math.round(this.container.clientHeight || rect.height || width));
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));

    this.lastWidth = width;
    this.lastHeight = height;
    this.dpr = dpr;

    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);

    this.draw();
  }

  getCanvasPoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  getLayout() {
    if (!this.map) return null;
    const cols = this.map.width;
    const rows = this.map.height;
    const cell = Math.min(0.96 * this.lastWidth / cols, 0.96 * this.lastHeight / rows);
    return {
      cols,
      rows,
      cell,
      left: (this.lastWidth - cell * cols) / 2,
      top: (this.lastHeight - cell * rows) / 2
    };
  }

  getCellCenter(layout, point) {
    return {
      x: layout.left + layout.cell * (point[0] + 0.5),
      y: layout.top + layout.cell * (point[1] + 0.5)
    };
  }

  getGridIndexAtPoint(pt) {
    const layout = this.getLayout();
    if (!layout) return -1;
    const col = Math.floor((pt.x - layout.left) / layout.cell);
    const row = Math.floor((pt.y - layout.top) / layout.cell);
    return (col >= 0 && col < this.map.width && row >= 0 && row < this.map.height)
      ? row * this.map.width + col
      : -1;
  }

  getGridIndexWithTolerance(pt) {
    const direct = this.getGridIndexAtPoint(pt);
    if (this.isOccupied(direct)) return direct;

    const layout = this.getLayout();
    if (!layout) return -1;
    const radius = Math.max(4, layout.cell * 0.28);
    const offsets = [
      [0, 0], [radius, 0], [-radius, 0], [0, radius], [0, -radius],
      [radius, radius], [radius, -radius], [-radius, radius], [-radius, -radius]
    ];
    for (const off of offsets) {
      const candidate = { x: pt.x + off[0], y: pt.y + off[1] };
      const idx = this.getGridIndexAtPoint(candidate);
      if (this.isOccupied(idx)) return idx;
    }
    return direct;
  }

  isOccupied(gridIndex) {
    if (!this.map || gridIndex < 0) return false;
    const col = gridIndex % this.map.width;
    const row = Math.floor(gridIndex / this.map.width);
    return this.map.getUserData(col, row) > 0;
  }

  setMap(map) {
    this.map = map;
    this.runoutArray = [];
    this.totalDt = 0;
    this.errorHighlightIndex = -1;
    this.errorHighlightUntil = 0;
    this.hintHighlightIndex = -1;
    this.hintHighlightUntil = 0;
    this.resize();
  }

  markError(index) {
    this.errorHighlightIndex = index;
    this.errorHighlightUntil = Date.now() + 620;
    this.draw();
  }

  markHint(index) {
    this.hintHighlightIndex = index;
    this.hintHighlightUntil = Date.now() + 2600;
    this.draw();
  }

  calcArrowPoints(direction, tipPoint, size) {
    const first = { x: tipPoint.x, y: tipPoint.y };
    const second = { x: tipPoint.x, y: tipPoint.y };
    const half = size / 2;
    if (direction === 0) { // UP
      first.x -= half; first.y += size;
      second.x += half; second.y += size;
    } else if (direction === 1) { // RIGHT
      first.x -= size; first.y -= half;
      second.x -= size; second.y += half;
    } else if (direction === 2) { // DOWN
      first.x -= half; first.y -= size;
      second.x += half; second.y -= size;
    } else { // LEFT
      first.x += size; first.y -= half;
      second.x += size; second.y += half;
    }
    return [first, second];
  }

  getArrowHeadGeometry(tipPoint, direction, size) {
    const headPoints = this.calcArrowPoints(direction, tipPoint, size);
    return {
      headPoints,
      baseCenter: {
        x: (headPoints[0].x + headPoints[1].x) / 2,
        y: (headPoints[0].y + headPoints[1].y) / 2
      }
    };
  }

  getArrowJoinPoint(points, desiredPoint) {
    if (!points || points.length < 2) return desiredPoint;
    const previous = points[points.length - 2];
    const tip = points[points.length - 1];
    const dx = tip.x - previous.x;
    const dy = tip.y - previous.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq <= 0.0001) return desiredPoint;
    const projection = ((desiredPoint.x - previous.x) * dx + (desiredPoint.y - previous.y) * dy) / lenSq;
    const clamped = Math.min(Math.max(projection, 0.04), 0.94);
    return {
      x: previous.x + dx * clamped,
      y: previous.y + dy * clamped
    };
  }

  drawBoard(layout) {
    const ctx = this.ctx;
    const dotRadius = Math.max(layout.cols, layout.rows) >= 30 ? 2 : 2.7;
    ctx.fillStyle = 'rgba(111, 148, 208, 0.38)';

    for (let row = 0; row < layout.rows; row++) {
      for (let col = 0; col < layout.cols; col++) {
        ctx.beginPath();
        ctx.arc(
          layout.left + layout.cell * (col + 0.5),
          layout.top + layout.cell * (row + 0.5),
          dotRadius, 0, Math.PI * 2
        );
        ctx.fill();
      }
    }
  }

  drawPolyline(points, width, color) {
    if (!points || points.length < 2) return;
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
  }

  drawTriangle(tip, points, color) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.closePath();
    ctx.fill();
  }

  drawArrowFromPoints(index, points, direction) {
    const layout = this.getLayout();
    if (!layout || !points || points.length < 2) return;

    const isError = (index === this.errorHighlightIndex && Date.now() < this.errorHighlightUntil);
    const isHint = (index === this.hintHighlightIndex && Date.now() < this.hintHighlightUntil);

    let colorHex = '#0f172a'; // Default mono circuit (arrowsgo.io exact)
    if (isError) {
      colorHex = '#e24b4b';
    } else if (isHint) {
      colorHex = '#eab308';
    } else if (this.gameApp.colorMode === 'colorful') {
      colorHex = VISUAL_THEME.arrows[index % VISUAL_THEME.arrows.length];
    }

    const width = Math.min(Math.max(layout.cell * 0.242, 4.8), 12.8);
    const baseHead = Math.min(Math.max(layout.cell * 0.44, 9.5), 22.0);
    const headSize = (direction === 1 || direction === 3) ? baseHead * 1.12 : baseHead;

    const tipPoint = points[points.length - 1];
    const geometry = this.getArrowHeadGeometry(tipPoint, direction, headSize);
    const joinTarget = {
      x: geometry.baseCenter.x + (tipPoint.x - geometry.baseCenter.x) * 0.13,
      y: geometry.baseCenter.y + (tipPoint.y - geometry.baseCenter.y) * 0.13
    };
    const joinPoint = this.getArrowJoinPoint(points, joinTarget);

    // Trim shaft so it does not poke through the pointed arrowhead!
    const strokePoints = points.slice();
    strokePoints[strokePoints.length - 1] = joinPoint;

    // Soft subtle halo around arrow
    const softEdge = isError ? 'rgba(255, 177, 177, 0.38)' : 'rgba(15, 23, 42, 0.16)';
    this.drawPolyline(strokePoints, width + 1.2, softEdge);

    // Main arrow shaft with rounded joins
    this.drawPolyline(strokePoints, width, colorHex);

    // Seam welding circle
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(joinPoint.x, joinPoint.y, Math.max(width * 0.36, 1.5), 0, Math.PI * 2);
    ctx.fillStyle = colorHex;
    ctx.fill();

    // Sharp chevron arrowhead
    this.drawTriangle(tipPoint, geometry.headPoints, colorHex);
  }

  drawStaticArrow(index, arrowData) {
    if (!arrowData || arrowData.has_runout) return;
    const layout = this.getLayout();
    const points = arrowData.path.map(pt => this.getCellCenter(layout, pt));
    this.drawArrowFromPoints(index, points, arrowData.direction);
  }

  getSubGridPoint(point, progress, direction) {
    if (direction === 0) return [point[0], point[1] - progress];
    if (direction === 1) return [point[0] + progress, point[1]];
    if (direction === 2) return [point[0], point[1] + progress];
    return [point[0] - progress, point[1]];
  }

  buildRunoutPolyline(arrowData, tick) {
    const layout = this.getLayout();
    const path = arrowData.path;
    const direction = arrowData.direction;
    const step = Math.floor(tick / this.animateGridLen);
    const fraction = (tick % this.animateGridLen) / this.animateGridLen;
    const points = [];

    if (step < path.length - 1) {
      for (let i = step; i < path.length; i++) {
        const point = path[i];
        let gx = point[0], gy = point[1];
        if (i === step) {
          const nextPoint = path[i + 1];
          const stepDir = this.map.getDirection(point, nextPoint);
          const moved = this.getSubGridPoint(point, fraction, stepDir);
          gx = moved[0]; gy = moved[1];
        } else if (i === path.length - 1) {
          const exitMoved = this.getSubGridPoint(point, tick / this.animateGridLen, direction);
          gx = exitMoved[0]; gy = exitMoved[1];
        }
        points.push({
          x: layout.left + layout.cell * (gx + 0.5),
          y: layout.top + layout.cell * (gy + 0.5)
        });
      }
      return { points, finished: false };
    }

    const last = path[path.length - 1];
    const startExit = tick / this.animateGridLen - path.length + 1;
    const endExit = tick / this.animateGridLen;
    const startPt = this.getSubGridPoint(last, startExit, direction);
    const endPt = this.getSubGridPoint(last, endExit, direction);
    const from = { x: layout.left + layout.cell * (startPt[0] + 0.5), y: layout.top + layout.cell * (startPt[1] + 0.5) };
    const to = { x: layout.left + layout.cell * (endPt[0] + 0.5), y: layout.top + layout.cell * (endPt[1] + 0.5) };
    const margin = layout.cell * 1.5;
    const finished = from.x < -margin || from.x > this.lastWidth + margin || from.y < -margin || from.y > this.lastHeight + margin;
    return { points: [from, to], finished };
  }

  drawAnimatedArrow(index, arrowData) {
    const anim = this.buildRunoutPolyline(arrowData, arrowData.animation_index);
    if (anim.finished) return false;
    this.drawArrowFromPoints(index, anim.points, arrowData.direction);
    return true;
  }

  drawIntroGuide(layout) {
    // Pulse ring on the first unblocked arrow if on Intro / Quick Guide Level
    if (this.gameApp.currentTier !== 'easy' || this.gameApp.currentLevelNum !== 1 || !this.map) return;
    const arrows = this.map.arrowDataArray;
    if (!arrows || !arrows[0] || arrows[0].has_runout) return;

    const points = arrows[0].path.map(pt => this.getCellCenter(layout, pt));
    if (points.length < 2) return;
    const midIdx = Math.floor(points.length / 2);
    const center = points[midIdx];

    const pulse = (Math.sin(Date.now() / 220) + 1) / 2;
    const radius = Math.min(Math.max(layout.cell * (0.34 + pulse * 0.1), 12), 22);

    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 209, 102, ${0.18 + pulse * 0.08})`;
    ctx.fill();
    ctx.lineWidth = Math.min(Math.max(layout.cell * 0.1, 3), 5);
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.92)';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center.x, center.y, Math.min(Math.max(layout.cell * 0.12, 4), 7), 0, Math.PI * 2);
    ctx.fillStyle = '#fff3c4';
    ctx.fill();
    ctx.restore();
  }

  drawHintGuide(layout) {
    if (this.hintHighlightIndex < 0 || Date.now() > this.hintHighlightUntil || !this.map) return;
    const arrow = this.map.arrowDataArray[this.hintHighlightIndex];
    if (!arrow || arrow.has_runout) return;

    const points = arrow.path.map(pt => this.getCellCenter(layout, pt));
    const last = arrow.path[arrow.path.length - 1];
    const exitPt = this.getSubGridPoint(last, 1.8, arrow.direction);
    points.push({
      x: layout.left + layout.cell * (exitPt[0] + 0.5),
      y: layout.top + layout.cell * (exitPt[1] + 0.5)
    });

    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.min(Math.max(layout.cell * 0.14, 3.2), 5.5);
    ctx.strokeStyle = '#eab308';
    ctx.setLineDash([12, 8]);
    ctx.lineDashOffset = -((Date.now() / 45) % 20);
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    ctx.restore();
  }

  draw() {
    if (!this.map) return;
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;

    const layout = this.getLayout();
    if (!layout) return;

    this.drawBoard(layout);

    const arrows = this.map.arrowDataArray;
    for (let i = 0; i < arrows.length; i++) {
      if (!arrows[i].has_runout) {
        this.drawStaticArrow(i, arrows[i]);
      }
    }

    for (let j = 0; j < arrows.length; j++) {
      if (this.runoutArray.includes(arrows[j])) {
        this.drawAnimatedArrow(j, arrows[j]);
      }
    }

    this.drawIntroGuide(layout);
    this.drawHintGuide(layout);
  }

  update(dt) {
    if (this.runoutArray.length) {
      this.totalDt += dt;
      while (this.totalDt > this.animateDuration) {
        this.totalDt -= this.animateDuration;
        for (const arrow of this.runoutArray) {
          arrow.animation_index += 1;
        }
      }
      const active = [];
      for (const arrow of this.runoutArray) {
        if (!this.buildRunoutPolyline(arrow, arrow.animation_index).finished) {
          active.push(arrow);
        }
      }
      this.runoutArray = active;
      if (this.runoutArray.length === 0 && this.map.hasFinished()) {
        this.gameApp.handleVictory();
      }
      this.draw();
    } else if (this.hintHighlightIndex >= 0 || Date.now() < this.errorHighlightUntil) {
      this.draw();
    }
  }
}

// --- MAIN GAME APPLICATION CONTROLLER ---
class ArrowPuzzleGame {
  constructor() {
    this.audio = new AudioEngine();
    this.currentTier = 'easy'; // Starts with the authentic Intro / Quick Guide Level
    this.currentLevelNum = 1;
    this.currentMode = 'main'; // 'main' | 'random' | 'challenge'
    this.colorMode = 'mono';   // 'mono' (classic dark circuit matching arrowsgo.io) | 'colorful'
    this.moveCount = 0;
    this.score = 0;
    this.lives = 3;
    this.maxLives = 3;
    this.moveHistory = [];
    this.isLevelFinished = false;
    this.isGameOver = false;
    this.timerSeconds = 300;
    this.timerInterval = null;
    this.lastFrameTime = performance.now();

    // DOM Elements
    this.canvas = document.getElementById('GameCanvas');
    this.boardContainer = document.getElementById('board-container');
    this.levelBadge = document.getElementById('current-level-badge');
    this.tierBadge = document.getElementById('current-tier-badge');
    this.movesEl = document.getElementById('stat-moves');
    this.scoreEl = document.getElementById('stat-score');
    this.heartsEl = document.getElementById('hearts-container');

    this.renderer = new CanvasGameRenderer(this.canvas, this.boardContainer, this);

    this.initEvents();
    this.startLoop();
  }

  init() {
    this.loadLevel(this.currentTier, this.currentLevelNum);
    this.updateUserNavbar();
  }

  startLoop() {
    const loop = (now) => {
      try {
        const dt = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;
        this.renderer.update(Math.min(dt, 0.1));
      } catch (err) {
        console.warn("[Game loop update]:", err);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  initEvents() {
    // Mode Buttons (Main Route, Random, Challenge)
    document.querySelectorAll('.mode-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this.audio.playClick();
        document.querySelectorAll('.mode-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        this.currentMode = mode;
        if (mode === 'main') {
          this.stopTimer();
          this.loadLevel(this.currentTier, 1);
        } else if (mode === 'random') {
          this.stopTimer();
          this.loadRandomLevel();
        } else if (mode === 'challenge') {
          this.loadLevel('complex', 1);
          this.startChallengeTimer();
        }
      });
    });

    // Tier Buttons (Easy, Medium, Hard, Complex)
    document.querySelectorAll('.tier-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
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

    // Color Mode Toggle
    document.getElementById('btn-color-toggle')?.addEventListener('click', () => this.toggleColorMode());

    // Modal Triggers
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
    document.getElementById('user-pill-btn')?.addEventListener('click', () => {
      if (!window.supabaseService?.isLoggedIn?.()) {
        this.openAuthModal();
      }
    });

    // Instant Player Tag Login (Primary)
    document.getElementById('btn-submit-player-tag')?.addEventListener('click', async () => {
      const uname = document.getElementById('player-tag-name')?.value.trim();
      const pin = document.getElementById('player-tag-pin')?.value.trim();
      const errEl = document.getElementById('player-tag-error-msg');
      const btn = document.getElementById('btn-submit-player-tag');

      if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }

      if (!uname) {
        if (errEl) { errEl.textContent = 'Please enter your Player Name / Nickname'; errEl.style.display = 'block'; }
        else alert('Please enter your Player Name / Nickname');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Connecting to Supabase...';

      const res = await window.supabaseService.loginWithPlayerTag(uname, pin);
      btn.disabled = false;
      btn.textContent = '🚀 Play & Sync Profile';

      if (res.success) {
        this.closeModal('auth-modal');
        this.updateUserNavbar();
        alert(`Logged in as ${res.profile.username}! Your stats and scores are synced to Supabase.`);
      } else {
        if (errEl) { errEl.textContent = res.error || 'Login failed'; errEl.style.display = 'block'; }
        else alert(res.error || 'Login failed');
      }
    });

    document.getElementById('btn-google-login')?.addEventListener('click', async () => {
      const res = await window.supabaseService.signInWithGoogle();
      if (res && res.error) {
        const errEl = document.getElementById('player-tag-error-msg') || document.getElementById('auth-error-msg');
        if (errEl) {
          errEl.textContent = res.error.message || 'Google Provider is not enabled in your Supabase project yet. Please use Quick Player Login above!';
          errEl.style.display = 'block';
        }
      }
    });

    document.getElementById('btn-submit-email-auth')?.addEventListener('click', async () => {
      const email = document.getElementById('auth-email').value.trim();
      const pwd = document.getElementById('auth-password').value;
      const uname = document.getElementById('auth-username').value.trim();
      const isSignup = document.getElementById('auth-tab-signup').classList.contains('active');
      const errEl = document.getElementById('auth-error-msg');
      const submitBtn = document.getElementById('btn-submit-email-auth');

      if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }

      if (!email || !pwd) {
        if (errEl) { errEl.textContent = 'Please enter both email and password'; errEl.style.display = 'block'; }
        else alert("Please enter both email and password");
        return;
      }

      if (pwd.length < 6) {
        if (errEl) { errEl.textContent = 'Password must be at least 6 characters'; errEl.style.display = 'block'; }
        else alert("Password must be at least 6 characters");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Connecting...';

      if (isSignup) {
        const res = await window.supabaseService.signUpWithEmail(email, pwd, uname);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';

        if (res.success) {
          this.closeModal('auth-modal');
          this.updateUserNavbar();
          alert("Account created successfully! Welcome to Arrow-GO.");
        } else {
          if (errEl) { errEl.textContent = res.error || 'Sign up failed'; errEl.style.display = 'block'; }
          else alert("Sign up error: " + res.error);
        }
      } else {
        const res = await window.supabaseService.signInWithEmail(email, pwd);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';

        if (res.success) {
          this.closeModal('auth-modal');
          this.updateUserNavbar();
        } else {
          if (errEl) { errEl.textContent = res.error || 'Invalid email or password'; errEl.style.display = 'block'; }
          else alert("Login error: " + res.error);
        }
      }
    });

    document.getElementById('auth-tab-signin')?.addEventListener('click', (e) => {
      e.target.classList.add('active');
      document.getElementById('auth-tab-signup').classList.remove('active');
      document.getElementById('auth-username-group').style.display = 'none';
      document.getElementById('btn-submit-email-auth').textContent = 'Sign In';
      const errEl = document.getElementById('auth-error-msg');
      if (errEl) errEl.style.display = 'none';
    });

    document.getElementById('auth-tab-signup')?.addEventListener('click', (e) => {
      e.target.classList.add('active');
      document.getElementById('auth-tab-signin').classList.remove('active');
      document.getElementById('auth-username-group').style.display = 'block';
      document.getElementById('btn-submit-email-auth').textContent = 'Create Account';
      const errEl = document.getElementById('auth-error-msg');
      if (errEl) errEl.style.display = 'none';
    });

    document.getElementById('btn-signout')?.addEventListener('click', async () => {
      this.audio.playClick();
      await window.supabaseService.signOut();
      this.updateUserNavbar();
    });

    document.getElementById('btn-sound-toggle')?.addEventListener('click', (e) => {
      this.audio.isMuted = !this.audio.isMuted;
      e.currentTarget.textContent = this.audio.isMuted ? '🔇' : '🔊';
    });

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

  toggleColorMode() {
    this.colorMode = (this.colorMode === 'mono' ? 'colorful' : 'mono');
    const btn = document.getElementById('btn-color-toggle');
    if (btn) btn.textContent = this.colorMode === 'mono' ? '🎨' : '🖤';
    this.audio.playClick();
    this.renderer.draw();
  }

  loadLevel(tier, levelNum) {
    this.isLevelFinished = false;
    this.isGameOver = false;
    this.closeModal('victory-modal');
    this.closeModal('gameover-modal');
    this.closeModal('levels-modal');

    this.currentTier = tier;
    this.currentLevelNum = levelNum;
    const levelStr = window.getLevel(tier, levelNum);
    this.map = PuzzleMap.CreateMapByStr(levelStr);
    this.renderer.setMap(this.map);

    this.moveCount = 0;
    this.moveHistory = [];
    this.lives = this.maxLives;

    if (this.currentMode === 'challenge') {
      this.startChallengeTimer();
    }

    if (this.levelBadge) this.levelBadge.textContent = `LEVEL ${levelNum}`;
    if (this.tierBadge) {
      this.tierBadge.textContent = tier.toUpperCase();
      this.tierBadge.className = `tier-badge badge-${tier}`;
    }

    this.updateStats();
    this.renderer.draw();
  }

  loadRandomLevel() {
    this.isLevelFinished = false;
    this.isGameOver = false;
    this.closeModal('victory-modal');
    this.closeModal('gameover-modal');
    this.closeModal('levels-modal');

    this.currentLevelNum = Math.floor(Math.random() * 50) + 1;
    let width = 20, height = 20, target = 30, minL = 6, maxL = 18;
    if (this.currentTier === 'easy') { width = 14; height = 14; target = 16; minL = 5; maxL = 14; }
    else if (this.currentTier === 'hard') { width = 32; height = 32; target = 52; minL = 8; maxL = 22; }
    else if (this.currentTier === 'complex') { width = 44; height = 44; target = 80; minL = 10; maxL = 26; }

    const levelStr = window.generateArrowPuzzle(width, height, target, minL, maxL) || window.getLevel(this.currentTier, 1);
    this.map = PuzzleMap.CreateMapByStr(levelStr);
    this.renderer.setMap(this.map);
    this.moveCount = 0;
    this.moveHistory = [];
    this.lives = this.maxLives;

    if (this.levelBadge) this.levelBadge.textContent = `RANDOM`;
    this.updateStats();
    this.renderer.draw();
  }

  startChallengeTimer() {
    this.stopTimer();
    this.timerSeconds = 300;
    this.timerInterval = setInterval(() => {
      this.timerSeconds--;
      if (this.timerSeconds <= 0) {
        this.stopTimer();
        this.handleGameOver();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  handleCellTap(gridIndex) {
    if (!this.map || this.lives <= 0 || this.isLevelFinished || this.isGameOver) return;

    const result = this.map.userAction(gridIndex);
    if (result >= 0) {
      // Unblocked arrow!
      const runout = this.map.arrowRunOut(result);
      if (runout) {
        this.renderer.runoutArray.push(runout);
        this.moveHistory.push(result);
      }
      this.moveCount++;
      const tierMulti = { easy: 10, medium: 25, hard: 50, complex: 100 }[this.currentTier] || 20;
      this.score += tierMulti;

      this.audio.playSuccessSound();
      this.updateStats();
      this.renderer.draw();
    } else if (result === -99) {
      // Blocked move - mistake!
      this.lives = Math.max(0, this.map.current_life);
      const arrowIdx = this.map.getUserData(gridIndex % this.map.width, Math.floor(gridIndex / this.map.width)) - 10000;
      if (arrowIdx >= 0) this.renderer.markError(arrowIdx);

      this.audio.playErrorSound();
      this.flashStageError();
      this.updateStats();

      if (this.lives <= 0) {
        setTimeout(() => this.handleGameOver(), 350);
      }
    }
  }

  showHint() {
    if (!this.map) return;
    for (let i = 0; i < this.map.arrowDataArray.length; i++) {
      const arrow = this.map.arrowDataArray[i];
      if (arrow.has_runout) continue;
      const head = arrow.path[arrow.path.length - 1];
      if (this.map.canRunOut(head, arrow.direction, this.map.user_data)) {
        this.renderer.markHint(i);
        this.audio.playClick();
        return;
      }
    }
  }

  undoMove() {
    if (!this.map || this.moveHistory.length === 0) return;
    const lastIndex = this.moveHistory.pop();
    const arrow = this.map.arrowDataArray[lastIndex];
    if (arrow) {
      arrow.has_runout = false;
      arrow.animation_index = 0;
      this.map.updateUserDataFromArrowData();
      this.renderer.draw();
      this.audio.playClick();
    }
  }

  flashStageError() {
    if (this.boardContainer) {
      this.boardContainer.classList.remove('is-error-flash');
      void this.boardContainer.offsetWidth;
      this.boardContainer.classList.add('is-error-flash');
      setTimeout(() => this.boardContainer.classList.remove('is-error-flash'), 550);
    }
  }

  updateStats() {
    if (this.movesEl) this.movesEl.textContent = this.moveCount;
    if (this.scoreEl) this.scoreEl.textContent = this.score;

    if (this.heartsEl) {
      this.heartsEl.innerHTML = '';
      for (let i = 0; i < this.maxLives; i++) {
        const span = document.createElement('span');
        span.className = `heart ${i < this.lives ? 'active' : ''}`;
        span.textContent = i < this.lives ? '❤️' : '🖤';
        this.heartsEl.appendChild(span);
      }
    }
  }

  handleVictory() {
    if (this.isLevelFinished) return;
    this.isLevelFinished = true;
    this.stopTimer();
    this.audio.playVictorySound();

    if (this.boardContainer) {
      this.boardContainer.classList.add('is-success-flash');
      setTimeout(() => this.boardContainer.classList.remove('is-success-flash'), 600);
    }

    const mistakes = this.maxLives - this.lives;
    let stars = 3;
    if (mistakes === 1) stars = 2;
    else if (mistakes >= 2) stars = 1;

    const starsElem = document.getElementById('modal-win-stars') || document.getElementById('modal-stars');
    if (starsElem) starsElem.textContent = '⭐'.repeat(stars);
    const winMoves = document.getElementById('modal-win-moves');
    if (winMoves) winMoves.textContent = this.moveCount;
    const winScore = document.getElementById('modal-win-score');
    if (winScore) winScore.textContent = this.score;

    const modal = document.getElementById('victory-modal');
    if (modal) modal.classList.add('show');

    // Submit score to Supabase
    try {
      window.supabaseService?.submitLevelComplete?.(this.currentTier, this.currentLevelNum, this.score);
    } catch (e) {
      console.warn("[supabase submit error]:", e);
    }

    // Also notify ASP.NET Core Backend Web API
    try {
      fetch('/api/game/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: this.currentTier,
          levelNumber: this.currentLevelNum,
          score: this.score,
          moves: this.moveCount,
          userId: window.supabaseService?.currentUser?.id || null,
          username: window.supabaseService?.currentUser?.email?.split('@')[0] || 'Guest'
        })
      }).catch(() => {});
    } catch (e) {}
  }

  handleGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.stopTimer();
    const modal = document.getElementById('gameover-modal');
    if (modal) modal.classList.add('show');
  }

  nextLevel() {
    this.currentLevelNum++;
    if (this.currentLevelNum > 50) {
      this.currentLevelNum = 1;
    }
    this.loadLevel(this.currentTier, this.currentLevelNum);
  }

  openLevelSelectModal() {
    const grid = document.getElementById('levels-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const count = 50;

    for (let i = 1; i <= count; i++) {
      const btn = document.createElement('button');
      btn.className = `level-select-btn ${i === this.currentLevelNum ? 'active' : ''}`;
      btn.textContent = i;
      btn.title = `${this.currentTier.toUpperCase()} Level ${i}`;
      btn.addEventListener('click', () => {
        this.audio.playClick();
        this.closeModal('levels-modal');
        this.loadLevel(this.currentTier, i);
      });
      grid.appendChild(btn);
    }

    document.getElementById('levels-modal')?.classList.add('show');
  }

  async openLeaderboardModal() {
    const listEl = document.getElementById('leaderboard-list');
    if (!listEl) return;
    listEl.innerHTML = '<div style="padding:20px; text-align:center;">Loading global rankings...</div>';

    document.getElementById('leaderboard-modal')?.classList.add('show');
    const ranks = await window.supabaseService.getLeaderboard(15);
    listEl.innerHTML = '';

    ranks.forEach((p, index) => {
      const item = document.createElement('div');
      item.className = 'leader-row';
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
      item.innerHTML = `
        <div class="leader-rank">${medal}</div>
        <div class="leader-info">
          <div class="leader-name">${p.username || 'Anonymous Archer'}</div>
          <div class="leader-sub">Level ${p.highest_level || 1} • ${p.tier || 'BRONZE'}</div>
        </div>
        <div class="leader-score">${(p.total_score || 0).toLocaleString()} PTS</div>
      `;
      listEl.appendChild(item);
    });
  }

  openAuthModal() {
    document.getElementById('auth-modal')?.classList.add('show');
  }

  closeModal(id) {
    document.getElementById(id)?.classList.remove('show');
  }

  updateUserNavbar() {
    try {
      const isLogged = window.supabaseService?.isLoggedIn?.();
      const user = window.supabaseService?.getCurrentUser?.();
      const navUsername = document.getElementById('nav-username');
      const navTier = document.getElementById('nav-user-tier');
      const btnAuth = document.getElementById('btn-open-auth');
      const btnSignout = document.getElementById('btn-signout');

      if (isLogged && user && user.username) {
        if (navUsername) navUsername.textContent = user.username;
        if (navTier) {
          navTier.textContent = (user.tier || 'BRONZE').toUpperCase();
          navTier.className = `user-tier-pill tier-${(user.tier || 'bronze').toLowerCase()}`;
        }
        if (btnAuth) btnAuth.style.display = 'none';
        if (btnSignout) btnSignout.style.display = 'inline-block';
      } else {
        if (navUsername) navUsername.textContent = 'Guest Player';
        if (navTier) {
          navTier.textContent = 'GUEST';
          navTier.className = 'user-tier-pill tier-bronze';
        }
        if (btnAuth) btnAuth.style.display = 'inline-block';
        if (btnSignout) btnSignout.style.display = 'none';
      }
    } catch (e) {
      console.warn("[updateUserNavbar error]:", e);
    }
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', async () => {
  if (window.supabaseService?.init) {
    try {
      await window.supabaseService.init();
    } catch (e) {
      console.warn("[supabase init]:", e);
    }
  }
  window.game = new ArrowPuzzleGame();
  window.game.init();

  window.addEventListener('auth-state-changed', () => {
    window.game?.updateUserNavbar();
  });
});
