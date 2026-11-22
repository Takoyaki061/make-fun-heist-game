// Every pixel of the game: the frosted vault floor, lamp pools, walls, pods,
// vision cones, cameras, the thief, the vial, the airlock, and the HUD with
// its heat thermometer. Screens (title, pause, caught, getaway) are panels
// over the live vault, so the room stays visible behind them.
import { CAMERA, GUARD, HEAT, PALETTE, VIEW } from './config.js';
import { WORLD_STATE } from './world.js';
import { mulberry32 } from './random.js';

const HUD_H = 34;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.frostSeeds = {};
  }

  frostFor(roomIndex) {
    if (!this.frostSeeds[roomIndex]) {
      const rand = mulberry32(1000 + roomIndex * 77);
      const spots = [];
      for (let i = 0; i < 90; i += 1) {
        spots.push({ x: rand() * VIEW.width, y: rand() * VIEW.height, r: 1 + rand() * 3, a: 0.04 + rand() * 0.1 });
      }
      this.frostSeeds[roomIndex] = spots;
    }
    return this.frostSeeds[roomIndex];
  }

  draw(world, screen, ui) {
    const ctx = this.ctx;
    const room = world.room;
    ctx.clearRect(0, 0, VIEW.width, VIEW.height);

    // Floor: cold blue-grey slabs with faint seams and frost speckles.
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.strokeStyle = PALETTE.floorLine;
    ctx.lineWidth = 1;
    for (let x = 0; x <= VIEW.width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, VIEW.height);
      ctx.stroke();
    }
    for (let y = 0; y <= VIEW.height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(VIEW.width, y);
      ctx.stroke();
    }
    for (const s of this.frostFor(world.roomIndex)) {
      ctx.fillStyle = `rgba(159,196,221,${s.a})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Warm lamp pools: the thief reads best inside bright light.
    for (const [lx, ly] of [[180, 150], [480, 330], [780, 150], [480, 520]]) {
      const g = ctx.createRadialGradient(lx, ly, 10, lx, ly, 190);
      g.addColorStop(0, 'rgba(255,196,110,0.13)');
      g.addColorStop(1, 'rgba(255,196,110,0)');
      ctx.fillStyle = g;
      ctx.fillRect(lx - 190, ly - 190, 380, 380);
    }

    // Walls.
    for (const w of room.walls) this.drawWall(w);
    // Cold-sleep pods: cyan glow, frosted glass.
    for (const p of room.pods) {
      ctx.fillStyle = PALETTE.pod;
      this.roundRect(p.x, p.y, p.w, p.h, 8);
      ctx.fill();
      ctx.strokeStyle = PALETTE.podGlow;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.8;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(87,215,232,0.25)';
      ctx.beginPath();
      ctx.ellipse(p.x + p.w / 2, p.y + p.h / 2, p.w / 2 - 8, p.h / 2 - 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Crates.
    for (const c of room.crates) {
      ctx.fillStyle = PALETTE.crate;
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = PALETTE.floorLine;
      ctx.strokeRect(c.x + 0.5, c.y + 0.5, c.w, c.h);
    }

    // The airlock exit: green when open, sealed red during lockdown.
    const exit = room.exit;
    ctx.fillStyle = world.exitOpen ? PALETTE.exit : world.vialTaken ? '#7a2e22' : '#274b34';
    ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
    ctx.strokeStyle = world.exitOpen ? '#b8ffce' : PALETTE.frost;
    ctx.lineWidth = 2;
    ctx.strokeRect(exit.x, exit.y, exit.w, exit.h);
    ctx.fillStyle = '#eafff1';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(world.lockdownLeft > 0 ? 'SEALED' : 'EXIT', exit.x + exit.w / 2, exit.y + exit.h / 2 + 5);
    // The airlock cycle bar: how far open it is.
    if (world.exitProgress > 0) {
      ctx.fillStyle = '#22384f';
      ctx.fillRect(exit.x, exit.y + exit.h + 4, exit.w, 5);
      ctx.fillStyle = PALETTE.exit;
      ctx.fillRect(exit.x, exit.y + exit.h + 4, exit.w * world.exitProgress, 5);
    }

    // The Amber Vial: the only saturated yellow in the room.
    if (!world.vialTaken) {
      const pulse = 0.6 + 0.4 * Math.sin(world.time * 3);
      const g = ctx.createRadialGradient(room.vial.x, room.vial.y, 2, room.vial.x, room.vial.y, 34);
      g.addColorStop(0, `rgba(255,210,62,${0.55 * pulse})`);
      g.addColorStop(1, 'rgba(255,210,62,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(room.vial.x, room.vial.y, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.loot;
      ctx.beginPath();
      ctx.arc(room.vial.x, room.vial.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff3c4';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#fff3c4';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('VIAL', room.vial.x, room.vial.y - 14);
      // The crack ring: how far open the case is.
      if (world.crackProgress > 0) {
        ctx.strokeStyle = PALETTE.loot;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(room.vial.x, room.vial.y, 16, -Math.PI / 2, -Math.PI / 2 + world.crackProgress * Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = PALETTE.loot;
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('CRACKING…', room.vial.x, room.vial.y + 30);
      }
    }

    // Smoke clouds.
    for (const s of world.tools.activeSmoke) {
      ctx.fillStyle = PALETTE.smoke;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Tossed coins.
    for (const c of world.tools.coins) {
      ctx.fillStyle = PALETTE.loot;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,210,62,0.7)';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 10 + 3 * Math.sin(world.time * 6), 0, Math.PI * 2);
      ctx.stroke();
    }

    // Camera cones first (under the guards), then guards, then the thief.
    for (const cam of world.cameras) this.drawCameraCone(cam);
    for (const g of world.guards) this.drawCone(g);
    for (const cam of world.cameras) this.drawCamera(cam);
    for (const g of world.guards) this.drawGuard(g, world.time);
    this.drawPlayer(world);

    this.drawHud(world, screen, ui);
    if (screen === 'title') this.drawTitle(world, ui);
    if (screen === 'paused') this.drawPanel('PAUSED', 'P — resume · R — restart the vault', ui);
    if (screen === 'caught') {
      this.drawPanel(`CAUGHT by ${world.caughtBy || 'a guard'}`, `Score ${world.score} · R — try again · ENTER — back to the title`, ui);
    }
    if (screen === 'won') {
      const last = world.roomIndex === 2;
      this.drawPanel(
        'GETAWAY — the vial is yours',
        `Score ${world.score} · ${Math.round(world.time)}s · heat ${Math.round(world.heat)}` +
          (last ? ' · that was the last vault — ENTER for the title' : ' · ENTER — next vault'),
        ui,
      );
    }
  }

  drawWall(w) {
    const ctx = this.ctx;
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(w.x, w.y, w.w, 4);
    ctx.strokeStyle = '#0a1018';
    ctx.lineWidth = 1;
    ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w, w.h);
  }

  roundRect(x, y, w, h, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  drawCone(g) {
    const ctx = this.ctx;
    ctx.fillStyle = PALETTE.cone;
    ctx.strokeStyle = PALETTE.coneEdge;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.arc(g.x, g.y, GUARD.coneRange, g.angle - GUARD.coneHalfAngle, g.angle + GUARD.coneHalfAngle);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  drawCameraCone(cam) {
    const ctx = this.ctx;
    // A frozen camera keeps its last sweep, drawn faintly: it cannot see.
    ctx.fillStyle = cam.frozen ? 'rgba(255,176,66,0.07)' : PALETTE.cameraCone;
    ctx.strokeStyle = cam.frozen ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cam.x, cam.y);
    ctx.arc(cam.x, cam.y, CAMERA.range, cam.angle - CAMERA.halfAngle, cam.angle + CAMERA.halfAngle);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  drawCamera(cam) {
    const ctx = this.ctx;
    ctx.fillStyle = cam.frozen ? '#9fc4dd' : '#3a3f46';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = cam.frozen ? '#dff3ff' : '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = cam.frozen ? '#dff3ff' : PALETTE.coneEdge;
    ctx.beginPath();
    ctx.arc(cam.x + Math.cos(cam.angle) * 11, cam.y + Math.sin(cam.angle) * 11, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGuard(g, time) {
    const ctx = this.ctx;
    ctx.fillStyle = PALETTE.guardDark;
    ctx.beginPath();
    ctx.arc(g.x, g.y, GUARD.radius + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath();
    ctx.arc(g.x, g.y, GUARD.radius, 0, Math.PI * 2);
    ctx.fill();
    // Facing tick.
    ctx.strokeStyle = '#ffd9d2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * (GUARD.radius + 5), g.y + Math.sin(g.angle) * (GUARD.radius + 5));
    ctx.stroke();
    // Name and suspicion.
    ctx.fillStyle = '#ffd9d2';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(g.name, g.x, g.y - GUARD.radius - 6);
    if (g.suspicion > 0.25) {
      ctx.fillStyle = g.suspicion >= 1 ? '#ff5d47' : '#ffb042';
      ctx.font = 'bold 16px sans-serif';
      const bob = Math.sin(time * 6) * 2;
      ctx.fillText(g.suspicion >= 1 ? '!' : '?', g.x, g.y - GUARD.radius - 18 + bob);
    }
  }

  drawPlayer(world) {
    const ctx = this.ctx;
    const p = world.player;
    // A white rim so the thief survives downscaling.
    ctx.strokeStyle = PALETTE.thiefRim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = p.sneaking ? '#b9d9ea' : PALETTE.thief;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.sneaking ? 8 : 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0e1622';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(p.angle) * 14, p.y + Math.sin(p.angle) * 14);
    ctx.stroke();
    if (p.hasVial) {
      ctx.fillStyle = PALETTE.loot;
      ctx.beginPath();
      ctx.arc(p.x + 8, p.y - 8, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    if (p.sneaking) {
      ctx.strokeStyle = 'rgba(220,234,245,0.5)';
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  drawHud(world, screen, ui) {
    const ctx = this.ctx;
    const room = world.room;
    ctx.fillStyle = 'rgba(10,16,24,0.82)';
    ctx.fillRect(0, 0, VIEW.width, HUD_H);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`THAW · ${room.name}  ${world.roomIndex + 1}/3`, 12, 21);
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(world.time / 60)}:${String(Math.floor(world.time % 60)).padStart(2, '0')}`, VIEW.width / 2 - 60, 21);
    ctx.fillText(world.vialTaken ? 'VIAL ●' : 'VIAL ○', VIEW.width / 2 + 40, 21);
    ctx.textAlign = 'right';
    const p = world.player;
    ctx.fillText(`SMOKE ${p.smoke} · COIN ${p.coins} · FREEZE ${p.freeze}`, VIEW.width - 12, 21);

    // The heat thermometer: a full-width bar along the bottom edge.
    const band = world.heatBand;
    const color = band === 'lockdown' ? PALETTE.heatHot : band === 'suspicious' ? PALETTE.heatWarm : PALETTE.heatCalm;
    ctx.fillStyle = 'rgba(10,16,24,0.82)';
    ctx.fillRect(0, VIEW.height - 22, VIEW.width, 22);
    ctx.fillStyle = '#22384f';
    ctx.fillRect(90, VIEW.height - 15, VIEW.width - 102, 8);
    ctx.fillStyle = color;
    ctx.fillRect(90, VIEW.height - 15, (VIEW.width - 102) * (world.heat / HEAT.max), 8);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`HEAT ${Math.round(world.heat)}`, 10, VIEW.height - 7);
    ctx.textAlign = 'right';
    ctx.fillStyle = color;
    ctx.fillText(
      world.lockdownLeft > 0 ? `LOCKDOWN ${Math.ceil(world.lockdownLeft)}s` : band.toUpperCase(),
      VIEW.width - 12,
      VIEW.height - 7,
    );

    // Recent messages, bottom-left above the heat bar.
    ctx.textAlign = 'left';
    ctx.font = '12px sans-serif';
    world.messages.forEach((m, i) => {
      ctx.fillStyle = `rgba(220,234,245,${0.95 - i * 0.2})`;
      ctx.fillText(m.text, 12, VIEW.height - 32 - (world.messages.length - 1 - i) * 16);
    });
  }

  drawTitle(world, ui) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(6,10,16,0.55)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = 'rgba(10,16,24,0.92)';
    this.roundRect(VIEW.width / 2 - 260, 130, 520, 300, 12);
    ctx.fill();
    ctx.strokeStyle = PALETTE.frost;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText('THAW', VIEW.width / 2, 200);
    ctx.font = '15px sans-serif';
    ctx.fillStyle = PALETTE.dim;
    ctx.fillText('The Cold Vault Heist — steal the Amber Vial, reach the airlock unseen', VIEW.width / 2, 228);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '14px sans-serif';
    ctx.fillText('WASD / arrows — move · SHIFT — sneak · 1 — smoke · 2 / click — toss a coin', VIEW.width / 2, 268);
    ctx.fillText('3 — freeze the cameras · P — pause · M — mute · R — restart the vault', VIEW.width / 2, 292);
    ctx.fillStyle = PALETTE.loot;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('The vial sits under a camera — crack its case, then run for the airlock.', VIEW.width / 2, 330);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Press ENTER to begin', VIEW.width / 2, 380);
    if (ui.best > 0) {
      ctx.fillStyle = PALETTE.dim;
      ctx.font = '13px sans-serif';
      ctx.fillText(`Best score: ${ui.best}`, VIEW.width / 2, 406);
    }
  }

  drawPanel(title, subtitle, ui) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(6,10,16,0.6)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = 'rgba(10,16,24,0.94)';
    this.roundRect(VIEW.width / 2 - 280, 200, 560, 160, 12);
    ctx.fill();
    ctx.strokeStyle = PALETTE.frost;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(title, VIEW.width / 2, 258);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = PALETTE.dim;
    ctx.fillText(subtitle, VIEW.width / 2, 292);
  }
}
