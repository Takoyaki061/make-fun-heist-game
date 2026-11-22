// A ceiling camera: fixed to a mount, sweeping its cone back and forth.
// A thief inside the cone with a clear sightline raises the heat fast.
// Freeze spray stops the sweep cold for a few seconds.
import { CAMERA } from './config.js';
import { angleDiff, angleTo, dist, segmentHitsRect } from './geometry.js';

export class Camera {
  constructor(def) {
    this.x = def.x;
    this.y = def.y;
    this.baseAngle = def.baseAngle;
    this.arc = def.arc;
    this.speed = def.speed;
    this.phase = def.phase || 0;
    this.time = this.phase;
    this.frozenLeft = 0;
    this.angle = this.baseAngle;
  }

  step(dt) {
    if (this.frozenLeft > 0) {
      this.frozenLeft -= dt;
      return;
    }
    this.time += dt;
    this.angle = this.baseAngle + Math.sin(this.time * this.speed) * (this.arc / 2);
  }

  get frozen() {
    return this.frozenLeft > 0;
  }

  freeze(seconds) {
    this.frozenLeft = seconds;
  }

  /** True when the thief is inside the sweeping cone with a clear sightline. */
  canSee(px, py, solids) {
    if (this.frozen) return false;
    const d = dist(this.x, this.y, px, py);
    if (d > CAMERA.range) return false;
    if (Math.abs(angleDiff(angleTo(this.x, this.y, px, py), this.angle)) > CAMERA.halfAngle) return false;
    for (const r of solids) {
      if (segmentHitsRect(this.x, this.y, px, py, r)) return false;
    }
    return true;
  }
}
