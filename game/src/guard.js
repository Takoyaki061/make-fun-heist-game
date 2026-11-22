// A patrolling guard: walks a waypoint loop, pauses to look around, and
// reads the room. Suspicion fills while the thief is inside the vision cone
// with a clear line of sight; a full meter turns the guard to a chase.
import { GUARD } from './config.js';
import { angleDiff, angleTo, dist, pointInRect, segmentHitsRect } from './geometry.js';

export const GUARD_STATE = { PATROL: 'patrol', PAUSE: 'pause', SUSPICIOUS: 'suspicious', CHASE: 'chase', INVESTIGATE: 'investigate' };

export class Guard {
  constructor(def, rand) {
    this.name = def.name;
    this.route = def.route.map(([x, y]) => ({ x, y }));
    this.branches = (def.branches || []).map(([x, y]) => ({ x, y }));
    this.rand = rand;
    this.x = this.route[0].x;
    this.y = this.route[0].y;
    this.waypoint = 1 % this.route.length;
    this.angle = 0;
    this.state = GUARD_STATE.PATROL;
    this.suspicion = 0;
    this.pauseLeft = 0;
    this.lookAngle = 0;
    this.lookFrom = 0;
    this.investigate = null;
    this.chaseTarget = null;
    this.branchTarget = null;
  }

  /** Where the guard is heading right now (waypoint or branch detour). */
  get target() {
    return this.branchTarget || this.route[this.waypoint];
  }

  /** True when the thief is inside this guard's cone with a clear sightline. */
  canSee(px, py, solids) {
    const d = dist(this.x, this.y, px, py);
    if (d > GUARD.coneRange) return false;
    if (Math.abs(angleDiff(angleTo(this.x, this.y, px, py), this.angle)) > GUARD.coneHalfAngle) return false;
    for (const r of solids) {
      if (segmentHitsRect(this.x, this.y, px, py, r)) return false;
    }
    return true;
  }

  /** Distance at which a walking thief's noise is heard. */
  hears(px, py, noiseRadius) {
    return dist(this.x, this.y, px, py) < noiseRadius + 30;
  }

  step(dt, world) {
    const { player, solids } = world;
    const seen = this.canSee(player.x, player.y, solids);
    const heard = !seen && this.hears(player.x, player.y, player.noiseRadius);

    // Suspicion fills fast up close, slower at the cone's edge; drains when
    // the thief is out of sight.
    if (seen) {
      const d = dist(this.x, this.y, player.x, player.y);
      const rate = d < GUARD.coneRange * 0.45 ? GUARD.fillNearPerSecond : GUARD.fillFarPerSecond;
      this.suspicion = Math.min(1, this.suspicion + rate * dt);
    } else {
      this.suspicion = Math.max(0, this.suspicion - GUARD.drainPerSecond * dt);
    }

    if (this.state === GUARD_STATE.CHASE) {
      this.chaseTarget = { x: player.x, y: player.y };
      this.moveToward(this.chaseTarget.x, this.chaseTarget.y, GUARD.chaseSpeed, dt, solids);
      if (!seen && this.suspicion < 0.25) {
        this.state = GUARD_STATE.SUSPICIOUS;
        this.investigate = { x: player.x, y: player.y };
      }
      return;
    }

    if (this.suspicion >= 1) {
      this.state = GUARD_STATE.CHASE;
      this.branchTarget = null;
      return;
    }

    if (this.state === GUARD_STATE.INVESTIGATE && this.investigate) {
      const arrived = this.moveToward(this.investigate.x, this.investigate.y, GUARD.suspiciousSpeed, dt, solids);
      if (arrived) {
        this.state = GUARD_STATE.PAUSE;
        this.pauseLeft = GUARD.pauseSeconds;
        this.lookFrom = this.angle;
      }
      return;
    }

    if (this.state === GUARD_STATE.SUSPICIOUS) {
      // Stop, sweep the cone around, then give up and walk on.
      this.angle += dt * 1.6;
      if (this.suspicion < 0.15) this.state = GUARD_STATE.PATROL;
      return;
    }

    if (this.state === GUARD_STATE.PAUSE) {
      // Look around at the waypoint: a slow sweep that telegraphs the turn.
      this.pauseLeft -= dt;
      this.angle = this.lookFrom + Math.sin((1 - this.pauseLeft / GUARD.pauseSeconds) * Math.PI) * 1.2;
      if (this.pauseLeft <= 0) {
        this.state = GUARD_STATE.PATROL;
        this.angle = this.lookFrom;
      }
      return;
    }

    // Patrol: walk the loop; at a waypoint, sometimes take a branch detour
    // (seeded per heist, so the route stays learnable but never identical),
    // and always pause to look around.
    if (heard && this.suspicion < 0.4) {
      this.suspicion = Math.min(1, this.suspicion + 0.35 * dt);
    }
    if (this.suspicion >= 0.5) {
      this.state = GUARD_STATE.SUSPICIOUS;
      return;
    }
    const target = this.target;
    const arrived = this.moveToward(target.x, target.y, GUARD.patrolSpeed, dt, solids);
    if (arrived) {
      if (this.branchTarget) {
        this.branchTarget = null;
      } else if (this.branches.length > 0 && this.rand() < 0.35) {
        this.branchTarget = this.branches[Math.floor(this.rand() * this.branches.length)];
      } else {
        this.waypoint = (this.waypoint + 1) % this.route.length;
      }
      this.state = GUARD_STATE.PAUSE;
      this.pauseLeft = GUARD.pauseSeconds;
      this.lookFrom = this.angle;
    }
  }

  /** Walk toward a point, facing the way we move. True when arrived. */
  moveToward(tx, ty, speed, dt, solids) {
    const d = dist(this.x, this.y, tx, ty);
    if (d < 4) return true;
    const step = Math.min(d, speed * dt);
    const nx = this.x + ((tx - this.x) / d) * step;
    const ny = this.y + ((ty - this.y) / d) * step;
    this.angle = angleTo(this.x, this.y, tx, ty);
    const blocked = solids.some((r) => pointInRect(nx, ny, { x: r.x - GUARD.radius, y: r.y - GUARD.radius, w: r.w + GUARD.radius * 2, h: r.h + GUARD.radius * 2 }));
    if (!blocked) {
      this.x = nx;
      this.y = ny;
    }
    return d - step < 4;
  }

  /** Called by the world when a coin lands or smoke residue is found. */
  lureTo(x, y) {
    if (this.state === GUARD_STATE.CHASE) return;
    this.investigate = { x, y };
    this.state = GUARD_STATE.INVESTIGATE;
    this.branchTarget = null;
  }
}
