// Tiny WebAudio synth: no sound files, just oscillators. Pickup chime,
// alarm pulse while the heat is high, a sting when caught, a swell on the
// getaway. M mutes.
export class Audio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.alarmTimer = 0;
  }

  ensure() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  blip(freq, seconds, type, gain) {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain || 0.06, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + seconds + 0.02);
  }

  pickup() {
    this.blip(880, 0.12, 'sine', 0.07);
    setTimeout(() => this.blip(1318, 0.18, 'sine', 0.07), 90);
  }

  coin() {
    this.blip(1567, 0.08, 'triangle', 0.05);
  }

  smoke() {
    this.blip(220, 0.3, 'sawtooth', 0.03);
  }

  freeze() {
    this.blip(1760, 0.25, 'sine', 0.05);
  }

  caught() {
    this.blip(196, 0.5, 'sawtooth', 0.09);
    setTimeout(() => this.blip(147, 0.6, 'sawtooth', 0.09), 160);
  }

  win() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.blip(f, 0.22, 'sine', 0.07), i * 110));
  }

  /** A soft pulse while the heat sits in the red. */
  alarmTick(dt, heat) {
    if (this.muted || !this.ctx || heat < 75) return;
    this.alarmTimer -= dt;
    if (this.alarmTimer <= 0) {
      this.alarmTimer = 0.7;
      this.blip(440, 0.1, 'square', 0.025);
    }
  }
}
