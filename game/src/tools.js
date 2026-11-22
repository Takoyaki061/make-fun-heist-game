// The three tools. Each has charges and a real cost: smoke blocks every cone
// but leaves residue guards come to look at; a coin lures one guard but a
// guard who finds nothing grows more suspicious; freeze spray stops the
// cameras but its thermal bloom raises the heat.
import { HEAT, TOOLS } from './config.js';
import { dist } from './geometry.js';

export class Tools {
  constructor() {
    this.smokes = [];
    this.coins = [];
  }

  get activeSmoke() {
    return this.smokes.filter((s) => s.left > 0);
  }

  useSmoke(player, world) {
    if (player.smoke <= 0) return false;
    player.smoke -= 1;
    this.smokes.push({ x: player.x, y: player.y, left: TOOLS.smokeSeconds, radius: TOOLS.smokeRadius });
    world.log('Smoke out — cones cannot see through it');
    return true;
  }

  useCoin(player, world, tx, ty) {
    if (player.coins <= 0) return false;
    player.coins -= 1;
    this.coins.push({ x: tx, y: ty, left: TOOLS.coinLureSeconds });
    let nearest = null;
    let nearestD = Infinity;
    for (const g of world.guards) {
      const d = dist(g.x, g.y, tx, ty);
      if (d < TOOLS.coinLureRange && d < nearestD) {
        nearest = g;
        nearestD = d;
      }
    }
    if (nearest) {
      nearest.lureTo(tx, ty);
      world.log(`${nearest.name} heard the coin`);
    }
    return true;
  }

  useFreeze(player, world) {
    if (player.freeze <= 0) return false;
    player.freeze -= 1;
    for (const c of world.cameras) c.freeze(TOOLS.freezeSeconds);
    world.addHeat(HEAT.freezeSprayCost);
    world.log('Cameras frozen — the spray blooms hot');
    return true;
  }

  step(dt, world) {
    for (const s of this.smokes) {
      s.left -= dt;
      if (s.left <= 0 && !s.residueDone) {
        // The smoke clears; the residue is worth a look for the nearest guard.
        s.residueDone = true;
        let nearest = null;
        let nearestD = Infinity;
        for (const g of world.guards) {
          const d = dist(g.x, g.y, s.x, s.y);
          if (d < nearestD) {
            nearest = g;
            nearestD = d;
          }
        }
        if (nearest && nearestD < 320) nearest.lureTo(s.x, s.y);
      }
    }
    this.smokes = this.smokes.filter((s) => s.left > -1);
    for (const c of this.coins) c.left -= dt;
    this.coins = this.coins.filter((c) => c.left > 0);
  }

  /** True when the segment watcher->target crosses live smoke. */
  blockedBySmoke(x1, y1, x2, y2) {
    for (const s of this.activeSmoke) {
      const d = distToSegment(s.x, s.y, x1, y1, x2, y2);
      if (d < s.radius) return true;
    }
    return false;
  }
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}
