// The thief, Moth. Walks, sneaks (slow and nearly silent), and carries the
// tools: smoke pellets, decoy coins and freeze spray.
import { PLAYER, TOOLS } from './config.js';
import { VIEW } from './config.js';
import { resolveCircleRects } from './geometry.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = -Math.PI / 2;
    this.sneaking = false;
    this.moving = false;
    this.smoke = TOOLS.smokeCharges;
    this.coins = TOOLS.coinCharges;
    this.freeze = TOOLS.freezeCharges;
    this.hasVial = false;
  }

  /** Noise radius right now: sneaking is nearly silent, walking is heard. */
  get noiseRadius() {
    if (!this.moving) return 0;
    return this.sneaking ? PLAYER.noiseSneak : PLAYER.noiseWalk;
  }

  get speed() {
    return this.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  }

  step(dt, input, solids) {
    let dx = 0;
    let dy = 0;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    this.sneaking = Boolean(input.sneak);
    this.moving = dx !== 0 || dy !== 0;
    if (!this.moving) return;
    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;
    this.angle = Math.atan2(dy, dx);
    const nx = this.x + dx * this.speed * dt;
    const ny = this.y + dy * this.speed * dt;
    const fixed = resolveCircleRects(nx, ny, PLAYER.radius, solids);
    // Stay inside the room.
    this.x = Math.min(VIEW.width - PLAYER.radius, Math.max(PLAYER.radius, fixed.x));
    this.y = Math.min(VIEW.height - PLAYER.radius, Math.max(PLAYER.radius, fixed.y));
  }
}
