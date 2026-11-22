// The world: one room, its guards, cameras, tools and the heat meter. Each
// step moves everything, works out who can see the thief, and moves the heat.
// Heat is the alarm: seen by a guard or a camera it climbs; quiet and cold
// it falls. At lockdown the airlock seals and every guard converges.
import { GUARD, HEAT, HEIST, SCORE, STEP } from './config.js';
import { Camera } from './camera.js';
import { Guard, GUARD_STATE } from './guard.js';
import { Player } from './player.js';
import { Tools } from './tools.js';
import { ROOMS, solidRects } from './level.js';
import { dist, pointInRect } from './geometry.js';
import { mulberry32 } from './random.js';

export const WORLD_STATE = { PLAYING: 'playing', WON: 'won', CAUGHT: 'caught' };

export class World {
  constructor(roomIndex, seed) {
    this.roomIndex = roomIndex;
    this.seed = seed;
    this.room = ROOMS[roomIndex];
    this.rand = mulberry32(seed);
    this.solids = solidRects(this.room);
    this.player = new Player(this.room.start.x, this.room.start.y);
    this.guards = this.room.guards.map((g) => new Guard(g, this.rand));
    this.cameras = this.room.cameras.map((c) => new Camera(c));
    this.tools = new Tools();
    this.heat = 0;
    this.heatQuietFor = 99;
    this.lockdownLeft = 0;
    this.lockdownFired = false;
    this.state = WORLD_STATE.PLAYING;
    this.time = 0;
    this.vialTaken = false;
    this.crackProgress = 0;
    this.cracking = false;
    this.exitProgress = 0;
    this.messages = [];
    this.score = 0;
  }

  log(text) {
    this.messages.push({ text, at: this.time });
    if (this.messages.length > 4) this.messages.shift();
  }

  addHeat(amount) {
    this.heat = Math.min(HEAT.max, this.heat + amount);
  }

  get heatBand() {
    if (this.heat >= HEAT.lockdownAt) return 'lockdown';
    if (this.heat >= HEAT.calmBelow) return 'suspicious';
    return 'calm';
  }

  get exitOpen() {
    return this.vialTaken && this.lockdownLeft <= 0;
  }

  step(dt, input) {
    if (this.state !== WORLD_STATE.PLAYING) return;
    this.time += dt;

    if (input.smoke) this.tools.useSmoke(this.player, this);
    if (input.coin) this.tools.useCoin(this.player, this, input.coinX, input.coinY);
    if (input.freeze) this.tools.useFreeze(this.player, this);

    this.player.step(dt, input, this.solids);
    this.tools.step(dt, this);
    for (const c of this.cameras) c.step(dt);

    // Who can see the thief? Smoke blocks every cone.
    let seenByGuard = false;
    let seenByCamera = false;
    for (const g of this.guards) {
      const blocked = this.tools.blockedBySmoke(g.x, g.y, this.player.x, this.player.y);
      if (!blocked && g.canSee(this.player.x, this.player.y, this.solids)) seenByGuard = true;
    }
    for (const c of this.cameras) {
      const blocked = this.tools.blockedBySmoke(c.x, c.y, this.player.x, this.player.y);
      if (!blocked && c.canSee(this.player.x, this.player.y, this.solids)) seenByCamera = true;
    }
    const anySuspicious = this.guards.some((g) => g.suspicion >= 0.5);

    if (seenByGuard) {
      this.addHeat(HEAT.guardSeenPerSecond * dt);
      this.heatQuietFor = 0;
    } else if (seenByCamera) {
      this.addHeat(HEAT.cameraSeenPerSecond * dt);
      this.heatQuietFor = 0;
    } else if (anySuspicious) {
      this.addHeat(HEAT.suspiciousLookPerSecond * dt);
      this.heatQuietFor = 0;
    } else {
      this.heatQuietFor += dt;
      if (this.heatQuietFor > HEAT.decayDelay) {
        const floor = this.lockdownFired ? HEAT.lockdownFloor : 0;
        this.heat = Math.max(floor, this.heat - HEAT.decayPerSecond * dt);
      }
    }

    if (this.heat >= HEAT.lockdownAt && this.lockdownLeft <= 0) {
      this.lockdownLeft = HEAT.lockdownSeconds;
      this.lockdownFired = true;
      this.log('LOCKDOWN — the airlock seals, every guard converges');
      for (const g of this.guards) {
        g.state = GUARD_STATE.CHASE;
        g.suspicion = 1;
      }
    }
    if (this.lockdownLeft > 0) {
      this.lockdownLeft -= dt;
      if (this.lockdownLeft <= 0) this.log('Lockdown lifts — the airlock opens');
    }

    for (const g of this.guards) g.step(dt, this);

    // Caught: a guard closes in while chasing, or touches the thief at all.
    for (const g of this.guards) {
      const d = dist(g.x, g.y, this.player.x, this.player.y);
      if (d < GUARD.catchDistance) {
        this.state = WORLD_STATE.CAUGHT;
        this.caughtBy = g.name;
        this.score = this.computeScore();
        return;
      }
    }

    // The vial's case takes work to open: stand at it and crack it. The
    // case warms as you work it, so cracking raises the heat. Progress
    // holds when you step away, fading slowly.
    const vialD = dist(this.player.x, this.player.y, this.room.vial.x, this.room.vial.y);
    this.cracking = !this.vialTaken && vialD < HEIST.crackRadius;
    if (this.cracking) {
      this.crackProgress += dt / HEIST.crackSeconds;
      this.addHeat(HEIST.crackHeatPerSecond * dt);
      if (this.crackProgress >= 1) {
        this.vialTaken = true;
        this.player.hasVial = true;
        this.log('The Amber Vial is yours — reach the airlock');
      }
    } else if (!this.vialTaken) {
      this.crackProgress = Math.max(0, this.crackProgress - (HEIST.crackDecayPerSecond * dt) / HEIST.crackSeconds);
    }

    // The airlock cycles open: stand in it and it opens. Sealed in lockdown.
    if (this.vialTaken && this.exitOpen && pointInRect(this.player.x, this.player.y, this.room.exit)) {
      this.exitProgress += dt / HEIST.exitSeconds;
      if (this.exitProgress >= 1) {
        this.state = WORLD_STATE.WON;
        this.score = this.computeScore();
      }
    } else {
      this.exitProgress = Math.max(0, this.exitProgress - dt / HEIST.exitSeconds);
    }
  }

  computeScore() {
    const timeBonus = Math.max(0, Math.round(240 - this.time) * SCORE.timeBonusPerSecond);
    const heatBonus = Math.round((HEAT.max - this.heat) * SCORE.heatBonusPerPoint);
    return SCORE.base + timeBonus + heatBonus;
  }

  reset(seed) {
    const fresh = new World(this.roomIndex, seed);
    Object.assign(this, fresh);
  }
}
