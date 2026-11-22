// The screenshot scenes behind ?shot=start|play|end. Each one plays the
// real rules forward from a fresh world, steered by a simple autopilot that
// reads the cones before it moves, so the frame is what a short game really
// looks like and the same seed always gives the same frame.
import { PLAYER, STEP, VIEW } from './config.js';
import { WORLD_STATE } from './world.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 22;
const END_LIMIT_SECONDS = 150;
const SAMPLE = 1 / 30;
const DIRECTIONS = [
  [0, 0], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1],
];

/** How dangerous a position is: inside a live cone, near a guard, or both. */
function dangerAt(world, x, y) {
  let danger = 0;
  const p = world.player;
  for (const g of world.guards) {
    const blocked = world.tools.blockedBySmoke(g.x, g.y, x, y);
    if (!blocked && g.canSee(x, y, world.solids)) danger += 1;
    const d = Math.hypot(g.x - x, g.y - y);
    if (d < 60) danger += (60 - d) / 60;
  }
  for (const c of world.cameras) {
    const blocked = world.tools.blockedBySmoke(c.x, c.y, x, y);
    if (!blocked && c.canSee(x, y, world.solids)) danger += 1.2;
  }
  return danger;
}

/** One step of the autopilot: pick the direction that gets closer to the
 * target without standing in a cone, sneak when a cone is near, and retreat
 * to cool down when the heat is high. Smoke when the only way forward is
 * through a cone.
 */
export function autopilot(world) {
  const p = world.player;
  const input = { left: false, right: false, up: false, down: false, sneak: false, smoke: false, coin: false, freeze: false };
  // Hot: fall back to the cold corner and let the heat decay.
  let target;
  if (world.heat > 55) {
    target = { x: world.room.start.x, y: world.room.start.y };
  } else if (world.vialTaken) {
    target = { x: world.room.exit.x + world.room.exit.w / 2, y: world.room.exit.y + world.room.exit.h / 2 };
  } else {
    target = world.room.vial;
  }
  const speed = PLAYER.walkSpeed;
  let best = [0, 0];
  let bestScore = -Infinity;
  for (const [dx, dy] of DIRECTIONS) {
    const len = Math.hypot(dx, dy) || 1;
    const nx = p.x + (dx / len) * speed * SAMPLE * 8;
    const ny = p.y + (dy / len) * speed * SAMPLE * 8;
    const moved = Math.hypot(nx - p.x, ny - p.y);
    const dTarget = Math.hypot(target.x - nx, target.y - ny);
    const danger = dangerAt(world, nx, ny);
    const score = -dTarget * 2 - danger * 420 + moved * 0.5;
    if (score > bestScore) {
      bestScore = score;
      best = [dx, dy];
    }
  }
  const [bx, by] = best;
  if (bx > 0) input.right = true;
  if (bx < 0) input.left = true;
  if (by > 0) input.down = true;
  if (by < 0) input.up = true;
  const nearDanger = dangerAt(world, p.x, p.y) > 0 || dangerAt(world, p.x + bx * 40, p.y + by * 40) > 0;
  input.sneak = nearDanger || world.heat > 40;
  // Smoke if the way forward is covered and we have a charge.
  const ahead = dangerAt(world, p.x + bx * 60, p.y + by * 60);
  if (ahead > 0.5 && p.smoke > 0 && world.tools.activeSmoke.length === 0) input.smoke = true;
  // Freeze the cameras when the vial is under one and we are close.
  const vialD = Math.hypot(world.room.vial.x - p.x, world.room.vial.y - p.y);
  if (!world.vialTaken && vialD < 160 && p.freeze > 0) input.freeze = true;
  return input;
}

/**
 * Set `world` to the named scene (start, play or end; any other name is
 * start) and return the screen to draw over it.
 */
export function stageShot(name, world) {
  world.reset(world.seed ?? 7);
  if (name !== 'play' && name !== 'end') {
    for (let i = 0; i < START_SECONDS / STEP; i += 1) {
      world.step(STEP, { left: false, right: false, up: false, down: false, sneak: false, smoke: false, coin: false, freeze: false });
    }
    return 'title';
  }
  const limit = name === 'end' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  for (let i = 0; i < limit / STEP; i += 1) {
    if (world.state !== WORLD_STATE.PLAYING) break;
    // The play scene stops mid-crack: the frame is the thief at the case,
    // the ring half full, the camera sweeping in — not a win screen.
    if (name === 'play' && world.crackProgress >= 0.55) break;
    world.step(STEP, autopilot(world));
  }
  if (world.state === WORLD_STATE.WON) return 'won';
  if (world.state === WORLD_STATE.CAUGHT) return 'caught';
  return 'playing';
}
