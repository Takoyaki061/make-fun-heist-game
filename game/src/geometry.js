// Small geometry helpers: points, segments and rectangles. Guards and
// cameras use these for line of sight; the world uses them for movement.
export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function clamp(value, low, high) {
  return Math.min(high, Math.max(low, value));
}

/** True when the point is inside the rectangle (edges inclusive). */
export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

/**
 * True when the segment (x1,y1)-(x2,y2) touches the rectangle. Used for
 * line of sight: a wall or a pod between watcher and thief blocks the view.
 */
export function segmentHitsRect(x1, y1, x2, y2, r) {
  if (pointInRect(x1, y1, r) || pointInRect(x2, y2, r)) return true;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y],
    [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h],
    [r.x, r.y + r.h, r.x, r.y],
  ];
  for (const [ex1, ey1, ex2, ey2] of edges) {
    if (segmentsCross(x1, y1, x2, y2, ex1, ey1, ex2, ey2)) return true;
  }
  return false;
}

function segmentsCross(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d1 = cross(x3, y3, x4, y4, x1, y1);
  const d2 = cross(x3, y3, x4, y4, x2, y2);
  const d3 = cross(x1, y1, x2, y2, x3, y3);
  const d4 = cross(x1, y1, x2, y2, x4, y4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function cross(ax, ay, bx, by, px, py) {
  return (bx - ax) * (py - ay) - (by - ay) * (px - ax);
}

/**
 * Push a circle out of every rectangle it overlaps (axis-separated, so the
 * thief slides along walls instead of sticking). Returns true on a hit.
 */
export function resolveCircleRects(x, y, radius, rects) {
  let hit = false;
  for (const r of rects) {
    const cx = clamp(x, r.x, r.x + r.w);
    const cy = clamp(y, r.y, r.y + r.h);
    const dx = x - cx;
    const dy = y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 >= radius * radius) continue;
    hit = true;
    if (d2 > 0.0001) {
      const d = Math.sqrt(d2);
      x = cx + (dx / d) * radius;
      y = cy + (dy / d) * radius;
    } else {
      // Centre inside the rectangle: push out along the shallowest side.
      const left = x - r.x;
      const right = r.x + r.w - x;
      const top = y - r.y;
      const bottom = r.y + r.h - y;
      const m = Math.min(left, right, top, bottom);
      if (m === left) x = r.x - radius;
      else if (m === right) x = r.x + r.w + radius;
      else if (m === top) y = r.y - radius;
      else y = r.y + r.h + radius;
    }
  }
  return { x, y, hit };
}
