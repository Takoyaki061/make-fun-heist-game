// THAW — the Cold Vault Heist: the game loop and screens.
// Title, play, pause, caught and getaway. ?shot=start|play|end stages a
// screenshot scene and raises window.__shotReady when the frame is set.
import { STEP, VIEW } from './config.js';
import { Audio } from './audio.js';
import { Input } from './input.js';
import { Renderer } from './render.js';
import { stageShot } from './shots.js';
import { World, WORLD_STATE } from './world.js';

const canvas = document.getElementById('game');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const input = new Input(canvas);
const renderer = new Renderer(canvas);
const audio = new Audio();
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '7');

let roomIndex = 0;
let world = new World(roomIndex, seed);
let screen = 'title';
let best = 0;
let last = 0;
let acc = 0;

function restartRoom() {
  world = new World(roomIndex, seed);
  screen = 'playing';
}

function nextRoom() {
  roomIndex = Math.min(2, roomIndex + 1);
  restartRoom();
}

function frame(now) {
  requestAnimationFrame(frame);
  if (!last) last = now;
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.1) dt = 0.1;

  if (input.mute) audio.toggleMute();

  if (screen === 'title') {
    if (input.enter) {
      audio.ensure();
      screen = 'playing';
    }
    acc += dt;
    while (acc >= STEP) {
      acc -= STEP;
      world.step(STEP, { left: false, right: false, up: false, down: false, sneak: false, smoke: false, coin: false, freeze: false });
      if (world.state !== WORLD_STATE.PLAYING) world = new World(roomIndex, seed);
    }
    input.consumeEdges();
    renderer.draw(world, 'title', { best });
    return;
  }

  if (input.pause && (screen === 'playing' || screen === 'paused')) {
    screen = screen === 'playing' ? 'paused' : 'playing';
  }
  if (input.restart && screen !== 'title') {
    restartRoom();
    input.consumeEdges();
    renderer.draw(world, screen, { best });
    return;
  }

  if (screen === 'playing') {
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      acc -= STEP;
      steps += 1;
      const hadVial = world.vialTaken;
      world.step(STEP, input);
      if (world.vialTaken && !hadVial) audio.pickup();
      if (world.state === WORLD_STATE.CAUGHT) {
        audio.caught();
        screen = 'caught';
      } else if (world.state === WORLD_STATE.WON) {
        audio.win();
        best = Math.max(best, world.score);
        screen = 'won';
      }
    }
    audio.alarmTick(dt, world.heat);
    input.consumeEdges();
  } else if (screen === 'caught' || screen === 'won') {
    if (input.enter) {
      if (screen === 'won' && roomIndex < 2) {
        nextRoom();
      } else {
        roomIndex = 0;
        restartRoom();
        screen = 'title';
      }
    }
    input.consumeEdges();
  } else {
    input.consumeEdges();
  }

  renderer.draw(world, screen, { best });
}

// Screenshot mode: stage the scene once, draw it, and tell the runner.
if (shot) {
  const staged = stageShot(shot, world);
  renderer.draw(world, staged, { best: 0 });
  window.__shotReady = true;
} else {
  // A tiny read-only hook for local play-testing (never used by the game).
  window.__thaw = {
    get world() {
      return world;
    },
    get screen() {
      return screen;
    },
  };
  requestAnimationFrame(frame);
}
