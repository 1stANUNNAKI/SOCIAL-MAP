/**
 * Procedural Web Audio API Synthesizer directly modeled after CityRT's `shell-DPaT80uS.js`
 * Generates footsteps, jump/land thuds, dual-tone car horns, tire skids, and UI clicks with zero audio files.
 */
export class ProceduralAudioSynth {
  constructor() {
    this.ctx = null;
    this.noiseBuffer = null;
    this.muted = false;
  }

  ensureContext() {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  getNoiseBuffer(ctx) {
    if (this.noiseBuffer && this.noiseBuffer.sampleRate === ctx.sampleRate) {
      return this.noiseBuffer;
    }
    const len = Math.floor(ctx.sampleRate * 0.45);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buf;
    return buf;
  }

  playStep(sprint = false) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = this.getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime((sprint ? 780 : 620) * (0.9 + Math.random() * 0.2), t);
    filter.Q.value = 2.8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(sprint ? 0.08 : 0.05, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.065);

    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(t);
    src.stop(t + 0.07);
  }

  playJump() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(135, t);
    osc.frequency.exponentialRampToValueAtTime(240, t + 0.09);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  playLand() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(115, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  /**
   * Dual-tone harmonic car horn (`horn()` in `shell-DPaT80uS.js` line 1)
   */
  playHorn() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const dur = 0.28;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1050;
    filter.Q.value = 2.4;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.11, t + 0.015);
    gain.gain.setValueAtTime(0.1, t + dur - 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    filter.connect(gain).connect(ctx.destination);

    for (const freq of [415, 523]) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + dur + 0.01);
    }
  }

  playSkid() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = this.getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1850, t);
    filter.Q.value = 6.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.07, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(t);
    src.stop(t + 0.24);
  }
}

