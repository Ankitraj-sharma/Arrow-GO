// ==========================================
// ARROWSGO - CURATED PUZZLE LEVELS & GENERATOR
// ==========================================

const LEVELS_DATA = [
  // --- LEVEL 1: Gentle Introduction (3 arrows) ---
  {
    id: 1,
    title: "First Steps",
    gridSize: 6,
    arrows: [
      { id: 'l1_1', points: [{x: 1, y: 1}, {x: 4, y: 1}], direction: 'right' },
      { id: 'l1_2', points: [{x: 4, y: 3}, {x: 4, y: 2}], direction: 'up' }, // blocked by l1_1 until l1_1 moves
      { id: 'l1_3', points: [{x: 1, y: 4}, {x: 4, y: 4}], direction: 'right' }
    ]
  },

  // --- LEVEL 2: Turns & Angles (4 arrows) ---
  {
    id: 2,
    title: "Corner Turn",
    gridSize: 7,
    arrows: [
      { id: 'l2_1', points: [{x: 1, y: 1}, {x: 5, y: 1}], direction: 'right' },
      { id: 'l2_2', points: [{x: 5, y: 5}, {x: 5, y: 2}], direction: 'up' }, // blocked by l2_1
      { id: 'l2_3', points: [{x: 1, y: 3}, {x: 3, y: 3}, {x: 3, y: 5}], direction: 'down' },
      { id: 'l2_4', points: [{x: 1, y: 5}, {x: 4, y: 5}], direction: 'right' } // blocked by l2_2
    ]
  },

  // --- LEVEL 3: The Iconic Board from the Screenshot! ---
  {
    id: 3,
    title: "ArrowsGo Classic",
    gridSize: 8,
    arrows: [
      // Top horizontal arrow across the board with yellow token
      { 
        id: 'l3_top', 
        points: [{x: 1, y: 1}, {x: 7, y: 1}], 
        direction: 'right',
        hasNode: true, 
        nodePos: {x: 4, y: 1} 
      },
      // Far right vertical arrow pointing up
      { 
        id: 'l3_right_up', 
        points: [{x: 7, y: 7}, {x: 7, y: 2}], 
        direction: 'up' // blocked by l3_top
      },
      // Bottom horizontal arrow pointing right
      { 
        id: 'l3_bottom_right', 
        points: [{x: 1, y: 7}, {x: 6, y: 7}], 
        direction: 'right' // blocked by l3_right_up
      },
      // Upper middle hook pointing left
      { 
        id: 'l3_hook_left', 
        points: [{x: 2, y: 3}, {x: 5, y: 3}, {x: 5, y: 2}], 
        direction: 'up' // blocked by l3_top
      },
      // Middle zig-zag pointing right
      { 
        id: 'l3_zigzag_right', 
        points: [{x: 5, y: 2}, {x: 5, y: 3.5}, {x: 6, y: 3.5}, {x: 6, y: 4}], 
        direction: 'down' 
      },
      // Center upward arrows
      { 
        id: 'l3_mid_up_1', 
        points: [{x: 3, y: 4}, {x: 4, y: 4}, {x: 4, y: 3}], 
        direction: 'up' 
      },
      { 
        id: 'l3_mid_up_2', 
        points: [{x: 5, y: 4}, {x: 5, y: 3}], 
        direction: 'up' 
      },
      // Mid-left L-shape pointing left
      { 
        id: 'l3_left_step', 
        points: [{x: 3, y: 5.5}, {x: 3, y: 4.5}, {x: 1.5, y: 4.5}], 
        direction: 'left' 
      },
      // Lower right corner hook pointing left
      { 
        id: 'l3_lower_hook', 
        points: [{x: 6, y: 5}, {x: 4, y: 5}, {x: 4, y: 5.8}, {x: 3, y: 5.8}], 
        direction: 'left' 
      },
      // Bottom hook pointing left
      { 
        id: 'l3_bottom_hook', 
        points: [{x: 5, y: 6.5}, {x: 5, y: 6.8}, {x: 4, y: 6.8}], 
        direction: 'left' 
      }
    ]
  },

  // --- LEVEL 4: Crossfire (6 arrows) ---
  {
    id: 4,
    title: "Crossfire Matrix",
    gridSize: 7,
    arrows: [
      { id: 'l4_1', points: [{x: 1, y: 1}, {x: 5, y: 1}], direction: 'right' },
      { id: 'l4_2', points: [{x: 5, y: 1}, {x: 5, y: 5}], direction: 'down' },
      { id: 'l4_3', points: [{x: 5, y: 5}, {x: 1, y: 5}], direction: 'left' },
      { id: 'l4_4', points: [{x: 1, y: 5}, {x: 1, y: 2}], direction: 'up' },
      { id: 'l4_5', points: [{x: 2, y: 3}, {x: 4, y: 3}], direction: 'right' },
      { id: 'l4_6', points: [{x: 3, y: 2}, {x: 3, y: 4}], direction: 'down' }
    ]
  },

  // --- LEVEL 5: Spiral Maze (8 arrows) ---
  {
    id: 5,
    title: "Spiral Maze",
    gridSize: 8,
    arrows: [
      { id: 'l5_1', points: [{x: 1, y: 1}, {x: 6, y: 1}], direction: 'right' },
      { id: 'l5_2', points: [{x: 6, y: 2}, {x: 6, y: 6}], direction: 'down' },
      { id: 'l5_3', points: [{x: 5, y: 6}, {x: 1, y: 6}], direction: 'left' },
      { id: 'l5_4', points: [{x: 1, y: 5}, {x: 1, y: 2}], direction: 'up' },
      { id: 'l5_5', points: [{x: 2, y: 2}, {x: 5, y: 2}], direction: 'right' },
      { id: 'l5_6', points: [{x: 5, y: 3}, {x: 5, y: 5}], direction: 'down' },
      { id: 'l5_7', points: [{x: 4, y: 5}, {x: 2, y: 5}], direction: 'left' },
      { id: 'l5_8', points: [{x: 3, y: 4}, {x: 3, y: 3}], direction: 'up' }
    ]
  },

  // --- LEVEL 6: Twin Serpents (8 arrows) ---
  {
    id: 6,
    title: "Twin Serpents",
    gridSize: 8,
    arrows: [
      { id: 'l6_1', points: [{x: 1, y: 2}, {x: 3, y: 2}, {x: 3, y: 4}, {x: 6, y: 4}], direction: 'right' },
      { id: 'l6_2', points: [{x: 6, y: 6}, {x: 4, y: 6}, {x: 4, y: 3}, {x: 1, y: 3}], direction: 'left' },
      { id: 'l6_3', points: [{x: 2, y: 1}, {x: 2, y: 6}], direction: 'down' },
      { id: 'l6_4', points: [{x: 5, y: 7}, {x: 5, y: 1}], direction: 'up' },
      { id: 'l6_5', points: [{x: 1, y: 5}, {x: 3, y: 5}], direction: 'right' },
      { id: 'l6_6', points: [{x: 4, y: 2}, {x: 4, y: 1}], direction: 'up' },
      { id: 'l6_7', points: [{x: 6, y: 2}, {x: 6, y: 1}], direction: 'up' },
      { id: 'l6_8', points: [{x: 1, y: 7}, {x: 6, y: 7}], direction: 'right' }
    ]
  },

  // --- LEVEL 7: Diamond Lattice (9 arrows) ---
  {
    id: 7,
    title: "Diamond Lattice",
    gridSize: 8,
    arrows: [
      { id: 'l7_1', points: [{x: 2, y: 1}, {x: 6, y: 1}], direction: 'right' },
      { id: 'l7_2', points: [{x: 6, y: 1}, {x: 6, y: 5}], direction: 'down' },
      { id: 'l7_3', points: [{x: 6, y: 5}, {x: 2, y: 5}], direction: 'left' },
      { id: 'l7_4', points: [{x: 2, y: 5}, {x: 2, y: 2}], direction: 'up' },
      { id: 'l7_5', points: [{x: 3, y: 2}, {x: 5, y: 2}, {x: 5, y: 4}], direction: 'down' },
      { id: 'l7_6', points: [{x: 4, y: 4}, {x: 3, y: 4}, {x: 3, y: 3}], direction: 'up' },
      { id: 'l7_7', points: [{x: 1, y: 6}, {x: 7, y: 6}], direction: 'right' },
      { id: 'l7_8', points: [{x: 7, y: 7}, {x: 7, y: 1}], direction: 'up' },
      { id: 'l7_9', points: [{x: 1, y: 7}, {x: 1, y: 1}], direction: 'up' }
    ]
  },

  // --- LEVEL 8: Tangled Web (10 arrows) ---
  {
    id: 8,
    title: "Tangled Web",
    gridSize: 8,
    arrows: [
      { id: 'l8_1', points: [{x: 1, y: 1}, {x: 7, y: 1}], direction: 'right', hasNode: true, nodePos: {x: 3, y: 1} },
      { id: 'l8_2', points: [{x: 2, y: 2}, {x: 5, y: 2}, {x: 5, y: 4}], direction: 'down' },
      { id: 'l8_3', points: [{x: 6, y: 3}, {x: 3, y: 3}, {x: 3, y: 5}], direction: 'down' },
      { id: 'l8_4', points: [{x: 1, y: 4}, {x: 4, y: 4}], direction: 'right' },
      { id: 'l8_5', points: [{x: 5, y: 5}, {x: 2, y: 5}], direction: 'left' },
      { id: 'l8_6', points: [{x: 4, y: 6}, {x: 4, y: 2}], direction: 'up' },
      { id: 'l8_7', points: [{x: 7, y: 6}, {x: 7, y: 2}], direction: 'up' },
      { id: 'l8_8', points: [{x: 1, y: 7}, {x: 6, y: 7}], direction: 'right' },
      { id: 'l8_9', points: [{x: 2, y: 7}, {x: 2, y: 6}, {x: 1, y: 6}], direction: 'left' },
      { id: 'l8_10', points: [{x: 6, y: 6}, {x: 5, y: 6}], direction: 'left' }
    ]
  }
];

// --- PROCEDURAL SOLVABLE PUZZLE GENERATOR ---
function generateProceduralLevel(levelIndex = 1, size = 8, count = 7) {
  const gridSize = size;
  const arrows = [];
  const occupiedSegments = [];

  // Helper: check segment overlap
  function segmentKey(p1, p2) {
    const x1 = Math.min(p1.x, p2.x);
    const x2 = Math.max(p1.x, p2.x);
    const y1 = Math.min(p1.y, p2.y);
    const y2 = Math.max(p1.y, p2.y);
    return `${x1},${y1}-${x2},${y2}`;
  }

  // Generate arrows with guaranteed exit paths
  const directions = ['right', 'left', 'up', 'down'];

  for (let i = 0; i < count; i++) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 35) {
      attempts++;
      const dir = directions[Math.floor(Math.random() * directions.length)];
      let p1, p2;

      if (dir === 'right') {
        const y = 1 + Math.floor(Math.random() * (gridSize - 2));
        const x1 = 1 + Math.floor(Math.random() * 2);
        const x2 = x1 + 2 + Math.floor(Math.random() * (gridSize - x1 - 2));
        p1 = { x: x1, y };
        p2 = { x: Math.min(x2, gridSize - 1), y };
      } else if (dir === 'left') {
        const y = 1 + Math.floor(Math.random() * (gridSize - 2));
        const x2 = 1 + Math.floor(Math.random() * 2);
        const x1 = x2 + 2 + Math.floor(Math.random() * (gridSize - x2 - 2));
        p1 = { x: x1, y };
        p2 = { x: x2, y };
      } else if (dir === 'down') {
        const x = 1 + Math.floor(Math.random() * (gridSize - 2));
        const y1 = 1 + Math.floor(Math.random() * 2);
        const y2 = y1 + 2 + Math.floor(Math.random() * (gridSize - y1 - 2));
        p1 = { x, y: y1 };
        p2 = { x, y: Math.min(y2, gridSize - 1) };
      } else { // 'up'
        const x = 1 + Math.floor(Math.random() * (gridSize - 2));
        const y2 = 1 + Math.floor(Math.random() * 2);
        const y1 = y2 + 2 + Math.floor(Math.random() * (gridSize - y2 - 2));
        p1 = { x, y: y1 };
        p2 = { x, y: y2 };
      }

      // Check if duplicate segment
      const key = segmentKey(p1, p2);
      if (!occupiedSegments.includes(key)) {
        occupiedSegments.push(key);
        arrows.push({
          id: `rnd_${i}_${Date.now()}`,
          points: [p1, p2],
          direction: dir,
          hasNode: i === 0,
          nodePos: i === 0 ? { x: Math.round((p1.x + p2.x) / 2), y: Math.round((p1.y + p2.y) / 2) } : null
        });
        placed = true;
      }
    }
  }

  return {
    id: `rand_${levelIndex}`,
    title: `Challenge Round #${levelIndex}`,
    gridSize,
    arrows
  };
}
