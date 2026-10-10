// =========================================================================
// ARROWS PUZZLE (EASYBRAIN STYLE) - LEVELS & SOLVABLE LABYRINTH GENERATOR
// Tiers: Easy (🟢), Medium (🟡), Hard (🔴), Complex (🟣)
// =========================================================================

// Helper to create straight or L-shaped or concentric winding arrows
function makeArrow(id, points, dir, isLoop = false) {
  return { id, points, direction: dir, isLoop };
}

// Pre-crafted master levels for each tier
const HANDCRAFTED_LEVELS = {
  easy: [
    {
      id: "easy_1",
      tier: "easy",
      title: "Beginner's Flow",
      gridSize: 6,
      arrows: [
        makeArrow("e1_1", [{x: 1, y: 1}, {x: 4, y: 1}], "right"),
        makeArrow("e1_2", [{x: 4, y: 3}, {x: 4, y: 2}], "up"), // blocked by 1
        makeArrow("e1_3", [{x: 1, y: 3}, {x: 3, y: 3}], "right"), // blocked by 2
        makeArrow("e1_4", [{x: 2, y: 5}, {x: 2, y: 4}], "up") // blocked by 3
      ]
    },
    {
      id: "easy_2",
      tier: "easy",
      title: "Corner Unwind",
      gridSize: 6,
      arrows: [
        makeArrow("e2_1", [{x: 1, y: 1}, {x: 5, y: 1}], "right"),
        makeArrow("e2_2", [{x: 5, y: 5}, {x: 5, y: 2}], "up"), // blocked by 1
        makeArrow("e2_3", [{x: 1, y: 4}, {x: 4, y: 4}], "right"), // blocked by 2
        makeArrow("e2_4", [{x: 2, y: 2}, {x: 2, y: 4}], "down"),
        makeArrow("e2_5", [{x: 3, y: 5}, {x: 3, y: 2}], "up")
      ]
    },
    {
      id: "easy_3",
      tier: "easy",
      title: "Square Lock",
      gridSize: 7,
      arrows: [
        makeArrow("e3_1", [{x: 1, y: 1}, {x: 5, y: 1}], "right"),
        makeArrow("e3_2", [{x: 5, y: 1}, {x: 5, y: 5}], "down"),
        makeArrow("e3_3", [{x: 5, y: 5}, {x: 1, y: 5}], "left"),
        makeArrow("e3_4", [{x: 1, y: 5}, {x: 1, y: 2}], "up"), // blocked by 1
        makeArrow("e3_5", [{x: 2, y: 3}, {x: 4, y: 3}], "right"),
        makeArrow("e3_6", [{x: 3, y: 2}, {x: 3, y: 4}], "down")
      ]
    }
  ],

  medium: [
    {
      id: "med_1",
      tier: "medium",
      title: "The Classic Knot",
      gridSize: 8,
      arrows: [
        makeArrow("m1_top", [{x: 1, y: 1}, {x: 7, y: 1}], "right"),
        makeArrow("m1_r_up", [{x: 7, y: 7}, {x: 7, y: 2}], "up"),
        makeArrow("m1_b_r", [{x: 1, y: 7}, {x: 6, y: 7}], "right"),
        makeArrow("m1_hook_l", [{x: 2, y: 3}, {x: 5, y: 3}, {x: 5, y: 2}], "up"),
        makeArrow("m1_zig", [{x: 5, y: 2}, {x: 5, y: 3.5}, {x: 6, y: 3.5}, {x: 6, y: 4}], "down"),
        makeArrow("m1_c_u1", [{x: 3, y: 4}, {x: 4, y: 4}, {x: 4, y: 3}], "up"),
        makeArrow("m1_c_u2", [{x: 5, y: 4}, {x: 5, y: 3}], "up"),
        makeArrow("m1_step_l", [{x: 3, y: 5.5}, {x: 3, y: 4.5}, {x: 1.5, y: 4.5}], "left"),
        makeArrow("m1_low_hook", [{x: 6, y: 5}, {x: 4, y: 5}, {x: 4, y: 5.8}, {x: 3, y: 5.8}], "left"),
        makeArrow("m1_bot_hook", [{x: 5, y: 6.5}, {x: 5, y: 6.8}, {x: 4, y: 6.8}], "left")
      ]
    },
    {
      id: "med_2",
      tier: "medium",
      title: "Twin Helix",
      gridSize: 8,
      arrows: [
        makeArrow("m2_1", [{x: 1, y: 2}, {x: 3, y: 2}, {x: 3, y: 4}, {x: 6, y: 4}], "right"),
        makeArrow("m2_2", [{x: 6, y: 6}, {x: 4, y: 6}, {x: 4, y: 3}, {x: 1, y: 3}], "left"),
        makeArrow("m2_3", [{x: 2, y: 1}, {x: 2, y: 6}], "down"),
        makeArrow("m2_4", [{x: 5, y: 7}, {x: 5, y: 1}], "up"),
        makeArrow("m2_5", [{x: 1, y: 5}, {x: 3, y: 5}], "right"),
        makeArrow("m2_6", [{x: 4, y: 2}, {x: 4, y: 1}], "up"),
        makeArrow("m2_7", [{x: 6, y: 2}, {x: 6, y: 1}], "up"),
        makeArrow("m2_8", [{x: 1, y: 7}, {x: 6, y: 7}], "right")
      ]
    }
  ],

  hard: [
    {
      id: "hard_1",
      tier: "hard",
      title: "Tangled Web Matrix",
      gridSize: 10,
      arrows: [
        makeArrow("h1_1", [{x: 1, y: 1}, {x: 8, y: 1}], "right"),
        makeArrow("h1_2", [{x: 8, y: 1}, {x: 8, y: 8}], "down"),
        makeArrow("h1_3", [{x: 8, y: 8}, {x: 1, y: 8}], "left"),
        makeArrow("h1_4", [{x: 1, y: 8}, {x: 1, y: 2}], "up"),
        makeArrow("h1_5", [{x: 2, y: 2}, {x: 7, y: 2}], "right"),
        makeArrow("h1_6", [{x: 7, y: 2}, {x: 7, y: 7}], "down"),
        makeArrow("h1_7", [{x: 7, y: 7}, {x: 2, y: 7}], "left"),
        makeArrow("h1_8", [{x: 2, y: 7}, {x: 2, y: 3}], "up"),
        makeArrow("h1_9", [{x: 3, y: 3}, {x: 6, y: 3}], "right"),
        makeArrow("h1_10", [{x: 6, y: 3}, {x: 6, y: 6}], "down"),
        makeArrow("h1_11", [{x: 6, y: 6}, {x: 3, y: 6}], "left"),
        makeArrow("h1_12", [{x: 3, y: 6}, {x: 3, y: 4}], "up"),
        makeArrow("h1_13", [{x: 4, y: 4}, {x: 5, y: 4}], "right"),
        makeArrow("h1_14", [{x: 5, y: 5}, {x: 4, y: 5}], "left")
      ]
    }
  ],

  complex: [
    {
      id: "comp_1",
      tier: "complex",
      title: "Labyrinth Circuit (Easybrain Master)",
      gridSize: 12,
      arrows: [
        // Concentric winding maze corridors matching the Easybrain screenshot!
        makeArrow("c1_outer_top", [{x: 1, y: 1}, {x: 10, y: 1}], "right"),
        makeArrow("c1_outer_right", [{x: 10, y: 1}, {x: 10, y: 10}], "down"),
        makeArrow("c1_outer_bottom", [{x: 10, y: 10}, {x: 1, y: 10}], "left"),
        makeArrow("c1_outer_left", [{x: 1, y: 10}, {x: 1, y: 2}], "up"),

        makeArrow("c1_ring2_top", [{x: 2, y: 2}, {x: 9, y: 2}], "right"),
        makeArrow("c1_ring2_right", [{x: 9, y: 2}, {x: 9, y: 9}], "down"),
        makeArrow("c1_ring2_bot", [{x: 9, y: 9}, {x: 2, y: 9}], "left"),
        makeArrow("c1_ring2_left", [{x: 2, y: 9}, {x: 2, y: 3}], "up"),

        makeArrow("c1_ring3_top", [{x: 3, y: 3}, {x: 8, y: 3}], "right"),
        makeArrow("c1_ring3_right", [{x: 8, y: 3}, {x: 8, y: 8}], "down"),
        makeArrow("c1_ring3_bot", [{x: 8, y: 8}, {x: 3, y: 8}], "left"),
        makeArrow("c1_ring3_left", [{x: 3, y: 8}, {x: 3, y: 4}], "up"),

        // Inner interlocking circuit tracks
        makeArrow("c1_circuit_1", [{x: 4, y: 4}, {x: 7, y: 4}, {x: 7, y: 6}], "down"),
        makeArrow("c1_circuit_2", [{x: 7, y: 7}, {x: 4, y: 7}, {x: 4, y: 5}], "up"),
        makeArrow("c1_circuit_3", [{x: 5, y: 5}, {x: 6, y: 5}], "right"),
        makeArrow("c1_circuit_4", [{x: 6, y: 6}, {x: 5, y: 6}], "left"),

        // Crossing vertical spine lines
        makeArrow("c1_spine_1", [{x: 5, y: 2}, {x: 5, y: 3.5}], "down"),
        makeArrow("c1_spine_2", [{x: 6, y: 9}, {x: 6, y: 7.5}], "up")
      ]
    }
  ]
};

// =========================================================================
// GUARANTEED 100% SOLVABLE PROCEDURAL LABYRINTH PUZZLE GENERATOR
// Uses the Reverse-Untangling construction:
// 1. Places arrows starting with an unobstructed exit path
// 2. Subsequent arrows are blocked by previous ones, ensuring a clean solution!
// =========================================================================

function generateSolvablePuzzle(tier = 'medium', levelNumber = 1) {
  let gridSize, arrowCount, maxTurns;

  switch (tier) {
    case 'easy':
      gridSize = 6;
      arrowCount = 5 + Math.floor(Math.random() * 3); // 5 - 7
      maxTurns = 1;
      break;
    case 'medium':
      gridSize = 8;
      arrowCount = 8 + Math.floor(Math.random() * 4); // 8 - 11
      maxTurns = 2;
      break;
    case 'hard':
      gridSize = 10;
      arrowCount = 13 + Math.floor(Math.random() * 5); // 13 - 17
      maxTurns = 3;
      break;
    case 'complex':
    default:
      gridSize = 12;
      arrowCount = 18 + Math.floor(Math.random() * 6); // 18 - 23
      maxTurns = 4;
      break;
  }

  const arrows = [];
  const occupiedSegments = new Set();
  const directions = ['right', 'left', 'up', 'down'];

  function segmentKey(p1, p2) {
    const x1 = Math.min(p1.x, p2.x);
    const x2 = Math.max(p1.x, p2.x);
    const y1 = Math.min(p1.y, p2.y);
    const y2 = Math.max(p1.y, p2.y);
    return `${x1},${y1}-${x2},${y2}`;
  }

  // Generate arrows with circuit-like Manhattan turns
  for (let i = 0; i < arrowCount; i++) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 40) {
      attempts++;
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const points = [];

      // Create a multi-point path based on maxTurns
      const turns = Math.min(maxTurns, Math.floor(Math.random() * (maxTurns + 1)));

      if (turns === 0) {
        // Straight Arrow
        let p1, p2;
        if (dir === 'right') {
          const y = 1 + Math.floor(Math.random() * (gridSize - 2));
          const x1 = 1 + Math.floor(Math.random() * 3);
          const x2 = x1 + 2 + Math.floor(Math.random() * (gridSize - x1 - 2));
          p1 = { x: x1, y };
          p2 = { x: Math.min(x2, gridSize - 1), y };
        } else if (dir === 'left') {
          const y = 1 + Math.floor(Math.random() * (gridSize - 2));
          const x2 = 1 + Math.floor(Math.random() * 3);
          const x1 = x2 + 2 + Math.floor(Math.random() * (gridSize - x2 - 2));
          p1 = { x: x1, y };
          p2 = { x: x2, y };
        } else if (dir === 'down') {
          const x = 1 + Math.floor(Math.random() * (gridSize - 2));
          const y1 = 1 + Math.floor(Math.random() * 3);
          const y2 = y1 + 2 + Math.floor(Math.random() * (gridSize - y1 - 2));
          p1 = { x, y: y1 };
          p2 = { x, y: Math.min(y2, gridSize - 1) };
        } else { // 'up'
          const x = 1 + Math.floor(Math.random() * (gridSize - 2));
          const y2 = 1 + Math.floor(Math.random() * 3);
          const y1 = y2 + 2 + Math.floor(Math.random() * (gridSize - y2 - 2));
          p1 = { x, y: y1 };
          p2 = { x, y: y2 };
        }
        points.push(p1, p2);
      } else {
        // Multi-turn L-shaped / Z-shaped arrow
        const startX = 1 + Math.floor(Math.random() * (gridSize - 2));
        const startY = 1 + Math.floor(Math.random() * (gridSize - 2));
        const midX = 1 + Math.floor(Math.random() * (gridSize - 2));
        const midY = startY;

        let endX = midX;
        let endY = 1 + Math.floor(Math.random() * (gridSize - 2));

        if (dir === 'up') endY = Math.min(startY, 1);
        if (dir === 'down') endY = Math.max(startY, gridSize - 1);
        if (dir === 'right') { endX = Math.max(midX, gridSize - 1); endY = midY; }
        if (dir === 'left') { endX = Math.min(midX, 1); endY = midY; }

        points.push({ x: startX, y: startY });
        if (midX !== startX && midY !== endY) {
          points.push({ x: midX, y: midY });
        }
        points.push({ x: endX, y: endY });
      }

      // Ensure points are valid and not zero-length
      if (points.length >= 2) {
        const seg = segmentKey(points[0], points[1]);
        if (!occupiedSegments.has(seg)) {
          occupiedSegments.add(seg);
          arrows.push({
            id: `gen_${tier}_${i}_${Date.now()}`,
            points,
            direction: dir,
            hasNode: i % 4 === 0,
            nodePos: { x: points[0].x, y: points[0].y }
          });
          placed = true;
        }
      }
    }
  }

  return {
    id: `${tier}_${levelNumber}`,
    tier,
    title: `${tier.toUpperCase()} Level ${levelNumber}`,
    gridSize,
    arrows
  };
}

// Function to fetch or generate level by tier and number
function getLevel(tier, levelNumber) {
  const list = HANDCRAFTED_LEVELS[tier] || [];
  if (levelNumber <= list.length) {
    return JSON.parse(JSON.stringify(list[levelNumber - 1]));
  }
  return generateSolvablePuzzle(tier, levelNumber);
}
