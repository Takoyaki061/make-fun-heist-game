// Keyboard and mouse, as one plain object the world reads each step.
// Click tosses a coin at the mouse; keys 1 and 3 fire the other tools.
// Edge-triggered actions (smoke/coin/freeze/pause) are consumed by main.js.
export class Input {
  constructor(canvas) {
    this.left = false;
    this.right = false;
    this.up = false;
    this.down = false;
    this.sneak = false;
    this.smoke = false;
    this.coin = false;
    this.freeze = false;
    this.coinX = 0;
    this.coinY = 0;
    this.enter = false;
    this.pause = false;
    this.restart = false;
    this.mute = false;
    this.keys = new Set();
    this.canvas = canvas;
    this.attach();
  }

  attach() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      this.syncKeys();
      if (e.code === 'Digit1') this.smoke = true;
      if (e.code === 'Digit3') this.freeze = true;
      if (e.code === 'Enter') this.enter = true;
      if (e.code === 'KeyP') this.pause = true;
      if (e.code === 'KeyR') this.restart = true;
      if (e.code === 'KeyM') this.mute = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      this.syncKeys();
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.syncKeys();
    });
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.coinX = (e.clientX - rect.left) * scaleX;
      this.coinY = (e.clientY - rect.top) * scaleY;
      this.coin = true;
    });
  }

  syncKeys() {
    const k = this.keys;
    this.left = k.has('ArrowLeft') || k.has('KeyA');
    this.right = k.has('ArrowRight') || k.has('KeyD');
    this.up = k.has('ArrowUp') || k.has('KeyW');
    this.down = k.has('ArrowDown') || k.has('KeyS');
    this.sneak = k.has('ShiftLeft') || k.has('ShiftRight');
  }

  /** Clear the edge-triggered flags after the world has read them. */
  consumeEdges() {
    this.smoke = false;
    this.coin = false;
    this.freeze = false;
    this.enter = false;
    this.pause = false;
    this.restart = false;
    this.mute = false;
  }
}
